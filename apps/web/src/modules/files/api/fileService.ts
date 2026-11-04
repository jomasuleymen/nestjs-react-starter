import axios from 'axios';

import {
  filesCompleteUpload,
  filesCreateDownloadUrl,
  filesCreateUpload,
  filesDeleteFile,
} from '@api/generated/sdk.gen';
import type { FileResponseDto } from '@api/generated/types.gen';
import { ApiError, normalizeApiError } from '@api/http';

import type {
  DeleteFileInput,
  DownloadFileInput,
  FileDownload,
  FileRecord,
  FileUploadProgress,
  UploadFileInput,
} from '../model/file';
import { validateFile } from '../model/filePolicy';

const abortError = (): ApiError => new ApiError('Загрузка файла отменена', { kind: 'aborted' });

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw abortError();
  }
};

const readFile = (file: File, signal?: AbortSignal): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    throwIfAborted(signal);

    const reader = new FileReader();
    const onAbort = (): void => reader.abort();
    const cleanup = (): void => signal?.removeEventListener('abort', onAbort);

    reader.addEventListener('load', () => {
      cleanup();
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new ApiError('Не удалось прочитать файл', { kind: 'unknown' }));
        return;
      }
      resolve(reader.result);
    });
    reader.addEventListener('error', () => {
      cleanup();
      reject(new ApiError('Не удалось прочитать файл', { cause: reader.error, kind: 'unknown' }));
    });
    reader.addEventListener('abort', () => {
      cleanup();
      reject(abortError());
    });
    signal?.addEventListener('abort', onAbort, { once: true });
    reader.readAsArrayBuffer(file);
  });

const calculateSha256 = async (file: File, signal?: AbortSignal): Promise<string> => {
  const content = await readFile(file, signal);
  throwIfAborted(signal);
  const hash = await crypto.subtle.digest('SHA-256', content);
  throwIfAborted(signal);

  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const toFileRecord = (file: FileResponseDto): FileRecord => ({
  checksumSha256: file.checksumSha256,
  contentType: file.contentType,
  createdAt: file.createdAt,
  id: file.id,
  originalName: file.originalName,
  sizeBytes: file.sizeBytes,
  status: file.status,
  updatedAt: file.updatedAt,
});

const reportProgress = (
  onProgress: UploadFileInput['onProgress'],
  progress: FileUploadProgress,
): void => onProgress?.(progress);

const cleanupFailedUpload = async (fileId: string): Promise<void> => {
  try {
    await filesDeleteFile({ path: { id: fileId }, throwOnError: true });
  } catch {
    // Preserve the upload error. Server-side cleanup handles stale pending files.
  }
};

export const uploadFile = async ({
  checksum = true,
  contentType: contentTypeOverride,
  file,
  onProgress,
  signal,
}: UploadFileInput): Promise<FileRecord> => {
  const contentType = validateFile(file, contentTypeOverride);
  let fileId: string | undefined;

  try {
    throwIfAborted(signal);
    let checksumSha256: string | undefined;
    if (checksum) {
      reportProgress(onProgress, { percent: 0, phase: 'hashing' });
      checksumSha256 = await calculateSha256(file, signal);
    }

    reportProgress(onProgress, { percent: 0, phase: 'requesting' });
    const uploadResponse = await filesCreateUpload({
      body: {
        checksumSha256,
        contentType,
        originalName: file.name,
        sizeBytes: file.size,
      },
      signal,
      throwOnError: true,
    });
    fileId = uploadResponse.data.fileId;

    reportProgress(onProgress, { percent: 0, phase: 'uploading' });
    await axios.put(uploadResponse.data.uploadUrl, file, {
      headers: uploadResponse.data.requiredHeaders,
      onUploadProgress: ({ loaded, total }) => {
        const uploadSize = total ?? file.size;
        const percent =
          uploadSize === 0 ? 0 : Math.min(100, Math.round((loaded / uploadSize) * 100));
        reportProgress(onProgress, { percent, phase: 'uploading' });
      },
      signal,
    });

    reportProgress(onProgress, { percent: 100, phase: 'completing' });
    const completeResponse = await filesCompleteUpload({
      path: { id: fileId },
      signal,
      throwOnError: true,
    });

    return toFileRecord(completeResponse.data);
  } catch (error: unknown) {
    if (fileId) {
      await cleanupFailedUpload(fileId);
    }
    throw normalizeApiError(error);
  }
};

const triggerBrowserDownload = (url: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
};

export const downloadFile = async ({
  fileId,
  signal,
}: DownloadFileInput): Promise<FileDownload> => {
  try {
    const response = await filesCreateDownloadUrl({
      path: { id: fileId },
      signal,
      throwOnError: true,
    });
    const download = response.data;
    throwIfAborted(signal);
    triggerBrowserDownload(download.downloadUrl);
    return download;
  } catch (error: unknown) {
    throw normalizeApiError(error);
  }
};

export const deleteFile = async ({ fileId, signal }: DeleteFileInput): Promise<void> => {
  try {
    await filesDeleteFile({ path: { id: fileId }, signal, throwOnError: true });
  } catch (error: unknown) {
    throw normalizeApiError(error);
  }
};
