import { Job, JobExecutionStatus } from "src/generated/prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateJobExecutionDto } from "./dto/create-job-execution.dto";
import { UpdateJobExecutionDto } from "./dto/update-job-execution.dto";
import { identity } from "rxjs";
import { JobExecutionGetPayload } from "src/generated/prisma/models";
import { LoggerService } from "src/logger.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class JobExecutionService {
    constructor(private prismaService: PrismaService, private logger: LoggerService) { }
    async createJobX(job: Job, data: CreateJobExecutionDto): Promise<JobExecutionGetPayload<{}>> {
        this.logger.log(`After Creating Job x: ${data}`)

        return await this.prismaService.jobExecution.create({
            data: { jobId: job.id, ...data }
        })
    }

    async updateJobX(id: string, data: UpdateJobExecutionDto) {
        await this.prismaService.jobExecution.update({
            where: { id },
            data: data
        })
    }

    async findLatestByJobId(jobId: string) {
        return this.prismaService.jobExecution.findFirst({
            where: { jobId },
            orderBy: { startedAt: 'desc' },
        });
    }

    async markLatestAsAbandoned(jobId: string) {
        const execution = await this.findLatestByJobId(jobId);

        if (!execution || execution.status !== JobExecutionStatus.PROCESSING) {
            return;
        }

        return await this.prismaService.jobExecution.update({
            where: {
                id: execution.id,
            },
            data: {
                status: JobExecutionStatus.ABANDONED,
                completedAt: new Date(),
                durationMs: execution.startedAt ? Date.now() - execution.startedAt.getTime() : null,
            },
        });
    }
}