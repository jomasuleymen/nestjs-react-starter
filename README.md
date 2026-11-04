# NestJS React Starter

Incremental monorepo migration of the existing `docs-tsl` applications.
Preserve their internal structure and application behavior throughout migration.

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

Only the containing directories change. Preserve module layouts, package names,
source code, routes, validation, authentication, database schema and migrations,
generated client, assets, and dependency versions. Do not extract shared packages
or replace the existing OpenAPI contract with hand-written shared types.

Package-manager and task configuration may need small compatibility adjustments.
Record each adjustment separately from application logic changes.

## Stages

Complete and review one stage before starting the next.

1. **pnpm foundation (created).** Private root package, workspace definition,
   package-manager pin, Node.js pin matching the API, and root ignore rules.
   No application packages or dependencies have been added yet.
2. **Turborepo (installed and configured).** Root commands delegate to application
   scripts through Turbo. Validate application task execution after the
   applications are present; configure caching during integration.
3. **API.** Copy the existing application into `apps/api`, preserving its source
   files and relative paths. Retain both HTTP and background entry points, Prisma
   schema and migration files, configuration, and existing scripts. Establish the
   pnpm dependency baseline from the npm lockfile without upgrading packages.
   Compare copied files with the recorded source baseline, then verify static
   checks and, separately, generation, build, and startup.
4. **Web.** Copy the existing application into `apps/web`, retaining its modules,
   routes, generated API client, HTTP layer, assets, and Vite configuration.
   Incorporate its npm dependency baseline into the workspace lockfile without
   upgrading packages. Compare copied files with the source, then verify static
   checks and, separately, build and browser behavior.
5. **Integration.** Verify the existing web-to-API flow, authentication, generated
   client workflow, and background tasks. Configure root task commands around
   the existing application scripts. Check cache inputs and outputs before
   trusting cached results.
6. **Starter handoff.** Document environment setup and local commands. Check
   setup from a fresh directory. Keep existing business features unless their
   removal is explicitly requested.
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
- Existing scripts call `npm run` internally. Review their behavior before
  changing package-manager commands or lifecycle settings.
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

These commands run matching scripts in workspace applications. There are no
application packages yet, so they currently have no application tasks to run.
The API will need a `dev` alias for its existing HTTP watch command when copied;
its background entry point remains a separately selected command.

`dev` is persistent and uncached. Build dependencies run before their dependents.
All caching is disabled until application environment inputs, generated files,
and build outputs have been checked during integration.

To inspect the task graph without running application commands:

```sh
pnpm exec turbo run dev build lint type-check --dry=json
```

## Current verification boundary

The application sources have been inspected, not installed, built, or run.
Turbo `2.11.10` is installed as an exact root development dependency, and the
workspace lockfile records the resolution. Installation scripts were disabled.
Application dependencies, source copying, services, Docker, and CI/CD belong to
later stages. This directory has not been initialized as a Git repository.
