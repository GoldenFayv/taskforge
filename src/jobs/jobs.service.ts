import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/creat-job.dto';
import { CreateJob } from './action/create-job.action';
import { QueueService } from 'src/queue/queue.service';
import { JobGetPayload } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';
import { JobStatus } from 'src/generated/prisma/enums';
import { FindJobsDto } from './dto/find-jobs.dto';
import { Prisma } from 'src/generated/prisma/client';
import { hashPayload } from 'src/utils/helper/helper';

@Injectable()
export class JobsService {
    constructor(private createJobAction: CreateJob, private queueService: QueueService, private prismaService: PrismaService) { }

    private async idempotencyCheck(validatedData: Record<string, any>) {
        const bodyHash = validatedData.idempotencyBodyHash

        const existingJob = await this.prismaService.job.findUnique({
            where: { idempotencyKey: validatedData.idempotencyKey },
        });

        if (existingJob) {
            if (existingJob.idempotencyBodyHash !== bodyHash) {
                throw new ConflictException('Idempotency key already used with a different request body',);
            }
            if (!existingJob.enqueuedAt) {
                await this.queueService.addQueue(existingJob);
                await this.updateJob(existingJob.id, { enqueuedAt: new Date() })
            }

            return existingJob
        };
    }

    async createJob(validatedData: CreateJobDto): Promise<JobGetPayload<{}>> {
        const bodyHash = hashPayload(validatedData)

        validatedData.idempotencyBodyHash = bodyHash;

        if (validatedData.idempotencyKey) {
            this.idempotencyCheck(validatedData);
        }

        try {
            const job = await this.createJobAction.handle(validatedData);
            await this.queueService.addQueue(job);
            await this.updateJob(job.id, { enqueuedAt: new Date() })
            return job;
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && validatedData.idempotencyKey) {
                // Another concurrent request won the race — returning the created one
                const bodyHash = hashPayload(validatedData);

                const raced = await this.prismaService.job.findUniqueOrThrow({
                    where: { idempotencyKey: validatedData.idempotencyKey },
                });

                if (raced.idempotencyBodyHash !== bodyHash) {
                    throw new ConflictException('Idempotency key already used with a different request body',);
                }

                return raced;
            }

            throw err;
        }
    }

    async findJobs(filters: FindJobsDto) {
        const { status, type, priority, skip, take } = filters;
        return await this.prismaService.job.findMany({
            where: {
                ...(status && { status }),
                ...(type && { type }),
                ...(priority && { priority }),
            },
            skip: skip ? Number(skip) : undefined,
            take: take ? Number(take) : undefined,
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOneJob(id: string): Promise<JobGetPayload<{ include: {} }>> {
        const job = await this.prismaService.job.findUnique({
            where: { id },
            include: {jobExecution: true}
        })

        if (!job) {
            throw new NotFoundException("Resource not found");
        }

        return job;
    }

    async updateJob(id: string, validatedData: Record<string, any>): Promise<true> {
        await this.prismaService.job.update({
            where: { id },
            data: {
                ...validatedData
            }
        })

        return true;
    }

    async cancelJob(id: string): Promise<JobGetPayload<{}>> {
        const job = await this.findOneJob(id);

        await this.queueService.removeQueue(job);

        // Delete corresponding dead-letter record, if any
        await this.prismaService.deadLetterJob.deleteMany({
            where: { jobId: id },
        });

        const updatedJob = await this.prismaService.job.update({
            where: { id },
            data: {
                status: JobStatus.CANCELLED,
                // deadLetterJob: {
                //     delete: true, // only valid because it's an optional 1:1 relation
                // },
            },
        });

        return updatedJob;
    }
}
