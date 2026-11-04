# Starter API

NestJS modular monolith with separate API and background entrypoints.

## Setup

```bash
pnpm install --ignore-scripts
pnpm --filter docs-tsl run prisma:generate
```

Run installation from the monorepo root. Configure the API environment before
generating Prisma Client. Dependency lifecycle scripts and Docker setup are
separate verification steps; the copied Compose file has not been validated.

The Prisma schema contains only `User`, `Session`, and `File`, with `USER` and
`ADMIN` roles. It is a fresh-project schema, not a migration for an existing
docs-tsl database. No database changes are applied automatically. Initial user
provisioning is not included; the project-specific SQL account script was removed.

## Development

```bash
pnpm dev
BACKGROUND_ROLE=worker BACKGROUND_JOBS=files pnpm --filter docs-tsl run start:background:dev
BACKGROUND_ROLE=scheduler BACKGROUND_JOBS=files pnpm --filter docs-tsl run start:background:dev
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
pnpm --filter docs-tsl run type-check --tsBuildInfoFile /dev/null
pnpm lint
pnpm build
```

## Architecture

- [Application architecture](docs/architecture.md)
- [Queue architecture](docs/queue-architecture.md)
- [Auth and files flows](docs/auth-files.md)
