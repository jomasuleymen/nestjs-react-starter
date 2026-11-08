import { EnvConfigService } from '@infra/config/config.service';
import { BadRequestException, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import bodyParser from 'body-parser';
import { ValidationError } from 'class-validator';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ERROR_CODE } from './errors/api-error-codes';
import { formatValidationErrors } from './errors/validation-error.formatter';

export const setupApiRouting = (app: NestExpressApplication): void => {
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.MEDIA_TYPE,
    key: 'v=',
  });
};

const setupValidation = (app: NestExpressApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          errorCode: ERROR_CODE.VALIDATION_FAILED,
          message: 'Ошибка валидации',
          validationErrors: formatValidationErrors(errors),
        }),
    }),
  );
};

const setupHttpMiddleware = (app: NestExpressApplication): void => {
  app.set('query parser', 'extended');
  app.use(cookieParser());
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
  app.use(compression());
};

const setupSecurity = (app: NestExpressApplication): void => {
  const config = app.get(EnvConfigService);

  app.use(helmet());

  if (config.getCorsEnabled()) {
    app.enableCors({
      origin: config.getCorsOrigins() ?? false,
      credentials: true,
    });
  }

  app.set('trust proxy', true);
};

export const createOpenApiDocument = (app: NestExpressApplication): OpenAPIObject => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Starter API')
    .setDescription('Authentication and file storage API')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .addSecurityRequirements('bearer')
    .setVersion('1.0')
    .build();

  return SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replaceAll('Controller', '')}__${methodKey}`,
  });
};

const setupSwagger = (app: NestExpressApplication): void => {
  const config = app.get(EnvConfigService);

  if (!config.getSwaggerEnabled()) {
    return;
  }

  SwaggerModule.setup('swagger', app, createOpenApiDocument(app), {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    jsonDocumentUrl: '/swagger/json',
    yamlDocumentUrl: '/swagger/yaml',
  });
};

export const setupApi = (app: NestExpressApplication): void => {
  setupApiRouting(app);
  setupValidation(app);
  setupHttpMiddleware(app);
  setupSecurity(app);
  setupSwagger(app);
};
