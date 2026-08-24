import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { JobStatus } from "src/generated/prisma/enums";
import { LoggerService } from "src/logger.service";
import { PrismaService } from "src/prisma/prisma.service";
import { EmailJobHandler } from "../handler/email-handler.interface";
import { MoveToDeadLetter } from "./move-to-dead-letter.action";
import { QueueService } from "src/queue/queue.service";
import { JobsService } from "../jobs.service";

@Processor('jobs', {
    concurrency: 5, //a worker can process 5 tasks at a time (depends on your infracture though)
    limiter: {
        max: 100,
        duration: 60_000,
    },
})
export class ProcessJobs extends WorkerHost {
    private readonly handlers: Map<string, any>
    constructor(
        private logger: LoggerService,
        private prismaService: PrismaService,
        private moveToDeadLetter: MoveToDeadLetter,
        private emailHandler: EmailJobHandler,
        private queueService: QueueService,
        private jobService: JobsService
    ) {
        super()
        this.handlers = new Map([
            [emailHandler.type, emailHandler],
        ]);
    }

    async process(job: Job) {
        const jobId = job.data.id;
        // if (process.env.NODE_ENV === 'development') {
        //     console.log(`START ${job.id}`);
        //     await new Promise(resolve => setTimeout(resolve, 5000));
        //     console.log(`FINISH ${job.id}`);
        // }
        await this.prismaService.job.update({
            where: { id: jobId },
            data: {
                status: JobStatus.PROCESSING,
                attempts: job.attemptsMade
            }
        });

        const handler = this.handlers.get(job.name)

        if (!handler) {
            throw new Error(`Unsupported job type: ${job.name}`);
        }

        await handler.handle(job);

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

        const jobDb = await this.jobService.findOneJob(jobId)

        await this.moveToDeadLetter.handle(job, error)

        this.queueService.removeQueue(jobDb)

        this.logger.log(`Job ${jobId} moved to dead letter queue`);
    }
}