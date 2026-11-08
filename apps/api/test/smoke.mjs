import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaPg } from '@prisma/adapter-pg';
import assert from 'node:assert/strict';
import { execFileSync, fork } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import prismaModule from '../dist/generated/prisma/client.js';
import passwordModule from '../dist/modules/auth/password.service.js';

const { PrismaClient } = prismaModule;
const { PasswordService } = passwordModule;
const root = fileURLToPath(new URL('../../../', import.meta.url));
const apiRoot = fileURLToPath(new URL('../', import.meta.url));

function docker(args, env = process.env) {
  return execFileSync('docker', args, { cwd: root, env, encoding: 'utf8', timeout: 150_000 }).trim();
}

async function reserveApiPort() {
  const socket = createServer().listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const { port } = socket.address();
  const closed = once(socket, 'close');
  socket.close();
  await closed;
  return String(port);
}

async function provision(workdir, env, logins, password) {
  execFileSync(join(apiRoot, 'node_modules/.bin/prisma'), [
    'db', 'push', '--config', join(apiRoot, 'prisma.config.ts'),
  ], { cwd: workdir, env: { PATH: process.env.PATH, ...env }, timeout: 30_000 });

  const url = new URL(`postgresql://127.0.0.1:${env.DATABASE_PORT}/${env.DATABASE_NAME}`);
  url.username = env.DATABASE_USER;
  url.password = env.DATABASE_PASSWORD;
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
  try {
    const passwordHash = await new PasswordService().hashPassword(password);
    await prisma.user.createMany({ data: logins.map((login) => ({ login, passwordHash })) });
  } finally {
    await prisma.$disconnect();
  }

  const s3 = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: 'us-east-1',
    forcePathStyle: true,
    credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
  });
  try {
    await s3.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }));
  } finally {
    s3.destroy();
  }
}

await test('isolated API authentication and file ownership', { timeout: 180_000 }, async (t) => {
  const dockerEndpoint = docker(['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']);
  assert.match(dockerEndpoint, /^unix:\/\//, 'Smoke requires a local Docker socket');
  if (process.env.DOCKER_HOST) {
    assert.match(process.env.DOCKER_HOST, /^unix:\/\//, 'Smoke requires a local Docker socket');
  }

  const project = `starter-smoke-${randomUUID()}`;
  const settings = {
    DATABASE_PORT: '0',
    DATABASE_NAME: 'starter_smoke',
    DATABASE_USER: 'starter_smoke',
    DATABASE_PASSWORD: randomUUID(),
    REDIS_PORT: '0',
    REDIS_PASSWORD: randomUUID(),
    RUSTFS_API_PORT: '0',
    RUSTFS_CONSOLE_PORT: '0',
    RUSTFS_ACCESS_KEY: 'starter-smoke',
    RUSTFS_SECRET_KEY: randomUUID(),
  };
  const compose = (...args) => docker([
    'compose', '--env-file', '/dev/null', '-f', 'compose.yaml', '-p', project, ...args,
  ], { ...process.env, ...settings });
  const workdir = await mkdtemp(join(tmpdir(), 'starter-smoke-'));
  let app;
  t.after(async () => {
    try {
      if (app && app.exitCode === null && app.signalCode === null) {
        const exited = once(app, 'exit', { signal: AbortSignal.timeout(12_000) });
        app.kill('SIGTERM');
        await exited;
      }
    } finally {
      try {
        compose('down', '--volumes');
      } finally {
        await rm(workdir, { recursive: true, force: true });
      }
    }
  });

  compose('up', '-d', '--wait', '--wait-timeout', '90');
  const port = (service, internal) => {
    const published = compose('port', service, internal).split(':').at(-1);
    assert.match(published, /^[1-9]\d*$/);
    return published;
  };
  const endpoint = `http://127.0.0.1:${port('rustfs', '9000')}`;
  const env = {
    ...settings,
    PORT: await reserveApiPort(),
    NODE_ENV: 'development',
    LOG_LEVEL: 'warn',
    DATABASE_HOST: '127.0.0.1',
    DATABASE_PORT: port('postgres', '5432'),
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: port('redis', '6379'),
    JWT_ACCESS_SECRET: randomUUID(),
    JWT_REFRESH_SECRET: randomUUID(),
    JWT_ACCESS_TOKEN_TTL: '15m',
    JWT_REFRESH_TOKEN_TTL: '1d',
    S3_ENDPOINT: endpoint,
    S3_PUBLIC_ENDPOINT: endpoint,
    S3_BUCKET: 'starter-smoke',
    S3_ACCESS_KEY: settings.RUSTFS_ACCESS_KEY,
    S3_SECRET_KEY: settings.RUSTFS_SECRET_KEY,
  };
  const password = randomUUID();
  await provision(workdir, env, ['smoke-owner', 'smoke-other'], password);
  app = fork(join(apiRoot, 'dist/main.js'), [], { cwd: workdir, env });
  const [ready] = await Promise.race([
    once(app, 'message', { signal: AbortSignal.timeout(15_000) }),
    once(app, 'exit').then(([code, signal]) => {
      throw new Error(`API exited before it was ready (${code ?? signal})`);
    }),
  ]);
  assert.equal(ready, 'ready');

  const request = async (route, { status = 200, method = 'GET', token, cookie, body } = {}) => {
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (cookie) headers.set('Cookie', cookie);
    if (body) headers.set('Content-Type', 'application/json');
    const response = await fetch(`http://127.0.0.1:${env.PORT}/api${route}`, {
      method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(5_000),
    });
    assert.equal(response.status, status, route);
    return response;
  };
  const login = (login) => request('/auth/login', { method: 'POST', body: { login, password } });
  await request('/auth/me', { status: 401 });
  const owner = await login('smoke-owner');
  const cookie = owner.headers.getSetCookie()[0].split(';')[0];
  const refreshed = await request('/auth/refresh', { method: 'POST', cookie });
  const { accessToken: token } = await refreshed.json();
  const me = await request('/auth/me', { token });
  assert.equal((await me.json()).login, 'smoke-owner');

  const bytes = Buffer.from('%PDF-1.4\nSmoke fixture\n%%EOF\n');
  const upload = await request('/files/uploads', {
    method: 'POST', status: 201, token,
    body: {
      originalName: 'smoke.pdf',
      contentType: 'application/pdf',
      sizeBytes: bytes.length,
      checksumSha256: createHash('sha256').update(bytes).digest('hex'),
    },
  });
  const { fileId, uploadUrl, requiredHeaders } = await upload.json();
  const uploaded = await fetch(uploadUrl, {
    method: 'PUT', headers: requiredHeaders, body: bytes, signal: AbortSignal.timeout(5_000),
  });
  assert.ok(uploaded.ok, 'Signed upload');
  await request(`/files/${fileId}/complete`, { method: 'POST', token });

  const other = await login('smoke-other');
  const { accessToken: otherToken } = await other.json();
  const downloadRoute = `/files/${fileId}/download-url`;
  await request(downloadRoute, { status: 404, token: otherToken });
  const download = await request(downloadRoute, { token });
  const { downloadUrl } = await download.json();
  const downloaded = await fetch(downloadUrl, { signal: AbortSignal.timeout(5_000) });
  assert.ok(downloaded.ok, 'Signed download');
  assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), bytes);
  await request(`/files/${fileId}`, { method: 'DELETE', status: 204, token });
  const logout = await request('/auth/logout', { method: 'POST', status: 204 });
  assert.match(logout.headers.getSetCookie()[0], /^[^=]+=;/);
});
