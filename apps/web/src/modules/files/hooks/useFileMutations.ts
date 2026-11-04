import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import type { ApiError } from '@api/http';

import { deleteFileMutationOptions, downloadFileMutationOptions } from '../api/fileMutations';
import type { DeleteFileVariables, DownloadFileVariables, FileDownload } from '../model/file';

export type UseFileDownloadOptions = Omit<
  UseMutationOptions<FileDownload, ApiError, DownloadFileVariables>,
  'mutationFn' | 'mutationKey'
>;

export type UseFileDeleteOptions = Omit<
  UseMutationOptions<void, ApiError, DeleteFileVariables>,
  'mutationFn' | 'mutationKey'
>;

export const useFileDownload = (options?: UseFileDownloadOptions) =>
  useMutation({ ...downloadFileMutationOptions(), ...options });

export const useFileDelete = (options?: UseFileDeleteOptions) =>
  useMutation({ ...deleteFileMutationOptions(), ...options });
