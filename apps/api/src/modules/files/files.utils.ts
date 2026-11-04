import { randomUUID } from 'node:crypto';

const UNSAFE_FILENAME_CHARACTERS = /[^a-zA-Z0-9._-]+/g;

export function createObjectKey(ownerUserId: string, originalName: string): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  return `users/${ownerUserId}/${year}/${month}/${randomUUID()}-${sanitizeFileName(originalName)}`;
}

export function sanitizeFileName(originalName: string): string {
  const sanitized = originalName.trim().replace(UNSAFE_FILENAME_CHARACTERS, '-');
  const compact = sanitized.replace(/^-+|-+$/g, '');

  return compact.slice(0, 120) || 'file';
}

export function createAttachmentDisposition(fileName: string): string {
  return `attachment; filename="${sanitizeFileName(fileName)}"`;
}

export function hexChecksumToBase64(checksum: string): string {
  return Buffer.from(checksum, 'hex').toString('base64');
}

export function base64ChecksumToHex(checksum: string | undefined): string | undefined {
  return checksum ? Buffer.from(checksum, 'base64').toString('hex') : undefined;
}
