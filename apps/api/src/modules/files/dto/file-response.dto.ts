import { FileStatus } from '@generated/prisma/enums';
import { ApiProperty } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import type { FileRecord } from '../files.types';

export class FileResponseDto {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256?: string;

  @ApiProperty({ enum: FileStatus, enumName: 'FileStatus' })
  status: FileStatus;

  createdAt: Date;
  updatedAt: Date;

  static from(file: FileRecord): FileResponseDto {
    return plainToInstance(FileResponseDto, file);
  }
}
