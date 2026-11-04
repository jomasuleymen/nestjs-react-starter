export enum EnvEnvironment {
  Development = 'development',
  Production = 'production',
}

export const PINO_LOG_LEVEL = {
  Fatal: 'fatal',
  Error: 'error',
  Warn: 'warn',
  Info: 'info',
  Debug: 'debug',
  Trace: 'trace',
  Silent: 'silent',
} as const;

export type PinoLogLevel = (typeof PINO_LOG_LEVEL)[keyof typeof PINO_LOG_LEVEL];
