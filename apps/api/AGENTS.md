## Tech Stack

### Backend

- **Runtime**: Node.js, TypeScript (strict mode)
- **Framework**: NestJS 11
- **Database**: PostgreSQL (source of truth), Prisma
- **Queue**: Redis, BullMQ (file cleanup)
- **Validation**: class-validator, class-transformer
- **Logging**: Pino (nestjs-pino)
- **Auth**: JWT, Throttler
---

## Core Principles

### Engineering Standards

1. **Production-grade**: Scalable, maintainable, secure
2. **Type-safety**: Strict TypeScript, explicit types
3. **Modularity**: Cohesive modules, avoid God services
4. **Clean Code**: SOLID, DRY, KISS—avoid overengineering

### Code Review Posture

- Challenge current approach with best practices
- Identify risks, edge cases, improvement opportunities
- **Never say "looks good"** without listing ≥3 actionable items

## Common Commands

```bash
# Development
pnpm run start:api:dev  # Watch mode
pnpm run start:debug    # Debug mode

# Production
pnpm run build
pnpm run start:api:prod

# Quality
pnpm run lint            # Check
pnpm run lint:fix        # Auto-fix
pnpm run prettier:format # Format
pnpm run type-check      # TypeScript (tsc --noEmit)

# Database
docker compose up -d    # Start PostgreSQL + Redis
```

---

## Code Patterns

### Swagger DTOs

- `nestjs/swagger` compiler plugin is enabled
- Use concrete classes for controller request/response DTOs; avoid
  interfaces/types for API contracts
- The compiler already infers most DTO fields automatically
- Add `@ApiProperty`/`@ApiPropertyOptional` explicitly for enums and for cases
  the compiler cannot infer safely (for example nested response metadata you
  expose via `@ApiOkResponse`)

## Anti-Patterns to Avoid

1. **God Services** – Keep modules focused
2. **Anemic Domain Models** – Entities should have behavior
3. **Magic Strings** – Use enums/constants
4. **Silent Failures** – Always log errors with context
5. **Unvalidated Input** – Every controller needs a DTO
6. **N+1 Queries** – Use `relations` or explicit joins
7. **Overfetching** – Use `select` to limit columns
8. **Raw `.then()` Chains** – Use async/await
9. dont write raw sql files. only prisma orm.
10. dont run prisma mirgrations, 
---

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if
  any.

## Working Preferences

- Never add or modify tests unless explicitly requested.
