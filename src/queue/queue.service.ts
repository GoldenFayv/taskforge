import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Job } from 'src/generated/prisma/client';
import { LoggerService } from 'src/logger.service';

@Injectable()
export class QueueService {
    constructor(@InjectQueue('jobs') private myQueue: Queue, private loggerService: LoggerService) { }
    private priorityMap = {
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
    };
    async addQueue(job: Job) {
        const delay = this.computeDelay(job.scheduledAt);

        try {
            (await this.myQueue.add(job.type, { id: job.id, payload: job.payload },
                {
                    priority: this.priorityMap[job.priority],
                    delay: delay,
                    attempts: 5,
                    jobId: job.id,
                    backoff: {
                        type: "exponential",
                        delay: 5000
                    }
                }
            ))
        } catch (error) {
            this.loggerService.error(`Failed to enqueue job ${job.id}`);
        }
    }

    async getAQueue(jobId: string) {
        const queue = await this.myQueue.getJob(jobId)

        if (!queue) {
            throw new NotFoundException("Queue not there")
        }

        return queue;
    }

    async removeQueue(job: Job): Promise<void> {
        const bullJob = await this.getAQueue(job.id);
        const nonRemovableStates = ['waiting', 'delayed'];
        const state = await bullJob.getState();

        if (nonRemovableStates.includes(state)) {
            throw new ConflictException(`Cannot remove job in state "${state}"`);
        }

        await bullJob.remove();
    }

    private computeDelay(scheduledAt: Date | null): number {
        if (!scheduledAt) return 0;
        const diff = scheduledAt.getTime() - Date.now();
        return diff > 0 ? diff : 0;
    }
}
