import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Job } from 'src/generated/prisma/client';

@Injectable()
export class QueueService {
    constructor(@InjectQueue('jobs') private myQueue: Queue) { }
    private priorityMap = {
        HIGH: 1,
        MEDIUM: 2,
        LOW: 3,
    };
    async addQueue(job: Job) {
        (await this.myQueue.add(job.type, { id: job.id, payload: job.payload },
            {
                priority: this.priorityMap[job.priority],
                delay: 1000,
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 5000
                }
            }))
    }
}
