# Design Spec — Expense Report Management System
**Date:** 2026-03-22
**Status:** Approved

---

## 1. Overview

A REST API for an Expense Report Management System, delivered as a monorepo with a NestJS backend and a React frontend. The system supports two roles (`user` and `admin`), a strict status state machine for expense reports, and an AI-powered category suggestion feature.

---

## 2. Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + TypeScript + NestJS |
| Database | PostgreSQL 16 |
| ORM | TypeORM (formal migration files, NOT `synchronize: true`) |
| Auth | JWT (access token, 7d expiry) |
| Password hashing | bcrypt (min 10 rounds) |
| Frontend | React + TypeScript + Vite |
| HTTP Client | Axios |
| AI | Anthropic Claude API |
| Containerization | Docker + docker-compose |

---

## 3. Project Structure

```
gradion-assessment/
├── backend/
│   ├── src/
│   │   ├── auth/             # JWT strategy, guards, login/signup
│   │   ├── users/            # User entity + repository
│   │   ├── reports/          # Expense reports: controller, service, repository
│   │   ├── items/            # Expense items: controller, service, repository
│   │   ├── ai/               # AI category suggestion endpoint
│   │   └── main.ts           # CORS enabled for frontend origin
│   ├── test/                 # Integration tests
│   ├── migrations/           # TypeORM migration files
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── domains/
│   │   │   ├── auth/         # components, hooks, api, pages
│   │   │   ├── reports/      # components, hooks, api, pages
│   │   │   ├── items/        # components, hooks, api
│   │   │   └── ai/           # hooks, api
│   │   ├── shared/
│   │   │   ├── components/   # ErrorBoundary, ProtectedRoute, StatusBadge, LoadingSpinner
│   │   │   ├── hooks/        # useDebounce
│   │   │   └── api/          # client.ts (axios + JWT interceptor + 401 redirect)
│   │   ├── router/
│   │   └── main.tsx
│   ├── Dockerfile            # nginx on port 80
│   └── package.json
├── docker-compose.yml
├── .env.example
├── README.md
└── DECISIONS.md
```

---

## 4. Database Schema

### users
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR | UNIQUE, NOT NULL |
| password_hash | VARCHAR | NOT NULL (bcrypt) |
| role | ENUM('user','admin') | DEFAULT 'user' |
| created_at | TIMESTAMP | NOT NULL |

### expense_reports
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id, INDEX |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| status | ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED') | DEFAULT 'DRAFT', INDEX |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

> `total_amount` is computed at query time by summing linked `expense_items.amount` — not persisted, always in sync.

### expense_items
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| report_id | UUID | FK → expense_reports.id (CASCADE DELETE), INDEX |
| amount | DECIMAL(10,2) | NOT NULL |
| currency | VARCHAR(3) | DEFAULT 'USD' |
| category | ENUM('TRAVEL','MEALS','ACCOMMODATION','TRANSPORTATION','OFFICE_SUPPLIES','ENTERTAINMENT','UTILITIES','OTHER') | |
| merchant_name | VARCHAR(255) | |
| transaction_date | DATE | |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**Indexes:** `expense_reports(user_id)`, `expense_reports(status)`, `expense_items(report_id)`

---

## 5. API Endpoints

Base path: `/api/v1`

All endpoints except `POST /auth/signup` and `POST /auth/login` require a valid JWT (`Authorization: Bearer <token>`).

### Auth (public)
```
POST /api/v1/auth/signup
  Body:    { email: string, password: string (min 8 chars) }
  Returns: { id, email, role }

POST /api/v1/auth/login
  Body:    { email: string, password: string }
  Returns: { access_token: string }
```

### Reports (authenticated user — own reports only)
```
GET /api/v1/reports?status=DRAFT
  Returns: { data: Report[], total: number }
  Note: no pagination for assessment scope; status filter is optional

POST /api/v1/reports
  Body:    { title: string, description?: string }
  Returns: Report

GET /api/v1/reports/:id
  Returns: Report (includes items[] and computed total_amount)

PATCH /api/v1/reports/:id
  Body:    { title?: string, description?: string }
  Guards:  report must be in DRAFT state
  Returns: Report

DELETE /api/v1/reports/:id
  Guards:  report must be in DRAFT state
  Returns: 204 No Content

POST /api/v1/reports/:id/submit
  Guards:  report must be in DRAFT state
  Returns: Report (status: SUBMITTED)

POST /api/v1/reports/:id/return-to-draft
  Guards:  report must be in REJECTED state
  Returns: Report (status: DRAFT)
```

### Items (authenticated user — DRAFT reports only)
```
POST /api/v1/reports/:id/items
  Body:    { amount: number (> 0), currency?: string, category?: string,
             merchant_name?: string, transaction_date?: string (ISO date) }
  Guards:  report must be in DRAFT state
  Returns: ExpenseItem

PATCH /api/v1/reports/:id/items/:itemId
  Body:    { amount?: number (> 0), currency?: string, category?: string,
             merchant_name?: string, transaction_date?: string }
  Guards:  report must be in DRAFT state
  Returns: ExpenseItem

DELETE /api/v1/reports/:id/items/:itemId
  Guards:  report must be in DRAFT state
  Returns: 204 No Content
```

