import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PinoLogger } from 'nestjs-pino';
import { FileCleanupService } from '../cleanup/file-cleanup.service';
import { FILE_QUEUE_NAME, FileCleanupJobPayload, FileJobName } from './file-job.contracts';

@Processor(FILE_QUEUE_NAME, { concurrency: 1 })
export class FileProcessor extends WorkerHost {
  constructor(
    private readonly cleanupService: FileCleanupService,
    private readonly logger: PinoLogger,
  ) {
    super();
    this.logger.setContext(FileProcessor.name);
  }

  async process(job: Job<FileCleanupJobPayload, void, FileJobName>): Promise<void> {
    if (job.name !== FileJobName.Cleanup) {
      // oxlint-disable-next-line typescript/restrict-template-expressions -- Redis can contain jobs from a different version.
      throw new Error(`Unknown file job: ${job.name}`);
    }
    const result = await this.cleanupService.cleanup();
    this.logger.info({ jobId: job.id, ...result }, 'File cleanup completed');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error({ jobId: job?.id, err: error }, 'File job failed');
  }
}
