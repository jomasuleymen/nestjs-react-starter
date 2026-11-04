import bytes from 'bytes';
import ms from 'ms';

export const FILE_LIMITS = {
  UPLOAD_URL_TTL_SECONDS: ms('15m') / ms('1s'),
  DOWNLOAD_URL_TTL_SECONDS: ms('5m') / ms('1s'),
  MAX_UPLOAD_SIZE_BYTES: bytes.parse('50MB') as number,
} as const;

export const FILE_CLEANUP = {
  BATCH_SIZE: 100,
  REPEAT_EVERY_MS: ms('15m'),
} as const;

export const ALLOWED_FILE_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const FILE_UPLOAD_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  CHECKSUM_SHA256: 'x-amz-checksum-sha256',
} as const;
