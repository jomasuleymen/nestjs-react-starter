import { Module } from '@nestjs/common';
import { FileCleanupService } from './cleanup/file-cleanup.service';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { OBJECT_STORAGE } from './object-storage/object-storage.port';
import { S3ObjectStorageAdapter } from './object-storage/s3-object-storage.adapter';

@Module({
  controllers: [FilesController],
  providers: [
    FilesService,
    FileCleanupService,
    S3ObjectStorageAdapter,
    { provide: OBJECT_STORAGE, useExisting: S3ObjectStorageAdapter },
  ],
  exports: [FileCleanupService],
})
export class FilesModule {}
