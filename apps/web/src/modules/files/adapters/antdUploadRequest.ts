import type { UploadProps } from 'antd';

import { ApiError, normalizeApiError } from '@api/http';

import { uploadFile } from '../api/fileService';
import type { FileRecord, FileUploadProgress } from '../model/file';

type ContentTypeOption = string | ((file: File) => string | undefined);

export interface CreateAntdUploadRequestOptions {
  checksum?: boolean;
  contentType?: ContentTypeOption;
  onProgress?: (progress: FileUploadProgress, file: File) => void;
}

export type AntdUploadRequest = NonNullable<UploadProps<FileRecord>['customRequest']>;

const resolveContentType = (
  option: ContentTypeOption | undefined,
  file: File,
): string | undefined => (typeof option === 'function' ? option(file) : option);

export const createAntdUploadRequest =
  (options: CreateAntdUploadRequestOptions = {}): AntdUploadRequest =>
  (request) => {
    const controller = new AbortController();

    if (!(request.file instanceof File)) {
      request.onError?.(
        new ApiError('Компонент загрузки не передал объект File', { kind: 'validation' }),
      );
      return { abort: () => controller.abort() };
    }

    const file = request.file;
    void uploadFile({
      checksum: options.checksum,
      contentType: resolveContentType(options.contentType, file),
      file,
      onProgress: (progress) => {
        request.onProgress?.({ percent: progress.percent }, file);
        options.onProgress?.(progress, file);
      },
      signal: controller.signal,
    }).then(
      (uploadedFile) => request.onSuccess?.(uploadedFile, file),
      (error: unknown) => request.onError?.(normalizeApiError(error)),
    );

    return { abort: () => controller.abort() };
  };
