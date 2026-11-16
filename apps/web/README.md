# Starter Web

React 19, TypeScript 6, Vite, Ant Design 6, TanStack Router/Query, and Zustand.
Migrated from the reference frontend without changing its retained architecture:

- `src/app`: composition, providers, navigation, and responsive layouts.
- `src/routes`: thin routes, session guards, and permission checks.
- `src/modules`: auth, files, and workspace.
- `src/api/generated`: generated OpenAPI client; regenerate instead of editing.
- `src/api/http`: Axios transport, in-memory access token, and refresh handling.
- `src/shared`: business-neutral components, configuration, and theme state.

The contracts, management, and admin business screens are excluded. Both `USER`
and `ADMIN` can open the workspace and files. File ownership remains enforced by
the API. Access tokens stay in memory; the refresh cookie restores the session
after a reload. Only theme preferences and the logout signal use Web Storage.

## Local development

Run commands from the monorepo root with Node.js 24 and the pinned pnpm version.
Configure the API using [its setup guide](../api/README.md) first, including an
existing account, database, Redis, and S3 bucket/application credentials.

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm dev
```

Open `http://localhost:5173`. Vite proxies `/api` to `http://localhost:3000`, so
the frontend works without an `.env` file. To change origins, copy `.env.example`
to `.env.local` inside this directory. `VITE_API_URL` is an origin, without `/api`;
keep it empty for the local proxy. `VITE_API_PROXY_TARGET` configures Vite only.
Never put credentials in `VITE_*` variables.

Direct browser uploads require bucket CORS: allow `http://localhost:5173`, the
`PUT`, `GET`, and `HEAD` methods, and the signed upload headers, including
`Content-Type` and `x-amz-checksum-sha256`. The current local bucket is configured.
Its endpoint must be reachable by the browser, not just by Docker containers.

To run only the frontend with an existing API:

```sh
pnpm dev --filter=@starter/web
```

## Generated code and checks

Run from the monorepo root:

```sh
pnpm api:generate
pnpm lint --filter=@starter/web
pnpm typecheck --filter=@starter/web
pnpm build --filter=@starter/web
```

Turbo exports OpenAPI from Nest to `apps/api/.generated/openapi.json` and
generates the SDK and route tree before root Turbo commands that need them.
Direct app scripts bypass generation; use them once prerequisites exist.
Type checking uses `tsc --noEmit` for browser and tooling code separately.
Builds still check types before Vite bundles the app. Formatting and the Oxlint
installation are maintained at the root. This app's `.oxlintrc.json` extends the
root baseline and owns its React/accessibility rules, import boundaries, and
generated-code exclusions.
Run `pnpm api:generate` again after changing API DTOs during development.
For a one-off override, run `OPENAPI_INPUT=/path/to/openapi.json pnpm --filter
./apps/web exec openapi-ts`. The normal Turbo workflow uses the local export.

## Files screen

The page reuses the source upload service and Ant Design adapter: validation,
SHA-256 hashing, signed PUT with required headers, completion, progress,
cancellation, and failed-upload cleanup. Completed uploads can be downloaded or
deleted. Failed deletion keeps the row and displays the API error.

The displayed list belongs to the mounted page. Reloading or leaving the page
clears the list without deleting server files. The API has no file-list endpoint;
this step does not add one. Supported types are PDF, Word, Excel, JPEG, PNG, and
WebP; the existing frontend size limit is 50 MB.

## Verification

Local verification completed on 2026-11-04:

- TypeScript, ESLint, Prettier check, and Vite production build passed.
- Peer dependency validation passed; API TypeScript validation still passed.
- Browser checks covered invalid login, both roles, protected redirects, session
  restoration after reload, logout, theme switching, and mobile navigation.
- A browser-uploaded PDF reached `READY` with the expected SHA-256. Its browser
  download matched the fixture byte for byte; deletion persisted as `DELETED`.
- Unsupported file types displayed the backend validation message.
- At widths 390 and 1280, the page had no horizontal overflow.
- Disposable test accounts, sessions, files, and objects were removed. Original
  accounts were preserved. Temporary API/frontend processes were stopped.

The existing Ant Design chunk exceeds Vite's 500 kB warning threshold. Route
generation also emits a tool circular-dependency warning. Neither blocks the
checks. Production hosting, fresh-machine setup, Docker packaging, and CI/CD
remain later stages.
