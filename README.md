# Expense Report Management System

Full-stack application for managing employee expense reports, built as a NestJS + React monorepo.

## Quick Start

```bash
git clone https://github.com/Quang-Tuyen-DINH/gradion-assessment.git
cd gradion-assessment
cp .env.example .env          # fill in JWT_SECRET and ANTHROPIC_API_KEY
docker-compose up --build
docker-compose exec backend npm run seed   # creates admin@gradion.com / admin1234
```

App: http://localhost:5173 | API: http://localhost:3000

## Run Tests

```bash
cd backend
npm test                   # unit tests (25 tests)
npm run test:e2e           # integration tests (requires running DB)
```

## Architecture

**Monorepo:** `/backend` (NestJS) + `/frontend` (React 18 + Vite)

**Backend layers:** Controller → Service → Repository. State machine lives exclusively in `ReportsService`.

**Report lifecycle:** `DRAFT → SUBMITTED → APPROVED` or `SUBMITTED → REJECTED → DRAFT → SUBMITTED`

**Frontend domains:** `auth` | `reports` | `items` | `ai` | `admin` — each domain owns its API calls, hooks, components, and pages.

## AI Usage

**Tool:** Claude Code (claude-sonnet-4-6) via the Anthropic API

**How it was used:**
- Scaffolded the full project structure (NestJS modules, TypeORM entities, migrations, React domain folders)
- Generated boilerplate (DTOs, guards, decorators, Axios interceptors)
- Wrote the state machine logic and all unit + integration tests
- Drafted documentation

**Human overrides applied:**
- State machine corrected: `REJECTED → DRAFT` (explicit user action) instead of auto-reset
- camelCase enforced for all JSON responses (overriding spec's `access_token`)
- Frontend structure corrected to domain-based (not layer-based)
- Added `useCallback`/`useRef` hooks, cancellation flags, and error handling missed in generated code
- Added `componentDidCatch` logging, typed API response interfaces, 401 loop guard

## Seed Credentials

- **Admin:** admin@gradion.com / admin1234
- **User:** register via /signup
