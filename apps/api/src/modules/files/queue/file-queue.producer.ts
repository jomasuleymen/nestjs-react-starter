import { BullJobOptions } from '@infra/queue/bull-queue.types';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { FILE_QUEUE_NAME, FileCleanupJobPayload, FileJobName } from './file-job.contracts';

@Injectable()
export class FileQueueProducer {
  constructor(
    @InjectQueue(FILE_QUEUE_NAME)
    private readonly queue: Queue<FileCleanupJobPayload, void, FileJobName>,
  ) {}

  async scheduleCleanup(
    payload: FileCleanupJobPayload,
    options: BullJobOptions = {},
  ): Promise<void> {
    await this.queue.add(FileJobName.Cleanup, payload, options);
  }
}
