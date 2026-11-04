import { EnvConfigService } from '@infra/config/config.service';
import { isProductionEnvironment, loadEnvironment } from '@infra/config/environment.loader';
import { DynamicModule, INestApplicationContext, Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import ms from 'ms';
import { Logger } from 'nestjs-pino';
import { setupApi } from './api/api.setup';

loadEnvironment();

const PRODUCTION_LOG_LEVELS = ['warn', 'error', 'fatal'] as const;
const DEVELOPMENT_LOG_LEVELS = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'] as const;
const GRACEFUL_SHUTDOWN_TIMEOUT = ms('10s');
const LOG_FLUSH_DELAY = ms('200ms');

const createLoggerOptions = () => ({
  bufferLogs: true,
  logger: isProductionEnvironment() ? [...PRODUCTION_LOG_LEVELS] : [...DEVELOPMENT_LOG_LEVELS],
});

const setupLogger = (app: INestApplicationContext): Logger => {
  const logger = app.get<Logger>(Logger);
  app.useLogger(logger);

  return logger;
};

const setupGracefulShutdown = (app: INestApplicationContext, logger: Logger): void => {
  let shutdownPromise: Promise<void> | undefined;

  const shutdown = async (signal: string, exitCode: number): Promise<void> => {
    logger.log(`Received ${signal}. Starting graceful shutdown...`);

    const timeoutId = setTimeout(() => {
      logger.error('Graceful shutdown timeout — force exiting');
      process.exit(1);
    }, GRACEFUL_SHUTDOWN_TIMEOUT);

    try {
      await app.close();
      logger.log('Application closed gracefully');
      await new Promise((resolve) => setTimeout(resolve, LOG_FLUSH_DELAY));
      clearTimeout(timeoutId);
      process.exitCode = exitCode;

      if (exitCode !== 0) {
        process.exit(exitCode);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error(error, 'Error during shutdown');
      process.exit(1);
    }
  };

  const requestShutdown = (signal: string, exitCode = 0): void => {
    if (shutdownPromise) {
      logger.warn(`Shutdown already in progress, ignoring ${signal}`);

      return;
    }

    shutdownPromise = shutdown(signal, exitCode);
  };

  process.on('SIGINT', () => requestShutdown('SIGINT'));
  process.on('SIGTERM', () => requestShutdown('SIGTERM'));
  process.on('SIGQUIT', () => requestShutdown('SIGQUIT'));
  process.on('unhandledRejection', (reason) => {
    logger.error(reason, 'Unhandled promise rejection');
    requestShutdown('UNHANDLED_REJECTION', 1);
  });
  process.on('uncaughtException', (error) => {
    logger.error(error, 'Uncaught exception');
    requestShutdown('UNCAUGHT_EXCEPTION', 1);
  });
};

const notifyParentProcess = (logger: Logger): void => {
  if (!process.send) {
    return;
  }

  try {
    process.send('ready');
  } catch (error) {
    logger.warn(error, 'Failed to send ready signal to parent process');
  }
};

export const bootstrapHttpApplication = async (module: Type<unknown>): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(module, createLoggerOptions());

  const logger = setupLogger(app);
  setupApi(app);
  setupGracefulShutdown(app, logger);

  const port = app.get(EnvConfigService).getPort();
  await app.listen(port);
  logger.log(`API is running on port ${port}`);
  notifyParentProcess(logger);
};

export const bootstrapBackgroundApplication = async (
  module: Type<unknown> | DynamicModule,
  name: string,
): Promise<void> => {
  const app = await NestFactory.createApplicationContext(module, createLoggerOptions());
  const logger = setupLogger(app);

  setupGracefulShutdown(app, logger);
  logger.log(`${name} initialized`);
  notifyParentProcess(logger);
};

export const handleBootstrapError = (error: unknown): never => {
  console.error('Application failed to start:', error);
  process.exit(1);
};
