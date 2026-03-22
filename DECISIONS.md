# Architecture & Design Decisions

## Stack Choices

**NestJS + TypeScript:** Decorator-based structure maps cleanly to the layered architecture required (Controller → Service → Repository). Strong TypeScript support catches state machine mistakes at compile time.

**TypeORM + PostgreSQL 16:** Formal migration files (`synchronize: false`) over auto-sync — production databases must never be auto-mutated. TypeORM's repository pattern keeps DB access consistent.

**JWT (7d expiry) stored in localStorage:** Simple to implement. Acknowledged trade-off: vulnerable to XSS. Production alternative: httpOnly cookies with refresh token rotation. Out of scope for this assessment.

**React 18 + Vite:** Fast HMR during development. Domain-based folder structure (`domains/auth`, `domains/reports`, etc.) keeps feature code co-located and scales better than layer-based (`components/`, `hooks/`, `pages/` at root).

## State Machine Design

```
DRAFT → SUBMITTED → APPROVED
              ↓
           REJECTED → DRAFT (user action) → SUBMITTED
```

**Why REJECTED → DRAFT requires explicit action:** An employee must consciously decide to resubmit after rejection. Auto-reset would bypass the rejection feedback loop. The `return-to-draft` endpoint makes this intent explicit.

**Why transitions live only in `ReportsService`:** Controllers are thin — they parse HTTP. Putting state logic in controllers would scatter business rules and make them harder to test. All 11 state machine unit tests target the service directly.

## `totalAmount` Computed at Query Time

Not persisted as a column. Computed by summing `item.amount` via a SQL `LEFT JOIN`. Avoids denormalization bugs where `totalAmount` drifts from actual items. Minor query overhead is acceptable for this scale.

## TypeORM Decimal Transformer

PostgreSQL returns `DECIMAL` columns as strings. A column transformer (`from: (v) => parseFloat(v)`) ensures `amount` is always a `number` in TypeScript, preventing silent string arithmetic bugs.

## Admin via Seed, Not Self-Registration

Allowing users to self-assign admin role is a security hole. Admin accounts are provisioned via an idempotent seed script (`npm run seed`). In production this would be a separate admin provisioning flow with MFA.

## Category as Enum

`TRAVEL | MEALS | ACCOMMODATION | TRANSPORTATION | OFFICE_SUPPLIES | ENTERTAINMENT | UTILITIES | OTHER` — enforced at both DB (`ENUM` column) and DTO (`@IsEnum`) levels. Free text would require normalization for any reporting or budgeting features.

## If I Had One More Day

**Frontend tests (Vitest + React Testing Library)** — The backend has 25 unit tests and a full E2E suite, but the frontend has none. I'd add tests for the state machine UI logic: does `ReportDetailPage` show the Submit button only in DRAFT? Does `ItemForm` clear after save? Does `useSuggestCategory` debounce correctly?

**Refresh token flow** — The current JWT expires in 7 days and users are silently logged out. A short-lived access token (15 min) + httpOnly refresh token cookie with a `/auth/refresh` endpoint would be significantly more secure without sacrificing UX.

**Pagination on report lists** — `GET /reports` currently returns all reports. With even a few hundred reports per user, this becomes slow. Cursor-based pagination with `?cursor=` + `limit=20` would be the right approach (offset pagination has drift issues with live data).

**Receipt image upload** — Expense reports without receipts have limited audit value. A `POST /reports/:id/items/:itemId/receipt` endpoint accepting multipart form-data, stored in MinIO (S3-compatible), with a pre-signed URL for viewing, would make this a production-viable tool.

**Audit log for status transitions** — Currently there is no record of *when* a report moved from DRAFT to SUBMITTED, or *who* approved it. A `report_events` table (`reportId`, `fromStatus`, `toStatus`, `actorId`, `createdAt`) would enable compliance reporting and dispute resolution.

**Rate limiting on AI endpoint** — `POST /ai/suggest-category` calls the Anthropic API on every request. A `@nestjs/throttler` guard (e.g., 10 req/min per user) + Redis-backed cache (TTL 1h per merchant name) would cut costs and protect against abuse.

**Role management UI** — Currently admins are created only via the seed script. An admin-only `PATCH /admin/users/:id/role` endpoint + a simple UI would let a super-admin promote users without touching the database directly.
