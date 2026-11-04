export const FILE_QUEUE_NAME = 'files';

export enum FileJobName {
  Cleanup = 'files.cleanup',
}

export interface FileCleanupJobPayload {
  scheduledAt: string;
}
