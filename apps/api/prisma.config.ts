import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

function buildDatabaseUrl(): string {
  const host = env('DATABASE_HOST');
  const port = env('DATABASE_PORT');
  const user = encodeURIComponent(env('DATABASE_USER'));
  const password = encodeURIComponent(env('DATABASE_PASSWORD'));
  const database = env('DATABASE_NAME');

  return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: buildDatabaseUrl(),
  },
});
