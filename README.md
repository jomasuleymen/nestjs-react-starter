# NestJS React Starter

Incremental NestJS/React monorepo starter based on the `docs-tsl` applications.
The API now retains authentication, files, and their infrastructure. Application
folder layouts and retained feature behavior remain the reference for migration.

## Source baseline

| Application | Source directory | Git commit |
| --- | --- | --- |
| API | `../docs-tsl/docs-tsl-api` | `506f07c8246bddc7556340d128e0897bc418161b` |
| Web | `../docs-tsl/docs-tsl-app` | `ebde7b0e077de05b872737496e4c57380d53f5b4` |

Both source worktrees were clean at initial inspection. Keep them intact as the
reference and fallback while building the monorepo in this directory.

## Planned layout

```text
apps/
  api/   # docs-tsl-api, with its existing internal layout
  web/   # docs-tsl-app, with its existing internal layout
```

Preserve module layouts, validation, authentication, and the locked dependency
baseline for retained features. The docs-tsl business domain has been removed from
the API by explicit scope change. Do not extract shared packages or replace the
existing OpenAPI contract with hand-written shared types.

Package-manager and task configuration may need small compatibility adjustments.
Record each adjustment separately from application logic changes.

## Technology versions

Target current stable technology versions, with TypeScript 6 as the requested
compiler baseline. Preserve the source lockfile versions during the structural
migration, then review version updates as a separate compatibility step before
the starter handoff. Major upgrades must preserve application behavior and pass
their own checks; do not mix them into file moves.

The API currently uses TypeScript `6.0.3`, NestJS `11.1.28`, and Prisma `7.8.0`.
The registry reported `6.0.3` as the latest TypeScript 6 release at migration.

## Stages

Complete and review one stage before starting the next.

1. **pnpm foundation (created).** Private root package, workspace definition,
   package-manager pin, Node.js pin matching the API, and root ignore rules.
   No application packages or dependencies have been added yet.
2. **Turborepo (installed and configured).** Root commands delegate to application
   scripts through Turbo. Validate application task execution after the
   applications are present; configure caching during integration.
3. **API template cleanup.** The API is in `apps/api`, with HTTP and background
   entry points. Only auth and files remain; the Prisma schema is reduced to
   `User`, `Session`, and `File`. Dependencies retain their imported versions.
   Build and startup remain separate verification steps.
4. **Web (deferred while working on the API).** Reuse the source application's
   routing, HTTP layer, authentication UI, layouts, and Vite configuration for
   the agreed auth/files template scope. Regenerate its client against the reduced
   API. Verify static checks, then build and browser behavior separately.
5. **Integration.** Verify the existing web-to-API flow, authentication, generated
   client workflow, and background tasks. Configure root task commands around
   the existing application scripts. Check cache inputs and outputs before
   trusting cached results.
6. **Version refresh and starter handoff.** Review current stable dependency
   versions and apply compatibility upgrades one at a time. Document environment
   setup and local commands. Check setup from a fresh directory. Keep existing
   features within the agreed template scope.
7. **Docker.** Adapt the existing infrastructure configuration to the monorepo
   and verify container packaging and startup. Choose frontend hosting here;
   Nginx is outside the current plan.
8. **CI, then CD.** Add automated checks and builds, then deployment for the
   chosen environment. Configure personal settings and secrets at this stage.

## Compatibility checkpoints

- The API requires Node.js `>=24 <25`; its `.node-version` pins `24.14.0`.
- pnpm is pinned to `12.16.1`, the locally available version at setup.
- The API uses `postinstall` and `prebuild` for Prisma generation. Preserve their
  behavior when adopting pnpm and Turbo; do not run database migrations.
- Prisma configuration reads database environment variables, including during
  generation. Handle local configuration without copying credentials.
- API script-to-script calls now use `pnpm run`. pnpm 12 runs pre/post scripts
  by default, so the existing Prisma `prebuild` hook remains in place.
- The web package has an npm `overrides` entry for `ws` version `8.21.0`.
  Preserve that resolution when configuring the pnpm workspace.
- Web API generation uses `http://localhost:3000/swagger/yaml` by default and
  writes generated files. It is a separate operation from static inspection.
- Web type checking generates routes and uses TypeScript build mode. It can
  write files; do not treat it as a read-only check.
- Preserve each application's working-directory assumptions and local environment
  loading. Keep backend and frontend compiler/module configurations separate.

## Workspace commands

Run from the repository root:

