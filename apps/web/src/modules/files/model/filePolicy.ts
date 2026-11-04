import { ApiError } from '@api/http';

export const MAX_FILE_SIZE_BYTES = 50_000_000;

const validationError = (message: string): ApiError =>
  new ApiError(message, { kind: 'validation' });

export const resolveFileContentType = (file: File, contentType?: string): string => {
  const explicitContentType = contentType?.trim();
  if (explicitContentType) {
    return explicitContentType.toLowerCase();
  }

  const browserContentType = file.type.trim();
  if (browserContentType) {
    return browserContentType.toLowerCase();
  }

  throw validationError('Не удалось определить MIME-тип файла. Передайте contentType явно.');
};

export const validateFile = (file: File, contentType?: string): string => {
  if (file.size === 0) {
    throw validationError('Нельзя загрузить пустой файл');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw validationError('Размер файла не должен превышать 50 МБ');
  }

  return resolveFileContentType(file, contentType);
};
