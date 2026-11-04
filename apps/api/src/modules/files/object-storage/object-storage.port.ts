export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface PresignUploadInput {
  bucket: string;
  key: string;
  contentType: string;
  checksumSha256?: string;
  expiresInSeconds: number;
}

export interface PresignDownloadInput {
  bucket: string;
  key: string;
  contentDisposition: string;
  expiresInSeconds: number;
}

export interface StoredObjectMetadata {
  contentLength: number;
  contentType?: string;
  checksumSha256?: string;
}

export interface ObjectStorage {
  presignUpload(input: PresignUploadInput): Promise<string>;
  presignDownload(input: PresignDownloadInput): Promise<string>;
  getMetadata(bucket: string, key: string): Promise<StoredObjectMetadata>;
  delete(bucket: string, key: string): Promise<void>;
}
