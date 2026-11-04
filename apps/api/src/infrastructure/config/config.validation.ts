import { ToBoolean } from '@common/decorators/transform/to-boolean.decorator';
import { IsDurationString } from '@common/decorators/validation/is-duration-string.decorator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { EnvEnvironment, PINO_LOG_LEVEL, PinoLogLevel } from './config.constants';

const TrimString = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

const HAS_NON_WHITESPACE = /\S/;

export class EnvironmentVariables {
  // General Application Settings
  @TrimString()
  @IsEnum(EnvEnvironment)
  @IsOptional()
  NODE_ENV: EnvEnvironment = EnvEnvironment.Development;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  PORT: number;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  CORS_ENABLED: boolean = true;

  @TrimString()
  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @TrimString()
  @IsIn(Object.values(PINO_LOG_LEVEL))
  @IsOptional()
  LOG_LEVEL: PinoLogLevel = PINO_LOG_LEVEL.Info;

  // JWT Settings
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @Matches(HAS_NON_WHITESPACE)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @Matches(HAS_NON_WHITESPACE)
  JWT_REFRESH_SECRET: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  @IsDurationString()
  JWT_ACCESS_TOKEN_TTL: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  @IsDurationString()
  JWT_REFRESH_TOKEN_TTL: string;

  // Swagger Settings
  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED: boolean = false;

  // Database Settings
  @TrimString()
  @IsString()
  @IsNotEmpty()
  DATABASE_HOST: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  DATABASE_PORT: number;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  DATABASE_USER: string;

  @IsString()
  @IsNotEmpty()
  @Matches(HAS_NON_WHITESPACE)
  DATABASE_PASSWORD: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  DATABASE_NAME: string;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  DATABASE_LOGGING: boolean = false;

  // Queue Settings
  @TrimString()
  @IsString()
  @IsNotEmpty()
  REDIS_HOST: string = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  @Matches(HAS_NON_WHITESPACE)
  REDIS_PASSWORD?: string;

  // S3 Settings
  @TrimString()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, require_tld: false })
  S3_ENDPOINT: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, require_tld: false })
  S3_PUBLIC_ENDPOINT: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  S3_BUCKET: string;

  @TrimString()
  @IsString()
  @IsNotEmpty()
  S3_REGION: string = 'us-east-1';

  @IsString()
  @IsNotEmpty()
  @Matches(HAS_NON_WHITESPACE)
  S3_ACCESS_KEY: string;

  @IsString()
  @IsNotEmpty()
  @Matches(HAS_NON_WHITESPACE)
  S3_SECRET_KEY: string;

  @ToBoolean()
  @IsBoolean()
  @IsOptional()
  S3_FORCE_PATH_STYLE: boolean = true;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config);

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidUnknownValues: true,
    validationError: {
      target: false,
      value: false,
    },
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const messages = Object.values(error.constraints ?? {}).join(', ');

        return `${error.property}: ${messages}`;
      })
      .join(', ');
    throw new Error(`Environment validation failed: ${errorMessages}`);
  }

  return Object.freeze(validatedConfig);
}
