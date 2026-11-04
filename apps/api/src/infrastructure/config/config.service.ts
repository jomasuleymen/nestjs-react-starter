import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { EnvEnvironment, PinoLogLevel } from './config.constants';
import { EnvironmentVariables } from './config.validation';

@Injectable()
export class EnvConfigService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables, true>) {}

  /* GENERAL APPLICATION SETTINGS */
  getNodeEnv(): EnvEnvironment {
    return this.configService.getOrThrow('NODE_ENV', { infer: true });
  }

  getPort(): number {
    return this.configService.getOrThrow('PORT', { infer: true });
  }

  getCorsEnabled(): boolean {
    return this.configService.getOrThrow('CORS_ENABLED', { infer: true });
  }

  getCorsOrigins(): string[] | undefined {
    const value = this.configService.get('CORS_ORIGINS', { infer: true });

    if (!value) {
      return undefined;
    }

    return value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  getLogLevel(): PinoLogLevel {
    return this.configService.getOrThrow('LOG_LEVEL', { infer: true });
  }

  /* JWT SETTINGS */
  getJwtAccessSecret(): string {
    return this.configService.getOrThrow('JWT_ACCESS_SECRET', { infer: true });
  }

  getJwtRefreshSecret(): string {
    return this.configService.getOrThrow('JWT_REFRESH_SECRET', { infer: true });
  }

  getJwtAccessTokenTtlSeconds(): number {
    const value = this.configService.getOrThrow('JWT_ACCESS_TOKEN_TTL', { infer: true });

    return Math.floor(ms(value as ms.StringValue) / ms('1s'));
  }

  getJwtRefreshTokenTtlSeconds(): number {
    const value = this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL', { infer: true });

    return Math.floor(ms(value as ms.StringValue) / ms('1s'));
  }

  /* SWAGGER SETTINGS */
  getSwaggerEnabled(): boolean {
    return this.configService.getOrThrow('SWAGGER_ENABLED', { infer: true });
  }

  /* DATABASE SETTINGS */
  getDatabaseUrl(): string {
    const user = encodeURIComponent(this.getDatabaseUser());
    const password = encodeURIComponent(this.getDatabasePassword());
    const host = this.getDatabaseHost();
    const port = this.getDatabasePort();
    const database = this.getDatabaseName();

    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  }

  getDatabaseHost(): string {
    return this.configService.getOrThrow('DATABASE_HOST', { infer: true });
  }

  getDatabasePort(): number {
    return this.configService.getOrThrow('DATABASE_PORT', { infer: true });
  }

  getDatabaseUser(): string {
    return this.configService.getOrThrow('DATABASE_USER', { infer: true });
  }

  getDatabasePassword(): string {
    return this.configService.getOrThrow('DATABASE_PASSWORD', { infer: true });
  }

  getDatabaseName(): string {
    return this.configService.getOrThrow('DATABASE_NAME', { infer: true });
  }

  getDatabaseLogging(): boolean {
    return this.configService.getOrThrow('DATABASE_LOGGING', { infer: true });
  }

  /* QUEUE SETTINGS */
  getRedisHost(): string {
    return this.configService.getOrThrow('REDIS_HOST', { infer: true });
  }

  getRedisPort(): number {
    return this.configService.getOrThrow('REDIS_PORT', { infer: true });
  }

  getRedisPassword(): string | undefined {
    return this.configService.get('REDIS_PASSWORD', { infer: true });
  }

  /* S3 SETTINGS */
  getS3Endpoint(): string {
    return this.configService.getOrThrow('S3_ENDPOINT', { infer: true });
  }

  getS3PublicEndpoint(): string {
    return this.configService.getOrThrow('S3_PUBLIC_ENDPOINT', { infer: true });
  }

  getS3Bucket(): string {
    return this.configService.getOrThrow('S3_BUCKET', { infer: true });
  }

  getS3Region(): string {
    return this.configService.getOrThrow('S3_REGION', { infer: true });
  }

  getS3AccessKey(): string {
    return this.configService.getOrThrow('S3_ACCESS_KEY', { infer: true });
  }

  getS3SecretKey(): string {
    return this.configService.getOrThrow('S3_SECRET_KEY', { infer: true });
  }

  getS3ForcePathStyle(): boolean {
    return this.configService.getOrThrow('S3_FORCE_PATH_STYLE', { infer: true });
  }
}
