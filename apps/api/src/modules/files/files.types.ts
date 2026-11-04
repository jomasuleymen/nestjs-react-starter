import { FileStatus } from '@generated/prisma/enums';

export interface CreateUploadInput {
  ownerUserId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256?: string;
}

export interface PresignedUpload {
  fileId: string;
  uploadUrl: string;
  expiresAt: Date;
  requiredHeaders: Record<string, string>;
}

export interface FileRecord {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  checksumSha256?: string;
  status: FileStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresignedDownload {
  fileId: string;
  downloadUrl: string;
  expiresAt: Date;
}

export interface FileCleanupResult {
  expiredUploads: number;
  deletedObjects: number;
  failedObjects: number;
}
