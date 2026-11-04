import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform } from 'class-transformer';
import {
  IsHash,
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FILE_LIMITS } from '../files.constants';
import type { PresignedUpload } from '../files.types';

export class CreateUploadDto {
  @IsString()
  @MaxLength(255)
  originalName: string;

  @IsMimeType()
  @MaxLength(255)
  contentType: string;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(FILE_LIMITS.MAX_UPLOAD_SIZE_BYTES)
  sizeBytes: number;

  @ApiPropertyOptional({ description: 'Hex-encoded SHA-256 checksum' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsHash('sha256')
  @IsOptional()
  checksumSha256?: string;
}

export class UploadUrlResponseDto {
  fileId: string;
  uploadUrl: string;
  expiresAt: Date;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  requiredHeaders: Record<string, string>;

  static from(upload: PresignedUpload): UploadUrlResponseDto {
    return plainToInstance(UploadUrlResponseDto, upload);
  }
}
