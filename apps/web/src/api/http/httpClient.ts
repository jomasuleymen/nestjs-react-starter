import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { RefreshResponseDto } from '@api/generated/types.gen';
import { env } from '@shared/config/env';

import { normalizeApiError } from './apiError';
import { tokenStorage } from './tokenStorage';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryAfterRefresh?: boolean;
}

const authPaths = new Set(['/api/auth/login', '/api/auth/logout', '/api/auth/refresh']);
const requestTimeout = 30_000;
const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: requestTimeout,
  withCredentials: true,
});

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: requestTimeout,
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;
let unauthorizedHandler: () => void = () => undefined;

export const setUnauthorizedHandler = (handler: () => void): void => {
  unauthorizedHandler = handler;
};

interface RefreshAttempt {
  owner: boolean;
  promise: Promise<string>;
}

const getRefreshAttempt = (): RefreshAttempt => {
  if (refreshPromise) {
    return { owner: false, promise: refreshPromise };
  }

  const promise = refreshClient
    .post<RefreshResponseDto>('/api/auth/refresh')
    .then(({ data }) => {
      tokenStorage.set(data.accessToken);
      return data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });

  refreshPromise = promise;
  return { owner: true, promise };
};

export const restoreAccessToken = async (): Promise<string> => getRefreshAttempt().promise;

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as RetryableRequestConfig | undefined;
  const requestPath = request?.url?.split('?')[0];
  const mustRefresh =
    error.response?.status === 401 &&
    request !== undefined &&
    !request._retryAfterRefresh &&
    (requestPath === undefined || !authPaths.has(requestPath));

  if (!mustRefresh) {
    throw normalizeApiError(error);
  }

  request._retryAfterRefresh = true;
  const refreshAttempt = getRefreshAttempt();
  let token: string;
  try {
    token = await refreshAttempt.promise;
  } catch (refreshError: unknown) {
    if (
      refreshAttempt.owner &&
      axios.isAxiosError(refreshError) &&
      refreshError.response?.status === 401
    ) {
      tokenStorage.clear();
      unauthorizedHandler();
    }
    throw normalizeApiError(refreshError);
  }

  request.headers.Authorization = `Bearer ${token}`;
  try {
    return await httpClient.request(request as AxiosRequestConfig);
  } catch (retryError: unknown) {
    const apiError = normalizeApiError(retryError);
    if (apiError.status === 401) {
      tokenStorage.clear();
      unauthorizedHandler();
    }
    throw apiError;
  }
});
