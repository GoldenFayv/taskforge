import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from './queue/queue.service';
import { QueueModule } from './queue/queue.module';
import { LoggerService } from './logger.service';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    JobsModule,
    PrismaModule,

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    BullModule.forRoot({
      connection: {
        host: "localhost",
        port: "6379"
      },
      defaultJobOptions: { removeOnComplete: true }
    }),
    QueueModule,
    MailModule
  ],
  controllers: [AppController],
  providers: [AppService, LoggerService],
  exports: [LoggerService]
})
export class AppModule { }
