import type { CreateClientConfig } from '@api/generated/client.gen';
import { env } from '@shared/config/env';

import { httpClient } from './httpClient';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  axios: httpClient,
  baseURL: env.apiBaseUrl,
  withCredentials: true,
});
