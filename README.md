# Ticket SaaS foundation

This repository contains the Step B runtime foundation for a modular-monolith,
multi-tenant SaaS. It currently provides only backend runtime infrastructure;
it contains no authentication, tenant, RBAC, ticket, or business modules.

## Prerequisites

- Node.js 20 LTS and npm 10+
- Docker Desktop (optional, for PostgreSQL and Redis)

## Local setup

Install dependencies from the repository root:

```sh
npm install
```

Copy the environment templates. Replace the local PostgreSQL password before
starting Compose; do not commit either generated `.env` file.

```sh
cp .env.example .env
cp backend/.env.example backend/.env
```

To run PostgreSQL, Redis, and the backend together:

```sh
docker compose up --build
```

For a host-run backend, point `DATABASE_URL` and `REDIS_URL` in `backend/.env`
at running local services, then run:

```sh
npm run dev --workspace=@ticket-saas/backend
```

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run migrate:up --workspace=@ticket-saas/backend
```

`DATABASE_URL` must be available in the environment for migration commands.
No migration or business schema exists yet.

Database conventions and the migration workflow are documented in
[`backend/docs/database-conventions.md`](backend/docs/database-conventions.md).

## Runtime endpoints

- `GET /health` is a lightweight liveness check.
- `GET /readiness` verifies PostgreSQL and Redis and returns `503` if either is unavailable.

The backend runs on `HOST` and `PORT` (defaults: `0.0.0.0:3000`).

## Security and operational foundations

Configuration is validated at process start. The server uses Helmet, CORS
configured by `CORS_ORIGIN`, body-size limits, request IDs, structured logging,
centralized JSON errors, and SIGINT/SIGTERM graceful shutdown. Logs redact
common secret-bearing fields.
