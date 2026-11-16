import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { FILE_CLEANUP } from '../files.constants';
import { FileQueueProducer } from './file-queue.producer';

const CLEANUP_JOB_ID = 'files:cleanup:v1';

@Injectable()
export class FileCleanupScheduler implements OnApplicationBootstrap {
  constructor(private readonly queueProducer: FileQueueProducer) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.queueProducer.scheduleCleanup(
      { scheduledAt: new Date().toISOString() },
      {
        jobId: CLEANUP_JOB_ID,
        repeat: { every: FILE_CLEANUP.REPEAT_EVERY_MS },
      },
    );
  }
}
