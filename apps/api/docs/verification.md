# API verification — 2026-11-04

Verified locally against the running Compose services: PostgreSQL 18.6, Redis
8.10.3, and RustFS 1.0.4. Frontend implementation was not started.

## Passed

- Root `pnpm build`, TypeScript checking without emit, and lint without warnings.
- API startup, unauthenticated rejection, USER/ADMIN login, current-user identity,
  refresh, logout cookie clearing, invalid credentials, and DTO validation.
- Presigned PUT with SHA-256, browser CORS preflight from `http://localhost:5173`,
  upload completion, repeated completion, and byte-exact presigned download.
- Cross-user access and deletion denied, including ADMIN access to another
  user's files. Invalid upload sizes and mismatched stored metadata rejected.
- Logical/physical deletion, repeat deletion, and download rejection after delete.
- BullMQ job execution and retry against Redis 8.10.3, with `noeviction` confirmed
  on the live server.
- Real background worker/scheduler startup, repeat-job registration, and worker
  cleanup of an expired pending upload.
- Reduced OpenAPI document is available at `/swagger/json`.

## Fix and local provisioning

The configured bucket and application storage key were missing. Created the local
bucket and a service account restricted to that bucket's object operations,
with bucket listing/location permissions. Configured bucket CORS for the local
frontend origin. Existing administrator/application credentials remain separate.

Checksum uploads initially failed with `403`: the checksum was hoisted into the
query string while clients also sent it as a header. The adapter now marks
`x-amz-checksum-sha256` as unhoistable, matching the
[installed SDK's documented pattern](https://github.com/aws/aws-sdk-js-v3/tree/main/packages/s3-request-presigner#readme).
Live regression scenario `presigned_upload_requires_signed_sha256_header` passed:
correct signed checksum accepted; missing or altered header rejected.

## Boundaries

Temporary users, sessions, file records/objects, test queue, and newly registered
test schedule were removed. API and background processes started for verification
were stopped. The user's Compose services remain running. Final database counts
match the initial counts: two users, zero sessions, zero files.

Existing account passwords were not changed. Neither account matched the earlier
suggested demo password; authentication flows were tested with temporary accounts
instead. No database migrations were created or applied.

The live checks ran as temporary scripts outside the repository; no test files or
dependencies were added. Production deployment, frontend rendering, and restart/
outage/load testing were not part of this gate. Logout preserves the existing
cookie-only behavior; session revocation was not added.
