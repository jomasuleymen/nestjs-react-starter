import { plainToInstance } from 'class-transformer';
import type { PresignedDownload } from '../files.types';

export class DownloadUrlResponseDto {
  fileId: string;
  downloadUrl: string;
  expiresAt: Date;

  static from(download: PresignedDownload): DownloadUrlResponseDto {
    return plainToInstance(DownloadUrlResponseDto, download);
  }
}
