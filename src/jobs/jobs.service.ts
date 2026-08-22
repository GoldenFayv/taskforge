import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/creat-job.dto';
import { CreateJob } from './create-job.action';
import { QueueService } from 'src/queue/queue.service';
import { JobGetPayload } from 'src/generated/prisma/models';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JobsService {
    constructor(private createJobAction: CreateJob, private queueService: QueueService, private prismaService: PrismaService) { }

    async createJob(validatedData: CreateJobDto) {
        const job = await this.createJobAction.handle(validatedData)
        
        this.queueService.addQueue(job)

        return job
    }

    async findOneJob(id: string): Promise<JobGetPayload<{include: {}}>>{
        const job = await this.prismaService.job.findUnique({
            where: {id}
        })

        if(!job){
            throw new NotFoundException("Resource not found");
        }

        return job;
    }

    async updateJob(id: string, validatedData: Record<string, any>): Promise<true>{
        await this.prismaService.job.update({
            where: {id},
            data: {
                ...validatedData
            }
        })

        return true;
    }
}
