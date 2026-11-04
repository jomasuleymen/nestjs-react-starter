# Starter API

NestJS modular monolith with separate API and background entrypoints.

## Setup

```bash
pnpm install --ignore-scripts
pnpm --filter ./apps/api run prisma:generate
```

Run installation from the monorepo root. Configure the API environment before
generating Prisma Client. Dependency lifecycle scripts and Docker setup are
separate verification steps. Compose configuration has been validated; container
startup has not been checked.

The Prisma schema contains only `User`, `Session`, and `File`, with `USER` and
`ADMIN` roles. It is a fresh-project schema, not a migration for an existing
source database. No database changes are applied automatically. Initial user
provisioning is not included; the project-specific SQL account script was removed.

## Local infrastructure

The Compose file pins stable releases checked on 2026-11-04:

| Service | Image |
| --- | --- |
| PostgreSQL | `postgres:18.6-alpine` |
| Redis | `redis:8.10.3-alpine` |
| S3 storage | `rustfs/rustfs:1.0.4` |

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
pnpm --filter ./apps/api run type-check --tsBuildInfoFile /dev/null
pnpm lint
pnpm build
```

## Architecture

- [Application architecture](docs/architecture.md)
- [Queue architecture](docs/queue-architecture.md)
- [Auth and files flows](docs/auth-files.md)
