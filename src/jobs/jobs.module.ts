import { Module } from '@nestjs/common';
import { LoggerService } from 'src/logger.service';
import { MailService } from 'src/mail/mail.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { QueueModule } from 'src/queue/queue.module';
import { MoveToDeadLetter } from './action/move-to-dead-letter.action';
import { ProcessJobs } from './action/process-jobs.action';
import { CreateJob } from './action/create-job.action';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { DeadLetterService } from './dead-letter.service';
import { DeadLetterController } from './dead-letter.controller';
import { RetryDeadLetter } from './action/retry-dead-letter.action';
import { RetryDeadLetterController } from './retry-dead-letter.controller';
import { EmailJobHandler } from './handler/email-handler.interface';

@Module({
    imports: [
        PrismaModule,
        QueueModule
    ],
    controllers: [
        JobsController,
        DeadLetterController,
        RetryDeadLetterController
    ],
    providers: [
        JobsService,
        CreateJob,
        ProcessJobs,
        LoggerService,
        MailService,
        MoveToDeadLetter,
        DeadLetterService,
        RetryDeadLetter,
        EmailJobHandler

    ]
})
export class JobsModule { }
