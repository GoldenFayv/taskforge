import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CreateJob } from './create-job.action';
import { ProcessJobs } from './action/process-jobs.action';
import { BullModule } from '@nestjs/bullmq';
import { LoggerService } from 'src/logger.service';
import { QueueService } from 'src/queue/queue.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
    imports: [
        PrismaModule,
        QueueModule
    ],
    controllers: [JobsController],
    providers: [JobsService, CreateJob, ProcessJobs, LoggerService]
})
export class JobsModule { }
