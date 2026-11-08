import type { NestExpressApplication } from '@nestjs/platform-express';
import type { OpenAPIObject } from '@nestjs/swagger';
import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

async function exportOpenApi(): Promise<void> {
  const output = resolve(__dirname, '../openapi.json');
  const temporaryOutput = `${output}.${process.pid}.tmp`;
  const originalDirectory = process.cwd();
  const emptyDirectory = await mkdtemp(join(tmpdir(), 'starter-openapi-'));

  try {
    // The configuration module reads dotenv when imported.
    process.chdir(emptyDirectory);
    process.env = {
      NODE_ENV: 'production',
      PORT: '3000',
      JWT_ACCESS_SECRET: 'openapi-export-access-placeholder',
      JWT_REFRESH_SECRET: 'openapi-export-refresh-placeholder',
      JWT_ACCESS_TOKEN_TTL: '15m',
      JWT_REFRESH_TOKEN_TTL: '1d',
      DATABASE_HOST: '127.0.0.1',
      DATABASE_PORT: '1',
      DATABASE_USER: 'openapi',
      DATABASE_PASSWORD: 'openapi',
      DATABASE_NAME: 'openapi',
      S3_ENDPOINT: 'http://127.0.0.1:1',
      S3_PUBLIC_ENDPOINT: 'http://127.0.0.1:1',
      S3_BUCKET: 'openapi',
      S3_ACCESS_KEY: 'openapi',
      S3_SECRET_KEY: 'openapi',
    };

    const { NestFactory } = await import('@nestjs/core');
    const { ApiModule } = await import('./app/api/api.module.js');
    const { createOpenApiDocument, setupApiRouting } = await import('./app/api/api.setup.js');
    const app = await NestFactory.create<NestExpressApplication>(ApiModule, {
      abortOnError: false,
      logger: false,
    });
    let document: OpenAPIObject;

    try {
      setupApiRouting(app);
      // Initialization would run the database connection hook.
      document = createOpenApiDocument(app);
    } finally {
      await app.close();
    }

    await writeFile(temporaryOutput, `${JSON.stringify(document, null, 2)}\n`);
    await rename(temporaryOutput, output);
  } finally {
    process.chdir(originalDirectory);
    await rm(emptyDirectory, { recursive: true, force: true });
    await rm(temporaryOutput, { force: true });
  }
}

void exportOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
