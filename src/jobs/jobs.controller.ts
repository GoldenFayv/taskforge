import { Body, Controller, Post } from '@nestjs/common';
import { CreateJobDto } from './dto/creat-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
    constructor(private jobsService: JobsService){}
    @Post()
    store(@Body() data: CreateJobDto){
        return this.jobsService.createJob(data);
    }
}
