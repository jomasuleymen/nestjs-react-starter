import type { FileStatus } from '@api/generated/types.gen';

export type FileUploadPhase = 'completing' | 'hashing' | 'requesting' | 'uploading';

export interface FileUploadProgress {
  percent: number;
  phase: FileUploadPhase;
}

export interface FileRecord {
  checksumSha256?: string;
  contentType: string;
  createdAt: string;
  id: string;
  originalName: string;
  sizeBytes: number;
  status: FileStatus;
  updatedAt: string;
}

export interface FileDownload {
  downloadUrl: string;
  expiresAt: string;
  fileId: string;
}

export interface UploadFileInput {
  checksum?: boolean;
  contentType?: string;
  file: File;
  onProgress?: (progress: FileUploadProgress) => void;
  signal?: AbortSignal;
}

export interface DownloadFileInput {
  fileId: string;
  signal?: AbortSignal;
}

export interface DeleteFileInput {
  fileId: string;
  signal?: AbortSignal;
}

export type UploadFileVariables = Pick<UploadFileInput, 'checksum' | 'contentType' | 'file'>;
export type DownloadFileVariables = Pick<DownloadFileInput, 'fileId'>;
export type DeleteFileVariables = Pick<DeleteFileInput, 'fileId'>;
