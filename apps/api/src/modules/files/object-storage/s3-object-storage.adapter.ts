import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { EnvConfigService } from '@infra/config/config.service';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { PinoLogger } from 'nestjs-pino';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { base64ChecksumToHex, hexChecksumToBase64 } from '../files.utils';
import { ObjectNotFoundError, ObjectStorageError } from './object-storage.errors';
import {
  ObjectStorage,
  PresignDownloadInput,
  PresignUploadInput,
  StoredObjectMetadata,
} from './object-storage.port';

const MAX_ATTEMPTS = 3;
const MAX_SOCKETS = 50;

@Injectable()
export class S3ObjectStorageAdapter implements ObjectStorage, OnModuleDestroy {
  private readonly internalClient: S3Client;
  private readonly publicClient: S3Client;

  constructor(
    private readonly config: EnvConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(S3ObjectStorageAdapter.name);
    this.internalClient = this.createClient(this.config.getS3Endpoint());
    this.publicClient = this.createClient(this.config.getS3PublicEndpoint());
  }

  onModuleDestroy(): void {
    this.internalClient.destroy();
    this.publicClient.destroy();
  }

  async presignUpload(input: PresignUploadInput): Promise<string> {
    try {
      return await getSignedUrl(
        this.publicClient,
        new PutObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
          ContentType: input.contentType,
          ChecksumSHA256: input.checksumSha256
            ? hexChecksumToBase64(input.checksumSha256)
            : undefined,
        }),
        { expiresIn: input.expiresInSeconds },
      );
    } catch (error) {
      this.throwStorageError(error, input.bucket, input.key, 'presignUpload');
    }
  }

  async presignDownload(input: PresignDownloadInput): Promise<string> {
    try {
      return await getSignedUrl(
        this.publicClient,
        new GetObjectCommand({
          Bucket: input.bucket,
          Key: input.key,
          ResponseContentDisposition: input.contentDisposition,
        }),
        { expiresIn: input.expiresInSeconds },
      );
    } catch (error) {
      this.throwStorageError(error, input.bucket, input.key, 'presignDownload');
    }
  }

  async getMetadata(bucket: string, key: string): Promise<StoredObjectMetadata> {
    try {
      const result = await this.internalClient.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key, ChecksumMode: 'ENABLED' }),
      );

      return {
        contentLength: result.ContentLength ?? 0,
        contentType: result.ContentType,
        checksumSha256: base64ChecksumToHex(result.ChecksumSHA256),
      };
    } catch (error) {
      this.throwStorageError(error, bucket, key, 'getMetadata');
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    try {
      await this.internalClient.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    } catch (error) {
      this.throwStorageError(error, bucket, key, 'delete');
    }
  }

  private createClient(endpoint: string): S3Client {
    return new S3Client({
      endpoint,
      region: this.config.getS3Region(),
      forcePathStyle: this.config.getS3ForcePathStyle(),
      credentials: {
        accessKeyId: this.config.getS3AccessKey(),
        secretAccessKey: this.config.getS3SecretKey(),
      },
      maxAttempts: MAX_ATTEMPTS,
      requestHandler: new NodeHttpHandler({
        connectionTimeout: 3_000,
        requestTimeout: 30_000,
        httpsAgent: new HttpsAgent({ maxSockets: MAX_SOCKETS }),
        httpAgent: new HttpAgent({ maxSockets: MAX_SOCKETS }),
      }),
    });
  }

  private throwStorageError(error: unknown, bucket: string, key: string, operation: string): never {
    const statusCode =
      error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownS3Error';

    if (statusCode === 404 || errorName === 'NoSuchKey' || errorName === 'NotFound') {
      throw new ObjectNotFoundError();
    }

    this.logger.error({ err: error, bucket, key, operation, statusCode }, 'S3 operation failed');
    throw new ObjectStorageError('Object storage operation failed', { cause: error });
  }
}
