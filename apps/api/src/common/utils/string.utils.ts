/**
 * Utility class for string operations
 */
class StringUtils {
  static truncate(value: string | undefined, maxLength: number): string | undefined {
    if (!value) {
      return undefined;
    }

    return value.slice(0, maxLength);
  }
}

export default StringUtils;
