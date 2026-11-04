import { Module } from '@nestjs/common';
import { FilesModule } from '../files.module';
import { FileQueueModule } from './file-queue.module';
import { FileProcessor } from './file.processor';

@Module({ imports: [FilesModule, FileQueueModule], providers: [FileProcessor] })
export class FileWorkerModule {}
