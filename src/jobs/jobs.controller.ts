import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { CreateJobDto } from './dto/creat-job.dto';
import { JobsService } from './jobs.service';
import { FindJobsDto } from './dto/find-jobs.dto';

@Controller('jobs')
export class JobsController {
    constructor(private jobsService: JobsService){}
    @Post()
    store(@Body() data: CreateJobDto, @Headers('idempotency-key') idempotencyKey?: string){
        data.idempotencyKey = idempotencyKey
        return this.jobsService.createJob(data);
    }

    @Get()
    async index(@Query() query: FindJobsDto){
        return await this.jobsService.findJobs(query)
    }
}
