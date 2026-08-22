import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MoveToDeadLetter {
    constructor(private prismaService: PrismaService) { }
    async handle(job: Job, error: Error) {
        const jobId = job.data?.id;

        const deadLetter = await this.prismaService.deadLetterJob.create({
            data: {
                jobId,
                type: job.name,
                payload: job.data.payload,
                error: error.message,
                attempts: job.attemptsMade,
            }
        })
    }
}