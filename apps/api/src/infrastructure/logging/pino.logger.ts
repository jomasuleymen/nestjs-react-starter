import { yellow } from 'colorette';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';
import { Params } from 'nestjs-pino';
import pino from 'pino';
import { PrettyOptions } from 'pino-pretty';
import { EnvEnvironment } from '../config/config.constants';
import { EnvConfigService } from '../config/config.service';

const HEALTH_CHECK_PATHS = new Set(['/health', '/api/health']);

function getRequestId(req: IncomingMessage): string {
  const requestId = req.headers['x-request-id'];

  if (Array.isArray(requestId)) {
    return requestId[0] ?? randomUUID();
  }

  return requestId ?? randomUUID();
}

const basePinoHttpConfig = (envConfigService: EnvConfigService): Params['pinoHttp'] => ({
  level: envConfigService.getLogLevel(),
  timestamp: pino.stdTimeFunctions.isoTime,
  genReqId: getRequestId,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.accessToken',
      '*.refreshToken',
      '*.secret',
      '*.accessKey',
      '*.secretKey',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  autoLogging: {
    ignore: (req) => HEALTH_CHECK_PATHS.has(req.url ?? ''),
  },
});

const getProductionConfig = (envConfigService: EnvConfigService): Params => ({
  pinoHttp: basePinoHttpConfig(envConfigService),
});

const getDevelopmentConfig = (envConfigService: EnvConfigService): Params => ({
  pinoHttp: {
    ...basePinoHttpConfig(envConfigService),
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-MM-dd HH:mm:ss',
        levelFirst: false,
        ignore: 'pid,hostname,context',
        messageFormat: `{if context}${yellow('[{context}]')} {end}{msg}`,
      } as PrettyOptions,
    },
  },
});

export const pinoConfig = (envConfigService: EnvConfigService): Params => {
  const environmentConfig: Params =
    envConfigService.getNodeEnv() === EnvEnvironment.Production
      ? getProductionConfig(envConfigService)
      : getDevelopmentConfig(envConfigService);

  return environmentConfig;
};
