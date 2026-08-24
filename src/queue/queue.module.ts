import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BullModule } from '@nestjs/bullmq';
import { LoggerService } from 'src/logger.service';

@Module({
    imports: [
        BullModule.registerQueue({ name: "jobs" }),
    ],
    providers: [QueueService, LoggerService],
    exports: [QueueService]
})
export class QueueModule { }
