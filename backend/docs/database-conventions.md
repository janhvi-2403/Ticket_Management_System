# Database and migration conventions

## Platform baseline

- PostgreSQL 16 is the supported database version.
- Use PostgreSQL SQL in `backend/migrations`; no ORM is used.
- The migration directory is deliberately flat. `node-pg-migrate` records applied
  migrations in its `pgmigrations` table and enforces migration ordering.
- Every schema change must be an immutable migration. Do not edit, rename, or
  delete a migration after it has run in a shared environment.

## Migration files

Migration filenames are generated in UTC and follow this form:

```text
YYYYMMDDHHMMSS_descriptive_change.sql
```

Use a concise, lower-snake-case description beginning with the schema action,
such as `create_supporting_index` or `add_customer_status`. The timestamp
provides ordering; do not manually reorder migrations.

Migrations are SQL files and must use explicit sections:

```sql
-- Up Migration
-- schema change

-- Down Migration
-- reversal, when it is safe and meaningful
```

Write a `Down Migration` for changes that can be safely reversed in local
development. For destructive or data-bearing production changes, use a new,
forward corrective migration instead of rolling production backwards.

## Naming and schema conventions

- Use lower `snake_case` for tables, columns, constraints, and indexes.
- Future business tables are plural nouns. Join tables describe both sides.
- Primary keys are named `id`; their primary-key constraint is
  `pk_<table_name>`.
- Foreign-key columns use `<referenced_table_singular>_id`, with a constraint
  named `fk_<child_table>__<column>__<parent_table>`.
- Indexes use `idx_<table>__<column_or_purpose>`; unique constraints use
  `uq_<table>__<column_or_purpose>`; check constraints use
  `chk_<table>__<rule>`.
- Foreign keys must state the intended `ON DELETE` behavior explicitly. Default
  to `RESTRICT` unless a lifecycle relationship justifies another action.

## IDs and timestamps

- Use PostgreSQL's native `uuid` type for future primary and foreign keys.
- New entity IDs are generated as UUID version 7 in the application before
  insertion using `createUuidV7` in `src/shared/uuid.ts`. Node.js 20 has no UUID
  v7 generator, and PostgreSQL 16 has no native `uuidv7()` function. We
  intentionally do not add a database extension or function.
- Do not use `gen_random_uuid()` for entity IDs: it generates UUID v4 rather
  than the chosen UUID v7 strategy.
- Time columns use `timestamptz`, never `timestamp without time zone`.
- Mutable future business tables use `created_at timestamptz NOT NULL DEFAULT
  CURRENT_TIMESTAMP` and `updated_at timestamptz NOT NULL DEFAULT
  CURRENT_TIMESTAMP`. Application write paths must update `updated_at`; a
  shared trigger is not part of this foundation.

## Multi-tenant preparation

`organizations` is the tenant root and deliberately has no `tenant_id`. When
tenant-owned tables are introduced, they must include a non-null `tenant_id uuid`
foreign key referencing `organizations(id)` with explicit `ON DELETE RESTRICT`,
tenant-aware indexes, and tenant-local unique constraints that include
`tenant_id`. This supports later tenant-scoped repositories and PostgreSQL RLS
as defense in depth.

## Workflow

Run commands from the repository root. `DATABASE_URL` is required for any
command that connects to PostgreSQL.

```sh
# Create a new SQL migration (review the generated file before editing)
npm run migrate --workspace=@ticket-saas/backend -- create descriptive_change

# Apply pending migrations; this is the normal development command
npm run migrate:up --workspace=@ticket-saas/backend

# Validate pending migrations against a database without changing it
npm run migrate:check --workspace=@ticket-saas/backend

# Roll back only the latest safe development migration
npm run migrate:down --workspace=@ticket-saas/backend
```

`node-pg-migrate` has no `status` CLI action in the installed version. To
inspect applied migrations, query `pgmigrations` in the target database, for
example: `SELECT name, run_on FROM pgmigrations ORDER BY run_on;`.

Production migrations run as a separate, single deployment step using the same
artifact and a least-privileged migration database role. Back up first, run
`migrate:check`, then `migrate:up`; do not run `migrate:down` as an automated
production recovery mechanism.
