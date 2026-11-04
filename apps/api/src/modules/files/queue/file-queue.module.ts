import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { FILE_QUEUE_NAME } from './file-job.contracts';
import { FileQueueProducer } from './file-queue.producer';

@Module({
  imports: [BullModule.registerQueue({ name: FILE_QUEUE_NAME })],
  providers: [FileQueueProducer],
  exports: [FileQueueProducer],
})
export class FileQueueModule {}
