# Queue Architecture

API and background processing have separate entrypoints:

- `pnpm run start:api` starts HTTP controllers and user-facing modules.
- `pnpm run start:background` starts the configured worker or scheduler modules.

Run these commands inside `apps/api`, or use `pnpm --filter ./apps/api run` from
the monorepo root.

`BACKGROUND_ROLE` is required and accepts `worker` or `scheduler`.
`BACKGROUND_JOBS` accepts a comma- or whitespace-separated list of domains. If
it is absent or empty, every registered background domain starts.

Run each background configuration as a separate deployment. The files worker
uses `BACKGROUND_ROLE=worker BACKGROUND_JOBS=files`; the singleton scheduler uses
`BACKGROUND_ROLE=scheduler BACKGROUND_JOBS=files`. Register a domain and its supported roles in
`BackgroundModule` before using its name in `BACKGROUND_JOBS`.

## Module Layout

Each queue-backed domain should use this shape:

- `<domain>.module.ts` owns HTTP controllers and synchronous domain providers.
- `queue/<domain>-queue.module.ts` exports API-side producers. HTTP producers
  should register queue-specific fail-fast Redis settings with
  `BullModule.registerQueueAsync`; producers receive queues through
  `@InjectQueue`.
- `queue/<domain>-worker.module.ts` registers the BullMQ queue with persistent
  worker settings and then registers processors.
- `queue/<domain>-scheduler.module.ts` imports the queue module and registers
  repeatable jobs.
- `queue/<domain>-job.contracts.ts` contains job names and payload types.

Do not register processors in the HTTP module. Do not register repeatable jobs
from producers. Producers only enqueue jobs; scheduler services own repeatable
job bootstrap.

## Job Rules

- Queue Redis must use `maxmemory-policy=noeviction`; the Compose service sets
  this explicitly and enables AOF persistence.
- Give repeatable and idempotent jobs stable `jobId` values.
- Handlers must be idempotent because BullMQ retries failed jobs and can rerun
  stalled jobs.
- Persist business state in PostgreSQL before doing external side effects when
  possible.
- Let scheduler bootstrap fail if a required repeatable job cannot be
  registered.
- Log `jobId`, `jobName`, `attemptsMade`, and domain identifiers in
  processors/handlers.
- Keep job payloads small: identifiers and immutable inputs, not large documents
  or blobs.

## Files Cleanup

The scheduler registers the stable repeatable job `files:cleanup:v1`. The worker
processes expired `PENDING` uploads and files in `DELETING` state. It marks a
record `DELETED` only after the object is deleted or confirmed absent. Temporary
object-storage failures leave the record in `DELETING` so a later run retries
it.

## Adding A Queue

1. Add the queue name to the domain's job contracts.
2. Add job names and payloads in `queue/<domain>-job.contracts.ts`.
3. Add an API queue module and a fail-fast producer for enqueue operations.
4. Register the BullMQ queue with persistent Redis settings in the worker
   module.
5. Add processors and handlers to the worker module.
6. Add a scheduler module only when repeatable jobs are required.
7. Register worker and scheduler modules for the domain in `BackgroundModule`.
