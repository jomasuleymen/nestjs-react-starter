import { mutationOptions } from '@tanstack/react-query';

import type { ApiError } from '@api/http';

import type {
  DeleteFileVariables,
  DownloadFileVariables,
  FileDownload,
  FileRecord,
  UploadFileVariables,
} from '../model/file';
import { deleteFile, downloadFile, uploadFile } from './fileService';

export const uploadFileMutationOptions = () =>
  mutationOptions<FileRecord, ApiError, UploadFileVariables>({
    mutationFn: (variables) => uploadFile(variables),
    mutationKey: ['files', 'upload'],
  });

export const downloadFileMutationOptions = () =>
  mutationOptions<FileDownload, ApiError, DownloadFileVariables>({
    mutationFn: downloadFile,
    mutationKey: ['files', 'download'],
  });

export const deleteFileMutationOptions = () =>
  mutationOptions<void, ApiError, DeleteFileVariables>({
    mutationFn: deleteFile,
    mutationKey: ['files', 'delete'],
  });
