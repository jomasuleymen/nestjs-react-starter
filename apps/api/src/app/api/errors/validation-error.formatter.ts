import { ValidationError } from 'class-validator';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export function formatValidationErrors(errors: ValidationError[]): ValidationErrorItem[] {
  return errors.flatMap((error) => formatValidationError(error));
}

function formatValidationError(error: ValidationError, parentPath?: string): ValidationErrorItem[] {
  const field = parentPath ? `${parentPath}.${error.property}` : error.property;
  const ownErrors = Object.entries(error.constraints ?? {}).map(([constraint, message]) => ({
    field,
    message: translateValidationMessage(constraint, message),
  }));

  const childErrors = (error.children ?? []).flatMap((child) =>
    formatValidationError(child, field),
  );

  return [...ownErrors, ...childErrors];
}

function translateValidationMessage(constraint: string, message: string): string {
  switch (constraint) {
    case 'isString':
      return 'Должно быть строкой';
    case 'minLength':
      return `Минимальная длина: ${getFirstNumber(message)} символов`;
    case 'maxLength':
      return `Максимальная длина: ${getFirstNumber(message)} символов`;
    case 'matches':
      return 'Неверный формат';
    case 'isMimeType':
      return 'Должно быть MIME-типом';
    case 'isInt':
      return 'Должно быть целым числом';
    case 'min':
      return `Значение не должно быть меньше ${getFirstNumber(message)}`;
    case 'max':
      return `Значение не должно быть больше ${getFirstNumber(message)}`;
    case 'isHash':
      return 'Должно быть SHA-256 хэшем';
    case 'isDate':
      return 'Должно быть датой';
    case 'isEnum':
      return 'Недопустимое значение';
    case 'isBoolean':
      return 'Должно быть логическим значением';
    case 'isIn':
      return 'Недопустимое значение';
    case 'isNotEmpty':
      return 'Не должно быть пустым';
    case 'whitelistValidation':
      return 'Поле не разрешено';
    case 'isDurationString':
      return 'Должно быть положительной строкой длительности';
    default:
      return message;
  }
}

function getFirstNumber(message: string): string {
  return message.match(/\d+/)?.[0] ?? '';
}
