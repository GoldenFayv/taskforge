import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { JobExecutionStatus, JobStatus } from "src/generated/prisma/enums";
import { LoggerService } from "src/logger.service";
import { PrismaService } from "src/prisma/prisma.service";
import { EmailJobHandler } from "../handler/email-handler.interface";
import { MoveToDeadLetter } from "./move-to-dead-letter.action";
import { QueueService } from "src/queue/queue.service";
import { JobsService } from "../jobs.service";
import { JobExecutionService } from "../job-execution.service";
import { Prisma } from "src/generated/prisma/client";

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
        private jobService: JobsService,
        private jobXService: JobExecutionService
    ) {
        super()
        this.handlers = new Map([
            [emailHandler.type, emailHandler],
        ]);
    }

    async process(job: Job) {
        const jobId = job.data.id;
        const startedAt = new Date()
        const attempt = job.attemptsMade + 1;

        const jobDb = await this.prismaService.job.update({
            where: { id: jobId },
            data: {
                status: JobStatus.PROCESSING,
                attempts: attempt
            }
        });

        const data = { startedAt, attempt: attempt, status: JobExecutionStatus.PROCESSING };

        const jobX = await this.jobXService.createJobX(jobDb, data)

        console.log(`STARTING JOB ${job.data.id}`)

        await new Promise(resolve => setTimeout(resolve, 120_000));

        console.log(`FINISHED JOB ${job.data.id}`);



        try {
            const handler = this.handlers.get(job.name)

            if (!handler) {
                throw new Error(`Unsupported job type: ${job.name}`);
            }

            await handler.handle(job);

            const completedAt = new Date()

            await this.jobXService.updateJobX(jobX.id, { completedAt: completedAt, status: JobExecutionStatus.COMPLETED, durationMs: completedAt.getTime() - jobX.startedAt.getTime() })

            return true;
        } catch (error) {
            const completedAt = new Date()

            await this.jobXService.updateJobX(jobX.id, { completedAt: completedAt, status: JobExecutionStatus.FAILED, durationMs: completedAt.getTime() - jobX.startedAt.getTime(), error: error instanceof Error ? error.message : String(error), })

            throw error;
        }
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job) {
        const jobId = job.id

        await this.prismaService.job.update({
            where: { id: jobId },
            data: {
                status: JobStatus.COMPLETED,
                attempts: job.attemptsMade
            },
        });

        this.logger.log(`Job completed: ${jobId}`);
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job, error: Error) {
        const jobId = job.data.id;

        const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);

        try {
            if (!isFinalAttempt) {
                await this.prismaService.job.update({
                    where: { id: jobId },
                    data: { status: JobStatus.RETRYING, attempts: job.attemptsMade },
                });
                return;
            }

            await this.prismaService.job.update({
                where: { id: jobId },
                data: { status: JobStatus.FAILED, attempts: job.attemptsMade },
            });
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
                this.logger.error(`Job ${jobId} not found in DB during onFailed — skipping DB update`);
                return; // job row is gone; nothing more to update
            }
            throw err;
        }

        const jobDb = await this.jobService.findOneJob(jobId)

        await this.queueService.removeQueue(jobDb)

        await this.moveToDeadLetter.handle(job, error)

        this.logger.log(`Job ${jobId} moved to dead letter queue`);
    }

    @OnWorkerEvent('stalled')
    async onStalled(jobId: string) {
        const bullJob = await this.queueService.getAQueue(jobId)

        const dbJobId = bullJob.data.id;

        await this.jobXService.markLatestAsAbandoned(dbJobId);
    }
}