import { Module } from '@nestjs/common';
import { FileCleanupScheduler } from './file-cleanup.scheduler';
import { FileQueueModule } from './file-queue.module';

@Module({ imports: [FileQueueModule], providers: [FileCleanupScheduler] })
export class FileSchedulerModule {}
