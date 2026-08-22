import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { JobStatus, JobType } from "src/generated/prisma/enums";
import { LoggerService } from "src/logger.service";
import { MailService } from "src/mail/mail.service";
import { PrismaService } from "src/prisma/prisma.service";
import { MoveToDeadLetter } from "./move-to-dead-letter.action";

@Processor('jobs')
export class ProcessJobs extends WorkerHost {
    constructor(
        private logger: LoggerService,
        private prismaService: PrismaService,
        private mailService: MailService,
        private moveToDeadLetter: MoveToDeadLetter
    ) { super() }

    async process(job: Job) {
        const jobId = job.data.id;

        await this.prismaService.job.update({
            where: { id: jobId },
            data: {
                status: JobStatus.PROCESSING,
                attempts: job.attemptsMade
            }
        });

        this.logger.log(`Processing job: ${job.id}`);
        this.logger.log(`Job name: ${job.name}`);
        this.logger.log(`Job data: ${JSON.stringify(job.data)}`);

        switch (job.name) {
            case JobType.EMAIL:
                await this.mailService.sendMail(job.data)
                break;

            default:
                break;
        }
        return true;
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job) {
        const jobId = job.data.id;

        await this.prismaService.job.update({
            where: { id: jobId },
            data: {
                status: JobStatus.COMPLETED,
                attempts: job.attemptsMade
            },
        });

        this.logger.log(`Job completed: ${jobId}`);
    }

    @OnWorkerEvent("failed")
    async onFailed(job: Job, error: Error) {
        const jobId = job.data.id

        const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

        if (!isFinalAttempt) {
            await this.prismaService.job.update({
                where: { id: jobId },
                data: {
                    status: JobStatus.RETRYING,
                    attempts: job.attemptsMade
                },
            });

            return;
        }
        await this.prismaService.job.update({
            where: { id: jobId },
            data: {
                status: JobStatus.FAILED,
                attempts: job.attemptsMade
            },
        });

        await this.moveToDeadLetter.handle(job, error)

        this.logger.log(`Job ${jobId} moved to dead letter queue`);
    }
}