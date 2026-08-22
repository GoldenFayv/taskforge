import { Injectable, NotFoundException } from "@nestjs/common";
import { JobStatus, type DeadLetterJob, type Job, type Prisma } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { RetryDeadLetter } from "./action/retry-dead-letter.action";
import { JobsService } from "./jobs.service";

@Injectable()
export class DeadLetterService {
    constructor(private prismaService: PrismaService, private retryDeadLetter: RetryDeadLetter, private jobService: JobsService) { }
    async findAll() {
        return await this.prismaService.deadLetterJob.findMany({
            orderBy: { failedAt: 'desc' },
            include: { job: true },
            take: 50,
        });
    }
    // <DeadLetterJob | null>
    async findOne(id: string): Promise<Prisma.DeadLetterJobGetPayload<{ include: { job: true } }>> {
        const deadLetter = await this.prismaService.deadLetterJob.findUnique({
            where: { id },
            include: { job: true }
        })

        if (!deadLetter) {
            throw new NotFoundException("Resource not found")
        }

        return deadLetter;
    }

    async retry(id: string) {
        const deadLetter = await this.findOne(id);
        await this.jobService.updateJob(deadLetter.jobId, { status: JobStatus.PENDING })
        this.retryDeadLetter.handle(deadLetter)

        return deadLetter.job;
    }
}