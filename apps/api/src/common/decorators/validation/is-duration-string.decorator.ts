import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';
import ms from 'ms';

export function IsDurationString(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isDurationString',
      validator: {
        validate: (value: unknown): boolean => {
          if (typeof value !== 'string') {
            return false;
          }

          const duration = ms(value as ms.StringValue);

          return Number.isFinite(duration) && duration > 0;
        },
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be a positive duration string`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
