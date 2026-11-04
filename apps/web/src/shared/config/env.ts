import { z } from 'zod';

const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().or(z.literal('')).optional(),
});

const clientEnv = clientEnvSchema.parse(import.meta.env);

export const env = {
  apiBaseUrl: clientEnv.VITE_API_URL ?? '',
} as const;
