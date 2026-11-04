import { FileStatus, type File } from '@generated/prisma/client';
import { PrismaService } from '@infra/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { FILE_CLEANUP } from '../files.constants';
import { FileCleanupResult } from '../files.types';
import { ObjectNotFoundError } from '../object-storage/object-storage.errors';
import { OBJECT_STORAGE, ObjectStorage } from '../object-storage/object-storage.port';

@Injectable()
export class FileCleanupService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FileCleanupService.name);
  }

  async cleanup(now = new Date()): Promise<FileCleanupResult> {
    const files = await this.prisma.file.findMany({
      where: {
        OR: [
          { status: FileStatus.PENDING, uploadExpiresAt: { lte: now } },
          { status: FileStatus.DELETING },
        ],
      },
      orderBy: { updatedAt: 'asc' },
      take: FILE_CLEANUP.BATCH_SIZE,
    });
    const result: FileCleanupResult = { expiredUploads: 0, deletedObjects: 0, failedObjects: 0 };

    for (const file of files) {
      if (file.status === FileStatus.PENDING) {
        const claimed = await this.claimExpiredUpload(file.id, now);
        if (!claimed) continue;
        result.expiredUploads += 1;
      }
      await this.deleteObject(file, result);
    }

    return result;
  }

  private async claimExpiredUpload(fileId: string, now: Date): Promise<boolean> {
    const updated = await this.prisma.file.updateMany({
      where: { id: fileId, status: FileStatus.PENDING, uploadExpiresAt: { lte: now } },
      data: { status: FileStatus.DELETING, deletedAt: now },
    });

    return updated.count === 1;
  }

  private async deleteObject(file: Pick<File, 'id' | 'bucket' | 'key'>, result: FileCleanupResult) {
    try {
      await this.objectStorage.delete(file.bucket, file.key);
      await this.markDeleted(file.id);
      result.deletedObjects += 1;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        await this.markDeleted(file.id);
        result.deletedObjects += 1;

        return;
      }
      result.failedObjects += 1;
      this.logger.warn({ err: error, fileId: file.id }, 'File object cleanup failed');
    }
  }

  private async markDeleted(fileId: string): Promise<void> {
    await this.prisma.file.updateMany({
      where: { id: fileId, status: FileStatus.DELETING },
      data: { status: FileStatus.DELETED, deletedAt: new Date() },
    });
  }
}
