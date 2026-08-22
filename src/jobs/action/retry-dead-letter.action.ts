import { Injectable } from "@nestjs/common";
import { DeadLetterJob, JobStatus } from "src/generated/prisma/client";
import { DeadLetterJobGetPayload } from "src/generated/prisma/models";
import { QueueService } from "src/queue/queue.service";

@Injectable()
export class RetryDeadLetter{
    constructor(private queueservice: QueueService){}
    async handle(deadLetter: DeadLetterJobGetPayload<{include:{job:true}}>){
        await this.queueservice.addQueue(deadLetter.job)
    }
}