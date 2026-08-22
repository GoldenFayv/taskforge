import { Injectable, Logger } from '@nestjs/common';
import { CreateJobDto } from './dto/creat-job.dto';
import { CreateJob } from './create-job.action';
import { QueueService } from 'src/queue/queue.service';

@Injectable()
export class JobsService {
    private readonly logger = new Logger()

    constructor(private createJobAction: CreateJob, private queueService: QueueService) { }

    async createJob(validatedData: CreateJobDto) {
        const job = await this.createJobAction.handle(validatedData)
        
        this.queueService.addQueue(job)

        return job
    }
}
