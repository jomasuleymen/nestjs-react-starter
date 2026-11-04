import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ApiError } from '@api/http';

import { uploadFileMutationOptions } from '../api/fileMutations';
import { uploadFile } from '../api/fileService';
import type { FileRecord, FileUploadProgress, UploadFileVariables } from '../model/file';

export type UseFileUploadOptions = Omit<
  UseMutationOptions<FileRecord, ApiError, UploadFileVariables>,
  'mutationFn' | 'mutationKey'
>;

export type UseFileUploadResult = UseMutationResult<FileRecord, ApiError, UploadFileVariables> & {
  cancel: () => void;
  progress: FileUploadProgress | null;
};

export const useFileUpload = (options?: UseFileUploadOptions): UseFileUploadResult => {
  const controllerRef = useRef<AbortController | null>(null);
  const [progress, setProgress] = useState<FileUploadProgress | null>(null);

  const mutation = useMutation({
    ...uploadFileMutationOptions(),
    ...options,
    mutationFn: async (variables) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setProgress(null);

      try {
        return await uploadFile({
          ...variables,
          onProgress: setProgress,
          signal: controller.signal,
        });
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
  });

  const resetMutation = mutation.reset;
  const cancel = useCallback(() => controllerRef.current?.abort(), []);
  const reset = useCallback(() => {
    resetMutation();
    setProgress(null);
  }, [resetMutation]);

  useEffect(() => cancel, [cancel]);

  return { ...mutation, cancel, progress, reset };
};
