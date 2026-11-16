# Starter API

NestJS modular monolith with separate API and background entrypoints.

## Setup

```bash
pnpm install --frozen-lockfile --ignore-scripts
```

Run installation from the monorepo root. Prisma Client and the OpenAPI export can
be generated without API runtime configuration or services.
If you use a direct `start:*` command before running a Turbo task, run
`pnpm --filter ./apps/api run db:generate` first.

The Prisma schema contains only `User`, `Session`, and `File`, with `USER` and
`ADMIN` roles. It is a fresh-project schema, not a migration for an existing
source database. No database changes are applied automatically.
## Local infrastructure

Copy `.env.example` to `.env` in this directory and configure the local services.
Run `pnpm infra:up` and `pnpm infra:down` from the repository root. The root
Compose file reads `apps/api/.env` and pins these releases:

| Service    | Image                  |
| ---------- | ---------------------- |
| PostgreSQL | `postgres:18.6-alpine` |
| Redis      | `redis:8.10.3-alpine`  |
| S3 storage | `rustfs/rustfs:1.0.4`  |

PostgreSQL 18.6 is the current stable release; 19 is still a release candidate.
See the [PostgreSQL version table](https://www.postgresql.org/support/versioning/).
The installed BullMQ 5.80.9 documents Redis 6.2 or newer support in its
[compatibility guide](https://github.com/taskforcesh/bullmq/blob/v5.80.9/docs/gitbook/guide/redis-tm-compatibility/README.md).
Redis uses AOF persistence and `maxmemory-policy=noeviction` as required for queue
data. Its health check authenticates through `REDISCLI_AUTH`.

RustFS replaces the previous object-storage service while the API keeps its
generic S3 adapter. It provides the S3 API on port 9000 and Console on port 9001;
see the [Docker guide](https://docs.rustfs.com/en/installation/container/docker)
and [1.0.4 release](https://github.com/rustfs/rustfs/releases/tag/1.0.4).

The example environment assumes the API runs on the host: `S3_ENDPOINT` and
`S3_PUBLIC_ENDPOINT` both use `http://localhost:9000`. If the API later runs inside
Compose, use `http://rustfs:9000` for `S3_ENDPOINT` and keep `S3_PUBLIC_ENDPOINT`
reachable by the browser. Adjust both when changing the published API port.

Configure `RUSTFS_ACCESS_KEY` and `RUSTFS_SECRET_KEY` for Console administration.
Create the `S3_BUCKET` bucket and a separate application key with bucket-scoped
permissions matching `S3_ACCESS_KEY` and `S3_SECRET_KEY`. Bucket/key provisioning
is not automatic. The example credentials are local placeholders.

RustFS uses a new `rustfs_data` volume. Existing object-storage volumes are not
reused, deleted, or migrated; copy existing objects through S3 before switching
an environment that already contains data. The PostgreSQL and Redis volume names
and mount paths remain unchanged. Live API/service verification subsequently
passed; see the [verification record](docs/verification.md) for checks, local
provisioning, and limits. No database migrations were run by the agent.

## Development

```bash
pnpm dev
BACKGROUND_ROLE=worker BACKGROUND_JOBS=files pnpm --filter ./apps/api run start:background:dev
BACKGROUND_ROLE=scheduler BACKGROUND_JOBS=files pnpm --filter ./apps/api run start:background:dev
```

Run these commands from the monorepo root. An empty or missing `BACKGROUND_JOBS`
starts the registered jobs for the selected role. Currently only `files` exists.
PostgreSQL and S3 storage are needed for the API; Redis is used by background
workers and schedulers. Runtime configuration lives in `apps/api`.

When Swagger is enabled, UI is available at `http://localhost:3000/swagger`. All
API routes use the `/api` prefix.

## API Domains

- `auth` — access JWT, rotating refresh cookie, server-side sessions and roles.
- `files` — presigned uploads/downloads, ownership and asynchronous cleanup.

## Quality

```bash
pnpm typecheck --filter=@starter/api
pnpm lint
pnpm build
```

The root Turbo commands generate Prisma Client before API checks and builds.
App scripts invoke tools directly; `pnpm --filter ./apps/api run typecheck`
checks existing sources without generating files. `tsconfig.json` covers API
sources and tooling configuration; Nest uses `tsconfig.build.json` so production
entrypoints remain `dist/main.js` and `dist/background.js`. OpenAPI export uses
`tsconfig.openapi.json` and keeps its separate `.generated/nest` output.

Run `pnpm format` or `pnpm format:check` from the root; formatting is not an app
task. Database commands use the `db:*` prefix (`db:generate`, `db:migrate`,
`db:deploy`, `db:seed`, `db:studio`, `db:validate`, `db:reset`).

Oxlint is installed at the root. This app's `.oxlintrc.json` extends the root
baseline and adds its Node environment and generated-code exclusions.

## Architecture

- [Application architecture](docs/architecture.md)
- [Queue architecture](docs/queue-architecture.md)
- [Auth and files flows](docs/auth-files.md)
