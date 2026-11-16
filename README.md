# NestJS React Starter

Incremental NestJS/React monorepo starter.
The API and frontend now retain authentication, files, and their infrastructure.
Application folder layouts and retained feature behavior remain the reference
for migration.

## Source baseline

| Application | Source Git commit                          |
| ----------- | ------------------------------------------ |
| API         | `506f07c8246bddc7556340d128e0897bc418161b` |
| Web         | `ebde7b0e077de05b872737496e4c57380d53f5b4` |

Both source worktrees were clean at initial inspection. Keep them intact as the
reference and fallback while building the monorepo in this directory.

## Layout

```text
apps/
  api/   # NestJS API
  web/   # React frontend
```

Preserve module layouts, validation, authentication, and the locked dependency
baseline for retained features. The source business domain has been removed from
the API by explicit scope change. Do not extract shared packages or replace the
existing OpenAPI contract with hand-written shared types.

Package-manager and task configuration may need small compatibility adjustments.
Record each adjustment separately from application logic changes.

## Workspace configuration

The root owns workspace orchestration and shared tooling policy. Each app owns its
framework configuration and commands; application code stays inside `apps/api`
and `apps/web`. There is no `packages` workspace.

| Location                                                                 | Responsibility                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.node-version`         | Workspace commands, package-manager/runtime versions, strict engines, exact versions for future dependency additions |
| `turbo.json`                                                             | Common `dev`, `build`, `lint`, and `typecheck` tasks                                                                 |
| `.prettierrc`, `.prettierignore`, `.oxlintrc.json`                       | Shared formatting and lint baseline                                                                                  |
| `.editorconfig`, `.gitattributes`, `.vscode/`                            | Editor settings and LF line endings                                                                                  |
| `.gitignore`                                                             | Dependency, build, generated-code, and local environment exclusions                                                  |
| `tsconfig.base.json`                                                     | Shared strict TypeScript rules; module formats and aliases stay app-specific                                         |
| `apps/api/turbo.json`, `apps/web/turbo.json`                             | App-specific generation dependencies, cache outputs, and environment handling                                        |
| `apps/api/tsconfig.json`, `tsconfig.build.json`, `tsconfig.openapi.json` | API/tooling type checks, production compilation, and offline OpenAPI compilation                                     |
| `apps/web/tsconfig*.json`, `vite.config.ts`, `openapi-ts.config.ts`      | Browser/tooling type checks, Vite, and SDK generation                                                                |

App scripts run their tools directly. Use root commands with `--filter` when
generation dependencies must run first, including on a fresh checkout:

```sh
pnpm dev --filter=@starter/web
pnpm build --filter=@starter/api
pnpm typecheck --filter=@starter/web
```

Direct commands such as `pnpm --filter @starter/web dev` intentionally bypass
Turbo; generate prerequisites first. Keep environment files local to each app.
API startup, background roles, Swagger, frontend routing, and application module
layouts retain their existing behavior.

Formatting is owned by the root: `pnpm format` and `pnpm format:check` use the
single root Prettier installation and configuration. Oxlint and its type-aware
companion are also installed only at the root, alongside Prettier and Turbo.
Generated code and database migrations are excluded from formatting. Prettier
does not reorder imports.

Each app owns a `.oxlintrc.json` extending `../../.oxlintrc.json`. The root config
contains common TypeScript rules; the API config adds its Node environment and
generated-code exclusions, while the web config owns browser/React/accessibility
rules, import boundaries, and its generated-code exclusions. App lint scripts
select their local config explicitly, using the shared root executable.

Run `pnpm lint` for all apps, or `pnpm --filter @starter/web lint` for one app.
A future `packages/<name>` workspace can use the same local-config pattern with
`"extends": ["../../.oxlintrc.json"]` and its own lint script; no additional
Oxlint installation is needed. Declare its `plugins` explicitly, as the app
configs do, to avoid re-enabling Oxlint's default plugins when extending a base.
This repository still includes only `apps/*`.

pnpm uses strict Node.js engines, exact versions for new dependencies, and an
explicit dependency build-script allowlist. Existing
application dependency ranges and locked versions are retained. The target has
no peer-version exceptions: the source's `nestjs-zod` overrides do not apply to
this app's class-validator/class-transformer stack.

## Naming a new project

- Set the repository name in the root `package.json` (currently
  `starter`). Private package names such as `@starter/api` can stay
  generic; commands select `./apps/api` instead of a package name.
- Set `COMPOSE_PROJECT_NAME` in `apps/api/.env` to choose the Docker resource
  namespace. The default is `starter`; container names are derived by Compose.
  Changing this namespace does not rename existing volumes or move their data.
- Database and bucket defaults are generic (`app` and `files`). Override
  `DATABASE_NAME` and `S3_BUCKET` in the API environment when needed.
- Swagger's display title is in `apps/api/src/app/api/api.setup.ts`.
- Frontend branding is in `apps/web/index.html`,
  `apps/web/src/app/layouts/AppBrand.tsx`, and
  `apps/web/src/modules/auth/pages/LoginPage.tsx`. Browser storage keys use the
  generic `starter` prefix.

## Technology versions

Target current stable technology versions, with TypeScript 6 as the requested
compiler baseline. Preserve the source lockfile versions during the structural
migration, then review version updates as a separate compatibility step before
the starter handoff. Major upgrades must preserve application behavior and pass
their own checks; do not mix them into file moves.

The API currently uses TypeScript `6.0.3`, NestJS `11.1.28`, and Prisma `7.8.0`.
The registry reported `6.0.3` as the latest TypeScript 6 release at migration.
The web uses TypeScript `6.0.3`, React `19.2.7`, Vite `8.3.5`, and Ant Design
`6.6.8`. Its dependencies resolve within the source manifest's compatible ranges.

## Stages

Complete and review one stage before starting the next.

1. **pnpm foundation (created).** Private root package, workspace definition,
   package-manager pin, Node.js pin matching the API, and root ignore rules.
2. **Turborepo (installed and configured).** Root commands delegate to application
   scripts through Turbo. Validate application task execution after the
   applications are present; configure caching during integration.
3. **API template cleanup.** The API is in `apps/api`, with HTTP and background
   entry points. Only auth and files remain; the Prisma schema is reduced to
   `User`, `Session`, and `File`. Dependencies retain their imported versions.
   Build and startup remain separate verification steps.
4. **Web (implemented and verified locally).** Source routing, HTTP layer,
   authentication UI, layouts, and Vite configuration are in `apps/web`.
   Only auth, files, and the workspace remain. The client is regenerated against
   the reduced API. Static checks, production build, and browser flows passed.
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
- Turbo generates Prisma Client for the API tasks that need it. The API's
  `postinstall` also supports direct Nest start commands. Prisma generation
  works without database credentials or a running database.
- The source web's `ws` override is omitted because the resulting workspace
  dependency graph contains no `ws` package.
- Web declares the source-resolved Ant Design Icons version directly for pnpm's
  strict dependency layout. React DOM types stay at source version `19.2.3` to
  match the existing React types; peer validation passes.
- Web consumes an OpenAPI JSON document exported offline by Nest. Turbo
  generates the SDK and TanStack route tree before web tasks that use them.
  These artifacts and Prisma Client are ignored by Git.
- Preserve each application's working-directory assumptions and local environment
  loading. Keep backend and frontend compiler/module configurations separate.

## Workspace commands

Run from the repository root:

```sh
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm api:generate
pnpm format:check
pnpm db:seed
```

`pnpm format` applies the shared format. Formatting commands exist only at the
root; use `pnpm typecheck` for type checks.

Database commands live in the API package:

```sh
pnpm --filter @starter/api db:generate
pnpm --filter @starter/api db:validate
pnpm --filter @starter/api db:deploy
pnpm --filter @starter/api db:studio
```

`db:migrate` creates/applies development migrations; `db:reset` is destructive.
These commands are manual, never part of install, dev, or CI.

`pnpm db:seed` builds a standalone Nest entrypoint and creates an active admin
from `SEED_ADMIN_LOGIN` and `SEED_ADMIN_PASSWORD` in `apps/api/.env` or the shell.
Use a login of 3–50 characters and a password of
at least 12 characters and at most 72 UTF-8 bytes. Login is trimmed and lowercased,
matching authentication. The seed never updates existing accounts or passwords;
it fails if the selected account is not an active admin. It requires the normal
API environment and database schema, does not start HTTP/Redis/S3 clients, and
never applies migrations. Turbo never caches it.

API `dev` delegates to the HTTP watch command. Run the background roles
separately as described in the [API guide](apps/api/README.md).
Copy `apps/api/.env.example` to `apps/api/.env` and configure it before running
`pnpm infra:up`. Use `pnpm infra:down` to stop the local infrastructure.

`dev` is persistent and uncached. Turbo caches generation, builds, lint, and
type checks locally. App task dependencies preserve the Prisma → OpenAPI → SDK
generation chain and TanStack route generation. Shared compiler/lint/formatting
configuration and frontend build environment files participate in the relevant
cache keys. Production compilation preserves `apps/api/dist/main.js` and
`apps/api/dist/background.js`.

To inspect the task graph without running application commands:

```sh
pnpm exec turbo run dev build lint typecheck --dry=json
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
pnpm --filter ./apps/api run db:generate
pnpm typecheck --filter=@starter/api
pnpm --filter ./apps/api run lint
```

Type checks do not emit JavaScript or incremental cache files. API startup also
requires the services and settings described in its original docs; those have
not been provisioned during this stage.

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
- The API package is named `@starter/api`; documented pnpm filters select its
  directory so commands survive package renames. `file-job.contracts.ts` defines
  queue payload contracts, not the removed business contracts domain.

This is a fresh-project schema, not a migration for an existing source database.
The standalone `pnpm db:seed` command now provides initial admin provisioning.
No database migrations or seed writes were run by the agent.

Cleanup verification passed: Prisma client generation and schema validation,
TypeScript 6 checking without emit, lint without autofix, Turbo dry-run assertions,
and `git diff --check`. In-memory assertions cover file ownership, repeated
deletion, concurrent state changes, missing/unavailable storage, cleanup retries,
file-only background selection, generic roles, and configuration validation
without Gotenberg. These use mocked persistence and storage, not live services.

API build, HTTP/background startup, and live PostgreSQL/Redis/RustFS integration
passed the [pre-frontend verification gate](apps/api/docs/verification.md).
Frontend setup, retained behavior, and verification are documented in
[apps/web/README.md](apps/web/README.md). Start both apps with `pnpm dev` after
configuring the API environment and local infrastructure.

Dependency lifecycle scripts, production container packaging, and CI/CD remain
separate stages. The original source repositories remain the fallback.
