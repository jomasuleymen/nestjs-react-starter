import { FileStatus, type File } from '@generated/prisma/client';
import { EnvConfigService } from '@infra/config/config.service';
import { PrismaService } from '@infra/database/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ALLOWED_FILE_CONTENT_TYPES, FILE_LIMITS, FILE_UPLOAD_HEADERS } from './files.constants';
import { CreateUploadInput, FileRecord, PresignedDownload, PresignedUpload } from './files.types';
import { createAttachmentDisposition, createObjectKey, hexChecksumToBase64 } from './files.utils';
import { ObjectNotFoundError, ObjectStorageError } from './object-storage/object-storage.errors';
import { OBJECT_STORAGE, ObjectStorage } from './object-storage/object-storage.port';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: EnvConfigService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
  ) {}

  async createUpload(input: CreateUploadInput): Promise<PresignedUpload> {
    this.validateUpload(input);
    const expiresAt = this.getExpiresAt(FILE_LIMITS.UPLOAD_URL_TTL_SECONDS);
    const bucket = this.config.getS3Bucket();
    const key = createObjectKey(input.ownerUserId, input.originalName);
    const file = await this.prisma.file.create({
      data: {
        ownerUserId: input.ownerUserId,
        bucket,
        key,
        originalName: input.originalName.trim(),
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        checksumSha256: input.checksumSha256,
        status: FileStatus.PENDING,
        uploadExpiresAt: expiresAt,
      },
      select: { id: true },
    });

    try {
      const uploadUrl = await this.objectStorage.presignUpload({
        bucket,
        key,
        contentType: input.contentType,
        checksumSha256: input.checksumSha256,
        expiresInSeconds: FILE_LIMITS.UPLOAD_URL_TTL_SECONDS,
      });

      return {
        fileId: file.id,
        uploadUrl,
        expiresAt,
        requiredHeaders: this.createUploadHeaders(input),
      };
    } catch (error) {
      this.throwObjectStorageException(error);
    }
  }

  async completeUpload(ownerUserId: string, fileId: string): Promise<FileRecord> {
    const file = await this.findOwnedFile(ownerUserId, fileId);

    if (file.status === FileStatus.READY) {
      return this.toFileRecord(file);
    }
    if (file.status !== FileStatus.PENDING || file.uploadExpiresAt! <= new Date()) {
      throw new NotFoundException('Файл не найден');
    }

    try {
      const metadata = await this.objectStorage.getMetadata(file.bucket, file.key);
      this.validateStoredObject(file, metadata);
    } catch (error) {
      this.throwObjectStorageException(error);
    }

    const updated = await this.prisma.file.updateMany({
      where: { id: file.id, ownerUserId, status: FileStatus.PENDING },
      data: { status: FileStatus.READY, readyAt: new Date() },
    });

    if (updated.count === 0) {
      const latest = await this.findOwnedFile(ownerUserId, fileId);
      if (latest.status === FileStatus.READY) {
        return this.toFileRecord(latest);
      }
      throw new NotFoundException('Файл не найден');
    }

    return this.toFileRecord(await this.findOwnedFile(ownerUserId, fileId));
  }

  async createDownload(ownerUserId: string, fileId: string): Promise<PresignedDownload> {
    const file = await this.findOwnedFile(ownerUserId, fileId);
    if (file.status !== FileStatus.READY) {
      throw new NotFoundException('Файл не найден');
    }

    try {
      const downloadUrl = await this.objectStorage.presignDownload({
        bucket: file.bucket,
        key: file.key,
        contentDisposition: createAttachmentDisposition(file.originalName),
        expiresInSeconds: FILE_LIMITS.DOWNLOAD_URL_TTL_SECONDS,
      });

      return {
        fileId: file.id,
        downloadUrl,
        expiresAt: this.getExpiresAt(FILE_LIMITS.DOWNLOAD_URL_TTL_SECONDS),
      };
    } catch (error) {
      this.throwObjectStorageException(error);
    }
  }

  async delete(ownerUserId: string, fileId: string): Promise<void> {
    const file = await this.prisma.$transaction(async (tx) => {
      const current = await tx.file.findFirst({ where: { id: fileId, ownerUserId } });
      if (!current) throw new NotFoundException('Файл не найден');
      if (current.status === FileStatus.DELETED || current.status === FileStatus.DELETING) {
        return null;
      }

      const claimed = await tx.file.updateMany({
        where: {
          id: current.id,
          ownerUserId,
          status: current.status,
        },
        data: { status: FileStatus.DELETING, deletedAt: new Date() },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('Состояние файла изменилось, повторите запрос');
      }

      return current;
    });
    if (!file) return;

    try {
      await this.objectStorage.delete(file.bucket, file.key);
      await this.markDeleted(file.id);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        await this.markDeleted(file.id);
      }
    }
  }

  private async findOwnedFile(ownerUserId: string, fileId: string): Promise<File> {
    const file = await this.prisma.file.findFirst({ where: { id: fileId, ownerUserId } });
    if (!file) {
      throw new NotFoundException('Файл не найден');
    }

    return file;
  }

  private async markDeleted(fileId: string): Promise<void> {
    await this.prisma.file.updateMany({
      where: { id: fileId, status: FileStatus.DELETING },
      data: { status: FileStatus.DELETED, deletedAt: new Date() },
    });
  }

  private validateUpload(input: CreateUploadInput): void {
    if (!ALLOWED_FILE_CONTENT_TYPES.includes(input.contentType as never)) {
      throw new BadRequestException('Тип файла не разрешен');
    }
    if (input.sizeBytes > FILE_LIMITS.MAX_UPLOAD_SIZE_BYTES) {
      throw new BadRequestException('Размер файла превышает допустимый лимит');
    }
  }

  private validateStoredObject(
    file: File,
    metadata: { contentLength: number; contentType?: string; checksumSha256?: string },
  ): void {
    if (metadata.contentLength !== file.sizeBytes || metadata.contentType !== file.contentType) {
      throw new BadRequestException('Загруженный объект не соответствует заявленным параметрам');
    }
    if (file.checksumSha256 && metadata.checksumSha256 !== file.checksumSha256) {
      throw new BadRequestException('Контрольная сумма загруженного объекта не совпадает');
    }
  }

  private createUploadHeaders(input: CreateUploadInput): Record<string, string> {
    const headers: Record<string, string> = {
      [FILE_UPLOAD_HEADERS.CONTENT_TYPE]: input.contentType,
    };
    if (input.checksumSha256) {
      headers[FILE_UPLOAD_HEADERS.CHECKSUM_SHA256] = hexChecksumToBase64(input.checksumSha256);
    }

    return headers;
  }

  private toFileRecord(file: File): FileRecord {
    return {
      id: file.id,
      originalName: file.originalName,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      checksumSha256: file.checksumSha256 ?? undefined,
      status: file.status,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  private getExpiresAt(ttlSeconds: number): Date {
    return new Date(Date.now() + ttlSeconds * 1_000);
  }

  private throwObjectStorageException(error: unknown): never {
    if (error instanceof ObjectNotFoundError) {
      throw new NotFoundException('Файл не найден');
    }
    if (error instanceof ObjectStorageError) {
      throw new ServiceUnavailableException('Файловое хранилище временно недоступно');
    }
    throw error;
  }
}
