import { Transform } from 'class-transformer';

export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalizedValue = value.trim().toLowerCase();

    if (['true', '1'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0'].includes(normalizedValue)) {
      return false;
    }

    return value;
  });
}
