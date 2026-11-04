import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_CODE, ErrorCode } from './api-error-codes';

export class ValidationErrorResponseDto {
  field: string;
  message: string;
}

export class ExceptionResponseDto {
  statusCode: number;

  @ApiProperty({ enum: ERROR_CODE, enumName: 'ErrorCode' })
  errorCode: ErrorCode;

  message: string;
  error: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;

  @ApiPropertyOptional({ type: () => ValidationErrorResponseDto, isArray: true })
  validationErrors?: ValidationErrorResponseDto[];
}
