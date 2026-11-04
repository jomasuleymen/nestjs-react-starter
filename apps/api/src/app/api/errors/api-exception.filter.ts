import { Prisma } from '@generated/prisma/client';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Request, Response } from 'express';
import { Logger } from 'nestjs-pino';
import { ERROR_CODE, ErrorCode } from './api-error-codes';
import { ExceptionResponseDto } from './exception-response.dto';
import { formatValidationErrors, ValidationErrorItem } from './validation-error.formatter';

interface HttpExceptionBody {
  error?: string;
  errorCode?: ErrorCode;
  message?: string | string[] | ValidationError[];
  validationErrors?: ValidationErrorItem[];
}

interface NormalizedException {
  statusCode: number;
  errorCode: ErrorCode;
  message: string;
  error: string;
  validationErrors?: ValidationErrorItem[];
}

const HTTP_STATUS_ERROR_CODE: Partial<Record<HttpStatus, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ERROR_CODE.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ERROR_CODE.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ERROR_CODE.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ERROR_CODE.NOT_FOUND,
  [HttpStatus.CONFLICT]: ERROR_CODE.CONFLICT,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ERROR_CODE.INTERNAL_SERVER_ERROR,
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const normalized = this.normalizeException(exception);

    this.logException(exception, normalized, request);

    const exceptionResponse: ExceptionResponseDto = {
      statusCode: normalized.statusCode,
      errorCode: normalized.errorCode,
      message: normalized.message,
      error: normalized.error,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      requestId: getRequestId(request),
      validationErrors: normalized.validationErrors,
    };

    response.status(normalized.statusCode).json(exceptionResponse);
  }

  private normalizeException(exception: unknown): NormalizedException {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaException(exception);
    }

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private normalizeHttpException(exception: HttpException): NormalizedException {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        statusCode,
        errorCode: this.getErrorCode(statusCode),
        message: response,
        error: exception.name,
      };
    }

    const body = response as HttpExceptionBody;
    const validationErrors = this.getValidationErrors(body);

    return {
      statusCode,
      errorCode:
        body.errorCode ??
        (validationErrors ? ERROR_CODE.VALIDATION_FAILED : this.getErrorCode(statusCode)),
      message: this.getHttpExceptionMessage(body.message, exception.message, validationErrors),
      error: body.error ?? exception.name,
      validationErrors,
    };
  }

  private normalizePrismaException(
    exception: Prisma.PrismaClientKnownRequestError,
  ): NormalizedException {
    if (exception.code === 'P2002') {
      return {
        statusCode: HttpStatus.CONFLICT,
        errorCode: ERROR_CODE.RESOURCE_ALREADY_EXISTS,
        message: 'Resource already exists',
        error: 'Conflict',
      };
    }

    if (exception.code === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        errorCode: ERROR_CODE.RESOURCE_NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      };
    }

    if (exception.code === 'P2003') {
      return {
        statusCode: HttpStatus.CONFLICT,
        errorCode: ERROR_CODE.RELATED_RESOURCE_CONFLICT,
        message: 'Related resource constraint failed',
        error: 'Conflict',
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ERROR_CODE.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private getErrorCode(statusCode: number): ErrorCode {
    return HTTP_STATUS_ERROR_CODE[statusCode as HttpStatus] ?? ERROR_CODE.INTERNAL_SERVER_ERROR;
  }

  private getValidationErrors(body: HttpExceptionBody): ValidationErrorItem[] | undefined {
    if (body.validationErrors?.length) {
      return body.validationErrors;
    }

    if (Array.isArray(body.message) && body.message.every(isValidationError)) {
      return formatValidationErrors(body.message);
    }

    return undefined;
  }

  private getHttpExceptionMessage(
    message: HttpExceptionBody['message'],
    fallback: string,
    validationErrors?: ValidationErrorItem[],
  ): string {
    if (validationErrors) {
      return 'Validation failed';
    }

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message ?? fallback;
  }

  private logException(
    exception: unknown,
    normalized: NormalizedException,
    request: Request,
  ): void {
    const payload = {
      err: exception,
      statusCode: normalized.statusCode,
      errorCode: normalized.errorCode,
      method: request.method,
      path: request.originalUrl,
      requestId: getRequestId(request),
    };

    if (normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(payload, 'Request failed');

      return;
    }

    if (
      normalized.statusCode === HttpStatus.CONFLICT ||
      normalized.statusCode === HttpStatus.TOO_MANY_REQUESTS
    ) {
      this.logger.warn(payload, 'Request rejected');

      return;
    }

    this.logger.debug(payload, 'Request rejected');
  }
}

function isValidationError(value: unknown): value is ValidationError {
  return value instanceof ValidationError;
}

function getRequestId(request: Request): string | undefined {
  return request.id === undefined ? undefined : String(request.id);
}
