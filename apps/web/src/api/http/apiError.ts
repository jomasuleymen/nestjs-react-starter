import axios from 'axios';

export type ApiErrorKind =
  'aborted' | 'authentication' | 'authorization' | 'http' | 'network' | 'unknown' | 'validation';

interface ApiErrorOptions {
  cause?: unknown;
  details?: unknown;
  kind: ApiErrorKind;
  status?: number;
}

export class ApiError extends Error {
  readonly details?: unknown;
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
    this.details = options.details;
  }
}

const readMessage = (value: unknown): string | undefined => {
  if (typeof value !== 'object' || value === null || !('message' in value)) {
    return undefined;
  }

  return typeof value.message === 'string' ? value.message : undefined;
};

export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiError('Произошла непредвиденная ошибка', {
      kind: 'unknown',
      cause: error,
    });
  }

  if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
    return new ApiError('Запрос отменён', {
      kind: 'aborted',
      cause: error,
    });
  }

  if (!error.response) {
    return new ApiError('Сервер недоступен. Проверьте подключение.', {
      kind: 'network',
      cause: error,
    });
  }

  const status = error.response.status;
  const kind: ApiErrorKind =
    status === 401
      ? 'authentication'
      : status === 403
        ? 'authorization'
        : status === 422
          ? 'validation'
          : 'http';

  return new ApiError(readMessage(error.response.data) ?? 'Сервер не смог выполнить запрос', {
    kind,
    status,
    details: error.response.data,
    cause: error,
  });
};

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError;
