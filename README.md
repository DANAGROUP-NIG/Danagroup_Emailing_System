# DIMS — Dana Internal Mail & Intranet System

A purpose-built, self-hosted internal communication platform for Dana Group of Companies and its subsidiaries.

---

## Project Structure

```
Danagroup_Emailing_System/
├── dims-frontend/         # Next.js 14 frontend application
├── dims-backend/          # NestJS backend API
├── nginx/                 # NGINX reverse proxy configuration
├── .github/workflows/     # GitHub Actions CI/CD pipelines
├── docker-compose.yml     # Production container orchestration
├── docker-compose.dev.yml # Development overrides
└── .env.example           # Environment variable template
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
| Containerization | Docker + Docker Compose |

---

## Quick Start (Development)

### Prerequisites
- Docker & Docker Compose v2+
- Node.js 20 LTS
- npm 10+

### 1. Clone the repository
```bash
git clone <repo-url>
cd Danagroup_Emailing_System
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your local values
```

### 3. Start all services (dev mode)
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 4. Install frontend dependencies (for local dev without Docker)
```bash
cd dims-frontend
npm install
npm run dev
```

### 5. Install backend dependencies (for local dev without Docker)
```bash
cd dims-backend
npm install
npm run start:dev
```

---

## Available URLs (Dev)

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Swagger Docs | http://localhost:3001/api/docs |
| MinIO Console | http://localhost:9001 |
| Elasticsearch | http://localhost:9200 |

---

## Before Opening a PR

Run the full CI suite locally before pushing. All checks must pass — CI will block merging if any step fails.

**Frontend**
```bash
cd dims-frontend
npm run lint        # ESLint
npm run type-check  # TypeScript
npm run build       # Next.js production build
```

**Backend**
```bash
cd dims-backend
npm run lint        # ESLint (warnings are okay, errors are not)
npm run build       # NestJS compile
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
```

> All four frontend steps and all four backend steps must exit with code `0` before the PR is ready to review.

---

## CI/CD

| Workflow | Trigger | Actions |
|---|---|---|
| `ci.yml` | Every push / PR | Lint, type-check, test, Docker build |
| `deploy.yml` | Push to `main` | Auto-deploy to staging |
| `deploy.yml` | Git tag `v*.*.*` | Manual-approval deploy to production |

> **Note:** The deploy workflow uses a **self-hosted GitHub Actions runner** installed on the Dana Group production server.

---

## Database Migrations

```bash
# Generate a new migration
cd dims-backend
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Seed the database tables fist before the users table
npm run seed:table

#seed the users table
npm run seed:test-user

```
---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `feature/*` | Feature development |
| `fix/*` | Bug fixes |
| `release/v*` | Release candidates |

---

## Environment Configuration

See `.env.example` for all required variables. Each service (frontend, backend) also has its own `.env.example`.

---

## Documentation

All planning and architecture documents are in the root directory:
- `product-brief.md` — Product overview and business case
- `system-architecture.md` — Technical architecture
- `frontend-blueprint.md` — Frontend engineering spec
- `backend-blueprint.md` — Backend engineering spec
- `infrastructure.md` — DevOps and deployment plan
- `implementation-roadmap.md` — Sprint plan and milestones.