### Admin (admin role only)
```
GET /api/v1/admin/reports?status=SUBMITTED
  Returns: { data: Report[], total: number }
  Note:    status filter is optional; omitting it returns all reports across all statuses

GET /api/v1/admin/reports/:id
  Returns: Report (includes items[] and computed total_amount)

POST /api/v1/admin/reports/:id/approve
  Guards:  report must be in SUBMITTED state
  Returns: Report (status: APPROVED)

POST /api/v1/admin/reports/:id/reject
  Guards:  report must be in SUBMITTED state
  Body:    { reason?: string }
  Returns: Report (status: REJECTED)
```

### AI (authenticated — any role)
```
POST /api/v1/ai/suggest-category
  Body:    { merchant_name: string }
  Returns: { category: string }
  Note:    merchant_name is sanitized before being sent to the Claude API:
           truncated to 200 characters, non-printable/control characters stripped
```

### Response shape — Report
```typescript
{
  id: string
  title: string
  description: string | null
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'
  totalAmount: number         // computed sum of items
  items: ExpenseItem[]
  userId: string
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}
```

### Response shape — ExpenseItem
```typescript
{
  id: string
  reportId: string
  amount: number
  currency: string            // e.g. "USD"
  category: 'TRAVEL' | 'MEALS' | 'ACCOMMODATION' | 'TRANSPORTATION' | 'OFFICE_SUPPLIES' | 'ENTERTAINMENT' | 'UTILITIES' | 'OTHER' | null
  merchantName: string | null
  transactionDate: string | null  // ISO date "YYYY-MM-DD"
  createdAt: string           // ISO 8601
  updatedAt: string           // ISO 8601
}
```

### Error responses
```
400 Bad Request       — validation errors (body: { message: string[] })
401 Unauthorized      — missing or invalid JWT
403 Forbidden         — wrong role or not the owner
404 Not Found         — resource does not exist
422 Unprocessable Entity (UnprocessableEntityException) — invalid state machine transition
500 Internal Server   — unexpected errors (logged, not swallowed)
```

---

## 6. State Machine

```
DRAFT  ──[submit]──► SUBMITTED ──[approve]──► APPROVED (terminal)
  ▲                      │
  │                      │ [reject]
  │[return-to-draft]     ▼
  └──────────────── REJECTED
```

### Rules
- **Transition validation** lives exclusively in `ReportsService` — never in controllers or DB constraints.
- **REJECTED is a real persisted state.** When an admin rejects a report, `status` is set to `REJECTED`. The user must explicitly call `POST /reports/:id/return-to-draft` to move back to `DRAFT`, then edit items, then re-submit. This forces a conscious review before re-submission.
- **Invalid transitions** throw `UnprocessableEntityException` (HTTP 422) with a descriptive message (e.g., `"Cannot submit a report with status APPROVED"`).
- **Edit/delete rights** (report fields + items) only when `status === DRAFT`.
- **Ownership enforcement**: users access only their own reports; admins access all.
- `401` if unauthenticated, `403` if wrong role or not the owner.

### Valid transitions table
| From | Action | Endpoint | To | Actor |
|---|---|---|---|---|
| DRAFT | submit | `POST /:id/submit` | SUBMITTED | user |
| SUBMITTED | approve | `POST /admin/:id/approve` | APPROVED | admin |
| SUBMITTED | reject | `POST /admin/:id/reject` | REJECTED | admin |
| REJECTED | return-to-draft | `POST /:id/return-to-draft` | DRAFT | user |

All other transitions are invalid and return 422.

---

## 7. Frontend

### Pages
| Route | Description |
|---|---|
| `/login` | Email + password form, stores JWT in localStorage¹ |
| `/signup` | Registration form |
| `/reports` | List own reports, filter by status, "New Report" button |
| `/reports/:id` | Report detail + items; DRAFT: inline editable (add/edit/delete items); REJECTED: read-only with "Return to Draft" button; SUBMITTED/APPROVED: read-only |
| `/admin/reports` | Admin: list all reports, filter by status |
| `/admin/reports/:id` | Admin: view report detail, approve/reject buttons (SUBMITTED only) |

> ¹ **Security trade-off (documented):** JWT stored in localStorage for simplicity. In production, an httpOnly cookie would be preferred to mitigate XSS risk. See `DECISIONS.md`.

### Domain Structure
Each domain (`auth`, `reports`, `items`, `ai`) owns its own `components/`, `hooks/`, `api/`, and `pages/` folders. `shared/` is for truly cross-domain utilities only.

