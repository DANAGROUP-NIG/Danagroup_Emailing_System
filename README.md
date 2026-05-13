# DIMS — Dana Internal Mail & Intranet System

A purpose-built, self-hosted internal communication platform for Dana Group of Companies and its subsidiaries.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Option A — Run with Docker (Recommended)](#option-a--run-with-docker-recommended)
5. [Option B — Run Locally Without Docker](#option-b--run-locally-without-docker)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Database Migrations](#database-migrations)
8. [Database Seeding](#database-seeding)
9. [Available URLs](#available-urls)
10. [Before Opening a PR](#before-opening-a-pr)
11. [CI/CD](#cicd)
12. [Branch Strategy](#branch-strategy)
13. [Troubleshooting](#troubleshooting)
14. [Documentation](#documentation)

---

## Project Structure

```
Danagroup_Emailing_System/
├── dims-frontend/         # Next.js 14 frontend application
├── dims-backend/          # NestJS 10 backend API
├── nginx/                 # NGINX reverse proxy config
├── .github/workflows/     # GitHub Actions CI/CD pipelines
├── docker-compose.yml     # Production container orchestration
├── docker-compose.dev.yml # Development port/volume overrides
└── .env.example           # Root environment variable template
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, TailwindCSS |
| Backend | NestJS 10, Node.js 20 LTS, TypeScript |
| Database | PostgreSQL 15 |
| Cache + Queue | Redis 7 + BullMQ |
| Object Storage | MinIO |
| Search | Elasticsearch 8 |
| Web Server | NGINX |
| Containerization | Docker + Docker Compose v2 |

---

## Prerequisites

| Tool | Minimum Version | Check |
|---|---|---|
| Docker | 24+ | `docker --version` |
| Docker Compose | v2+ (plugin) | `docker compose version` |
| Node.js | 20 LTS | `node --version` |
| npm | 10+ | `npm --version` |
| Git | any | `git --version` |

> **Note:** On Linux, make sure your user is in the `docker` group so you can run Docker without `sudo`:
> ```bash
> sudo usermod -aG docker $USER && newgrp docker
> ```

---

## Option A — Run with Docker (Recommended)

This is the fastest and most reliable way to run the full stack. Docker handles PostgreSQL, Redis, MinIO, and Elasticsearch automatically.

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd Danagroup_Emailing_System
```

### Step 2 — Create environment files

There are **three** `.env` files required. Copy each example and edit as needed:

```bash
# 1. Root .env (used by docker-compose for shared infrastructure)
cp .env.example .env

# 2. Backend .env
cp dims-backend/.env.example dims-backend/.env

# 3. Frontend .env.local
cp dims-frontend/.env.local.example dims-frontend/.env.local
```

> **Important:** In `dims-backend/.env`, when running via Docker, change the hostnames from `localhost` to the Docker service names:
>
> | Variable | Local value | Docker value |
> |---|---|---|
> | `DB_HOST` | `localhost` | `postgres` |
> | `REDIS_HOST` | `localhost` | `redis` |
> | `MINIO_ENDPOINT` | `localhost` | `minio` |
> | `ELASTICSEARCH_NODE` | `http://localhost:9200` | `http://elasticsearch:9200` |
>
> These values are already correct in the root `.env.example`.

### Step 3 — Start all services

**Development mode** (hot-reload, source mounted into containers):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

**Production-like mode** (compiled images, no source mount):

```bash
docker compose up -d --build
```

Wait for all containers to be healthy before running migrations:

```bash
docker compose ps
# All services should show "healthy" or "Up"
```

### Step 4 — Run database migrations

Migrations **must** be run before the app is usable. Run them inside the `dims_api` container (where the DB is reachable on its internal hostname):

```bash
docker exec dims_api npm run migration:run
```

Expected output ends with:
```
Migration MakeUserFieldsNullable1747182000000 has been executed successfully.
Migration AddMessageRecipientIndexes1747182060000 has been executed successfully.
query: COMMIT
```

If all migrations were already applied you will see:
```
No migrations are pending
```
Both outcomes are correct — no action needed.

### Step 5 — Seed the database

Seed **in this exact order**. Running seeds out of order will cause foreign key errors.

```bash
# 1. Seed subsidiaries and departments first
docker exec dims_api npm run seed:table

# 2. Seed users (depends on subsidiaries/departments existing)
docker exec dims_api npm run seed:users
```

> The `seed:table` script inserts Dana Group HQ, Dana Pharma, and base departments.
> The `seed:users` script creates employee accounts across those entities.

### Step 6 — Verify it works

Open your browser and visit:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Swagger Docs | http://localhost:8000/api/docs |
| MinIO Console | http://localhost:9001 (user: `minioadmin`, pass: `minioadmin`) |
| Elasticsearch | http://localhost:9200 |

---

## Option B — Run Locally Without Docker

Use this if you want to run the Node.js processes directly (faster restart cycle) but you **still need the infrastructure services** (Postgres, Redis, MinIO, Elasticsearch). The easiest way is to spin up only the infrastructure via Docker and run the app processes locally.

### Step 1 — Start only infrastructure services via Docker

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis minio elasticsearch
```

In dev mode, Postgres is exposed on **port 5433** (to avoid colliding with any local Postgres install). Redis, MinIO, and Elasticsearch are on their default ports.

### Step 2 — Create environment files

```bash
cp .env.example .env
cp dims-backend/.env.example dims-backend/.env
cp dims-frontend/.env.local.example dims-frontend/.env.local
```

In `dims-backend/.env`, use these local values:

```env
DB_HOST=localhost
DB_PORT=5433          # <-- 5433, not 5432, when using the dev Docker compose
REDIS_HOST=localhost
REDIS_PORT=6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
ELASTICSEARCH_NODE=http://localhost:9200
```

### Step 3 — Install dependencies

```bash
# Backend
cd dims-backend
npm install

# Frontend (new terminal)
cd dims-frontend
npm install
```

### Step 4 — Run database migrations

```bash
cd dims-backend
npm run migration:run
```

### Step 5 — Seed the database

```bash
cd dims-backend

# 1. Subsidiaries and departments
npm run seed:table

# 2. Users
npm run seed:users
```

### Step 6 — Start the application

Open **two terminals**:

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd dims-backend
npm run start:dev

# Terminal 2 — Frontend (http://localhost:3000)
cd dims-frontend
npm run dev
```

---

## Environment Variables Reference

### Root `.env` (used by Docker Compose)

| Variable | Description | Example |
|---|---|---|
| `DB_NAME` | PostgreSQL database name | `dims_db` |
| `DB_USER` | PostgreSQL username | `dims_user` |
| `DB_PASSWORD` | PostgreSQL password | `strongpassword` |
| `MINIO_ACCESS_KEY` | MinIO root user | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO root password | `minioadmin` |
| `JWT_SECRET` | JWT signing secret | `long-random-string` |

### `dims-backend/.env`

| Variable | Description | Default |
|---|---|---|
| `PORT` | API server port | `8000` |
| `DB_HOST` | Postgres hostname | `localhost` / `postgres` |
| `DB_PORT` | Postgres port | `5432` / `5433` (dev local) |
| `DB_NAME` | Database name | `dims_db` |
| `DB_USER` | DB username | `dims_user` |
| `DB_PASSWORD` | DB password | *(set this)* |
| `JWT_SECRET` | Access token secret | *(set this — min 32 chars)* |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Refresh token secret | *(set this — min 32 chars)* |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `REDIS_HOST` | Redis hostname | `localhost` / `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `MINIO_ENDPOINT` | MinIO hostname | `localhost` / `minio` |
| `MINIO_PORT` | MinIO port | `9000` |
| `MINIO_ACCESS_KEY` | MinIO user | `minioadmin` |
| `MINIO_SECRET_KEY` | MinIO password | `minioadmin` |
| `MINIO_BUCKET` | Storage bucket name | `dims-files` |
| `ELASTICSEARCH_NODE` | Elasticsearch URL | `http://localhost:9200` |
| `SESSION_SECRET` | Express session secret | *(set this — min 32 chars)* |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |

### `dims-frontend/.env.local`

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL | `ws://localhost:8000` |
| `NEXT_PUBLIC_APP_NAME` | App display name | `DIMS — Dana Internal Mail` |

---

## Database Migrations

Migrations are managed with TypeORM. **Never** set `DB_SYNCHRONIZE=true` in any environment — always use migration files.

```bash
# Run all pending migrations
npm run migration:run

# Revert the last applied migration
npm run migration:revert

# Show migration status (which are applied, which are pending)
npm run migration:show

# Generate a new migration from entity changes
npm run migration:generate
# The file is written to src/database/migrations/
# Rename it immediately to something descriptive, e.g.:
# mv src/database/migrations/AutoMigration*.ts src/database/migrations/1234567-AddUserPhoneField.ts
```

### Via Docker

```bash
docker exec dims_api npm run migration:run
docker exec dims_api npm run migration:revert
docker exec dims_api npm run migration:show
```

### Migration order

Migrations run in timestamp order. The full sequence on a fresh database is:

1. `AutoMigration` — creates all base tables
2. `MakeAttachmentMessageOptional` — makes attachment `messageId` nullable
3. `MakeUserFieldsNullable` — makes `job_title` and `avatar_url` nullable
4. `AddMessageRecipientIndexes` — adds performance indexes to `message_recipients`

---

## Database Seeding

Seeds must be run **after** migrations and **in order**:

```bash
# Step 1 — Subsidiaries + departments (run this first, always)
npm run seed:table          # local
docker exec dims_api npm run seed:table   # Docker

# Step 2 — Users (requires subsidiaries + departments to exist)
npm run seed:users          # local
docker exec dims_api npm run seed:users   # Docker
```

> **Why order matters:** Users are assigned to a `subsidiary_id` and `department_id`. If those rows don't exist yet, the user seeder will throw a foreign key violation.

After seeding you can log in with the test credentials created by `seed:users`. Check `dims-backend/src/database/seeders/11679-usersSeed.ts` for the email addresses and passwords used.

---

## Available URLs

### Development (Docker dev or local)

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Swagger Docs | http://localhost:8000/api/docs |
| MinIO Console | http://localhost:9001 |
| Elasticsearch | http://localhost:9200 |

> **Note:** The existing README listed port 3001 for the API — the correct port is **8000** (set via `PORT=8000` in `.env`).

---

## Before Opening a PR

Run the full CI suite locally before pushing. All checks must pass.

**Backend**
```bash
cd dims-backend
npm run lint        # ESLint
npm run build       # NestJS compile — must exit 0
npm run test        # Unit tests
```

**Frontend**
```bash
cd dims-frontend
npm run lint        # ESLint
npm run type-check  # TypeScript check
npm run build       # Next.js production build
```

---

## CI/CD

| Workflow | Trigger | Actions |
|---|---|---|
| `ci.yml` | Every push / PR | Lint, type-check, build, tests |
| `deploy.yml` | Push to `main` | Auto-deploy to staging |
| `deploy.yml` | Git tag `v*.*.*` | Manual-approval deploy to production |

> The deploy workflow uses a **self-hosted GitHub Actions runner** on the Dana Group production server.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `release/v*` | Release candidates |

---

## Troubleshooting

### `ECONNREFUSED 127.0.0.1:5432` when running migrations locally

You are connecting to `localhost:5432` but the Docker dev Postgres is on **port 5433**. Fix `dims-backend/.env`:
```env
DB_PORT=5433
```

### `ECONNREFUSED 127.0.0.1:5432` inside the Docker container

You ran `npm run migration:run` on the host instead of inside the container. Use:
```bash
docker exec dims_api npm run migration:run
```

### Migrations fail with `relation "users" does not exist`

The migrations haven't been run yet or ran out of order. Check the current state:
```bash
docker exec dims_api npm run migration:show
```
Then run pending ones:
```bash
docker exec dims_api npm run migration:run
```

### Seed fails with `violates foreign key constraint`

You ran `seed:users` before `seed:table`. Always run `seed:table` first.

### Elasticsearch container exits or is unhealthy

Elasticsearch needs at least **2 GB of RAM** available. Increase Docker Desktop memory limit, or lower the heap in `docker-compose.yml`:
```yaml
- ES_JAVA_OPTS=-Xms512m -Xmx512m
```

### `docker compose` command not found

You have Docker Compose v1 (`docker-compose`). Either upgrade to Docker Desktop (which bundles Compose v2) or use `docker-compose` instead of `docker compose` in all commands above.

### Port already in use

If a port like `5432`, `6379`, or `9200` is already used by a local service, either stop the local service or change the host-side port mapping in `docker-compose.dev.yml`.

---

## Documentation

All planning and architecture documents are in the root directory:

- `product-brief.md` — Product overview and business case
- `system-architecture.md` — Technical architecture
- `frontend-blueprint.md` — Frontend engineering spec
- `backend-blueprint.md` — Backend engineering spec
- `infrastructure.md` — DevOps and deployment plan
- `implementation-roadmap.md` — Sprint plan and milestones