```sh
pnpm dev
pnpm build
pnpm lint
pnpm type-check
```

These commands run matching scripts in workspace applications. The API is present;
the web application is not yet migrated. API `dev` delegates to the existing HTTP
watch command. Its background entry point remains a separately selected command.

`dev` is persistent and uncached. Build dependencies run before their dependents.
All caching is disabled until application environment inputs, generated files,
and build outputs have been checked during integration.

To inspect the task graph without running application commands:

```sh
pnpm exec turbo run dev build lint type-check --dry=json
```

## API migration adjustments

- Copied all 245 tracked source files, including the original project guidance,
  docs, and Compose file. No nested Git metadata, installed dependencies, ignored
  files, or private environment files were copied. Compose has not been adapted
  or started; infrastructure work remains a later stage.
- Replaced the copied npm lockfile with the shared root `pnpm-lock.yaml` after
  importing it. All 83 original direct dependency versions were checked against
  the source lockfile. Every workspace dependency version is present in either
  the source npm lockfile or the existing root pnpm lockfile.
- Added `dev` as an alias for `start:api:dev`; changed the `start` and `prebuild`
  script calls from npm to pnpm without changing the commands they delegate to.
- Declared `@types/body-parser` `1.19.6` directly. It was already present
  transitively in the source lockfile, but pnpm isolation exposed its missing
  direct declaration during type checking.
- Added API-specific Turbo environment passthrough for the existing runtime
  configuration and Prisma build hook. Root caching remains disabled.

For this migration, dependencies were installed with
`pnpm install --frozen-lockfile --ignore-scripts`. Dependency lifecycle scripts
have not been enabled or validated. Prisma client generation was run separately
with temporary placeholder database settings; no database connection or migration
was performed. For a normal local setup, configure the API environment in
`apps/api` before generating the client or building:

```sh
pnpm --filter docs-tsl run prisma:generate
pnpm --filter docs-tsl run type-check --tsBuildInfoFile /dev/null
pnpm --filter docs-tsl run lint
```

The type-check command discards the incremental cache on this macOS/Linux setup
while preserving the original TypeScript configuration. API startup also requires
the services and settings described in its original docs; those have not been
provisioned during this stage.

## Current verification boundary

Turbo `2.11.10` is installed as an exact root development dependency, and the
workspace lockfile records the API dependencies. API client generation and static
checks passed. The initial type check exposed the missing direct type dependency
noted above; it passed after that declaration was added. Source comparison found
243 byte-identical files before the explicitly requested API template cleanup.
That original migration comparison is historical; the API now intentionally
differs from the source business application.

## API template scope

- Retain auth, role guards, file uploads/downloads, ownership, checksums, validation,
  two-phase deletion, and file cleanup workers/schedulers.
- Remove contracts, clients, organizations, affiliates, parties, sales managers,
  directories, document templates, document rendering, and Gotenberg.
- Retain PostgreSQL/Prisma, S3, and BullMQ/Redis for file cleanup. Remove the unused
  cache layer and standalone Redis connection.
- Use `USER` and `ADMIN` roles; the default is `USER`. Remove business relationships
  and the system-generated-file machinery from the schema and file service.
- Remove unused helpers, dependencies, business docs, the project-specific initial
  account SQL script, and the Gotenberg service from the copied Compose file.
- Declare the existing logger's `colorette` dependency directly at the already
  resolved `2.0.20` version rather than depending on transitive hoisting.
- Keep the existing package name `docs-tsl` for pnpm filters until project naming
  is handled. `file-job.contracts.ts` defines queue payload contracts, not the
  removed business contracts domain.

This is a fresh-project schema. Do not apply it as a migration to a docs-tsl
database. Initial account provisioning and fresh database migration generation
are not implemented in this stage; no database migrations were run.

Cleanup verification passed: Prisma client generation and schema validation,
TypeScript 6 checking without emit, lint without autofix, Turbo dry-run assertions,
and `git diff --check`. In-memory assertions cover file ownership, repeated
deletion, concurrent state changes, missing/unavailable storage, cleanup retries,
file-only background selection, generic roles, and configuration validation
without Gotenberg. These use mocked persistence and storage, not live services.

`pnpm build`, API/background startup, dependency lifecycle scripts, and service
integration have not been verified. Global agent instructions require approval
before builds and starting services. The web,
services, Docker adaptations, and CI/CD remain for later stages. The directory is
now a Git repository; the original source repositories remain the fallback.
