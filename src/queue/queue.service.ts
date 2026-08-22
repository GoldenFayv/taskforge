import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { Job } from 'src/generated/prisma/client';

@Injectable()
export class QueueService {
    constructor(@InjectQueue('jobs') private myQueue: Queue) { }

    async addQueue(job: Job) {
        (await this.myQueue.add(job.type, { id: job.id, payload: job.payload }, { delay: 1000 }))
    }
}
