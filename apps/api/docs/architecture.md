# Application Architecture

This project is a feature-first modular monolith. It has one codebase and one
build artifact with separate API and background entrypoints.

## Structure

```text
src/
  main.ts                         # API entrypoint
  background.ts                   # Worker/scheduler entrypoint
  app/                            # Composition and process bootstrap
    application.bootstrap.ts
    api/
    background/
  modules/                        # Business features
    auth/
    files/
      cleanup/
      dto/
      object-storage/
      queue/
  infrastructure/                 # Database, config, logging, queues
  common/                         # Reusable non-business building blocks
  generated/                      # Generated Prisma client
```

## Dependency Rules

```text
app -> modules -> infrastructure
 |         |            |
 +---------+------------+-> common
```

- `app` selects modules and configures a process. Business logic does not live
  there.
- `modules/<domain>` owns its controllers, services, DTOs, persistence calls,
  integration ports, job contracts, producers, workers, and schedulers.
- `infrastructure` owns technical integrations shared across domains. Only
  `InfrastructureModule` is global.
- `common` contains no feature-specific business logic and does not import from
  `app` or `modules`.
- Use relative imports inside one feature and layer aliases across boundaries:
  `@app/*`, `@modules/*`, `@infra/*`, `@common/*`, and `@generated/*`.
- Export only providers that another feature or process composition actually
  consumes.

## Adding A Domain

Start flat and add folders only when the domain grows:

```text
modules/<domain>/
  <domain>.module.ts
  <domain>.controller.ts
  <domain>.service.ts
  dto/
  queue/                           # Only when background work exists
```

Keep API controllers and synchronous providers in the feature module. A
background worker may import that feature module when it needs an exported
provider. Split out a core module only when importing the complete feature has a
concrete runtime cost or creates a dependency cycle. Register feature modules in
`ApiModule` and worker/scheduler modules in `BackgroundModule`.

Do not introduce repositories, use-case classes, events, or new shared
abstractions until a concrete second use case requires them.

## Current Feature Boundaries

### Auth

`AuthService` coordinates login, refresh, logout and access-token validation.
Token creation, password verification and session persistence are focused
providers. A session is created only at login and stores only client metadata.
Auth internals are not exported from `AuthModule`; other features use the public
decorators and request-user types from `@modules/auth`.

### Files

`FilesService` owns file lifecycle and authorization by `ownerUserId`.
`FileCleanupService` owns retryable physical deletion. S3 is an adapter behind
the `ObjectStorage` injection token, so application services do not depend on
AWS SDK types or translate AWS errors directly.

## Configuration

- Environment precedence is `process.env > .env.local > .env`.
- `environment.loader.ts` is the only component that reads env files.
- `ConfigModule` validates and caches the loaded environment once at startup.
- Application code accesses configuration through `EnvConfigService`; direct
  `process.env` access is limited to bootstrap/background selection.
- Defaults live only in `EnvironmentVariables`; config getters do not repeat
  them.
- Production secrets must be injected by the deployment environment and must not
  be committed or baked into the application image.