### UX Enhancements
- `<ErrorBoundary>` wraps each page route — catches render errors, shows fallback UI
- `<LoadingSpinner>` — shown during any async operation (API calls, AI suggestion)
- `useDebounce(value, 300ms)` in `ItemForm` — debounces `merchant_name` input; suggestion fires **automatically** after the debounce delay (no button click required, but a "Suggest" button is also shown for manual trigger)
- `useMemo` in report list and detail pages — memoizes filtered/sorted data to avoid unnecessary re-renders
- `<ProtectedRoute>` — redirects unauthenticated users to `/login`
- Axios interceptor handles `401` responses by clearing the JWT from localStorage and redirecting to `/login`
- API errors surfaced via inline messages (never silently swallowed)

### Admin Role
Admin users are seeded via a database seed script (`npm run seed`) that creates a default admin account (`admin@gradion.com` / `admin1234`). This is documented in the README. There is no self-registration path for admin accounts.

---

## 8. Testing Strategy

### Unit Tests (Jest — backend)
- Every valid state machine transition including `REJECTED → DRAFT` (return-to-draft)
- Every invalid state machine transition (expects 422)
- Edit/delete attempt on SUBMITTED/APPROVED report (expects error)
- Auth guard behavior (missing token, wrong role)
- AI service: mock Anthropic client to avoid live API calls in tests

### Integration Tests (Supertest — backend)
- **Happy path:** `signup → login → create report → add items → submit → admin approve`
- **Rejection path:** `signup → login → create report → submit → admin reject → user return-to-draft → user re-submits → admin approve`

### Frontend Tests
- Not required for this assessment scope. The priority is backend correctness and state machine integrity. This is documented in `DECISIONS.md` as a known gap with what would be added next.

---

## 9. Docker & Developer Experience

### Services
| Service | Image | Port |
|---|---|---|
| db | postgres:16-alpine | 5432 |
| backend | custom (node:20-alpine) | 3000 |
| frontend | custom (nginx:alpine, port 80) | 5173→80 |

> Frontend uses a production Vite build served by nginx on port 80 inside the container, exposed as 5173 on the host for local development convenience.

### CORS
Backend configures CORS to allow requests from `http://localhost:5173` (the host-mapped frontend port). This is set in `main.ts` via NestJS CORS middleware.

### README — AI Usage Note
The `README.md` must include a dedicated **AI Usage** section (1–2 paragraphs) covering:

- **Tools used:** Claude Code (claude-sonnet-4-6) via the Claude Code CLI, used throughout the entire project — brainstorming, spec writing, implementation planning, and code generation.
- **How AI helped:** AI scaffolded the initial project structure, generated boilerplate (NestJS modules, TypeORM entities, JWT guards, React domain folders), wrote the state machine service, and drafted `DECISIONS.md` and `README.md`.
- **Where the output was overridden or corrected:**
  - *State machine:* AI initially designed the rejection flow as `REJECTED → SUBMITTED` directly (user could re-submit without returning to draft). This was incorrect — corrected to `REJECTED → DRAFT` (explicit user action via `return-to-draft`) to force a conscious review before re-submission.
  - *Frontend UX:* AI proposed a flat component structure and omitted loading states. Corrected to: domain-based folder structure, `<ErrorBoundary>` per route, `useDebounce` on the AI suggestion input, `useMemo` for filtered lists, and `<LoadingSpinner>` for async operations.
  - *Frontend structure:* AI defaulted to a flat `components/` folder. Corrected to a domain-driven structure (`domains/auth`, `domains/reports`, `domains/items`, `domains/ai`) for scalability.

---

### Startup
```bash
git clone <repo>
cp .env.example .env   # fill in ANTHROPIC_API_KEY
docker-compose up --build
# Backend runs TypeORM migrations automatically on start
# Then seed admin user (idempotent — safe to run multiple times):
docker-compose exec backend npm run seed
```

Reviewer is up and running in under 5 minutes.

### Environment Variables (.env.example)
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/gradion
JWT_SECRET=changeme   # MUST be replaced with a high-entropy secret (min 32 chars) before any non-local use
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your_key_here
PORT=3000
FRONTEND_URL=http://localhost:5173
```

---

## 10. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| REJECTED re-submit flow | REJECTED → DRAFT (explicit user action) → SUBMITTED | Forces conscious review before re-submission; cleaner UX signal that something needs fixing |
| total_amount storage | Computed at query time | Always in sync; no risk of stale cached values |
| Frontend structure | Domain-based | Scalable, each domain self-contained |
| State machine location | Service layer only | Clean separation; controllers stay thin |
| TypeORM migrations | Formal migration files (not `synchronize: true`) | Safe for any environment; demonstrates production-readiness |
| JWT storage | localStorage (with documented trade-off) | Simplicity for assessment; httpOnly cookie preferred in production |
| Admin creation | Database seed script | No self-registration for admins; avoids privilege escalation vector |
| AI endpoint auth | JWT required (any authenticated user) | Prevents abuse of paid API; merchant_name sanitized before Claude API call |
| Optional features | AI category suggestion + React frontend | AI feature directly showcases AI proficiency; frontend demonstrates fullstack range |
| Frontend tests | Out of scope for assessment | Documented in DECISIONS.md as the next priority |
