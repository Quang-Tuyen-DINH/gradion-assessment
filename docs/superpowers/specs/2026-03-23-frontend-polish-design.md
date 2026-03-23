# Design Spec — Frontend Polish & Quality Pass
**Date:** 2026-03-23
**Status:** Approved

---

## 1. Overview

The work is scoped to three concerns: code quality (Prettier + ESLint), data validation (backend + frontend), and frontend polish (Ant Design UI, role-aware routing, tests). Executed in sequence via Approach B: foundation first, then correctness, then UI and tests.

---

## 2. Execution Order (Approach B)

1. **Foundation** — Prettier + ESLint monorepo-wide
2. **Correctness** — backend + frontend validation
3. **UI overhaul** — Ant Design migration, role-aware routing, `ConfigProvider`, layout
4. **Tests** — frontend test suite (written after UI stabilizes)
5. **Documentation** — update `DECISIONS.md`

---

## 3. Track 1: Prettier + ESLint (Monorepo-Wide)

### Config

Single `prettier.config.js` at repo root:
```js
// prettier.config.js
export default {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
};
```

### Frontend

- Add `prettier` + `eslint-config-prettier` to `devDependencies`
- Use ESLint v9 flat config syntax — import `eslintConfigPrettier` from `'eslint-config-prettier'` and spread it as the last config object in the `defineConfig([...])` array (disables conflicting ESLint rules). Do NOT use the legacy `extends` key.
- Add `"format": "prettier --write src"` to `frontend/package.json` scripts

### Backend

- Add `prettier` + `eslint-config-prettier` to `devDependencies`
- Extend existing `.eslintrc.js` with `prettier` as last config
- Add `"format": "prettier --write src"` to `backend/package.json` scripts

### Execution

Run format across both packages as the first commit — establishes a clean baseline before any functional changes.

> **Note:** `prettier.config.js` uses ESM `export default` syntax. Prettier 3+ supports ESM config files. Verify `backend/package.json` does not require a CJS config — if it does, rename to `prettier.config.cjs` at the root.

---

## 4. Track 2: Data Validation

### 4.1 Backend — class-validator additions

#### `CreateItemDto` and `UpdateItemDto`
| Field | New Validators | Rationale |
|---|---|---|
| `amount` | `@Max(1_000_000)` | Prevents absurd values from typos |
| `currency` | `@Matches(/^[A-Z]{3}$/)` | Enforces ISO 4217 format; `@MaxLength(3)` alone allowed `"ab"` or `"1"` |
| `merchantName` | `@MinLength(2)`, `@IsNotEmpty()` | If provided, must be a meaningful name; blocks empty string `""` |
| `transactionDate` | `@IsNotFuture()` (custom) | Expense items cannot have a future date |

**Custom validator:** `@IsNotFuture()` implemented via `registerDecorator`. Compares the parsed date (date-only, no time) against today. Error message: `"transactionDate must not be a future date"`.

#### `CreateReportDto` and `UpdateReportDto` (apply to both)
| Field | Validators | Rationale |
|---|---|---|
| `title` | `@IsNotEmpty()`, `@MaxLength(255)` | Spec: `VARCHAR(255) NOT NULL` |
| `description` | `@IsOptional()`, `@MaxLength(2000)` | Prevents abuse on optional field — apply to both Create and Update DTOs |

#### `RejectReportDto` (`backend/src/admin/dto/reject-report.dto.ts`) — new file
| Field | Validators | Rationale |
|---|---|---|
| `reason` | `@IsOptional()`, `@IsString()`, `@MaxLength(500)` | Optional but bounded |

Replace the current raw `@Body() body: { reason?: string }` in the admin controller with `@Body() dto: RejectReportDto`.

#### Auth DTOs
- `@IsEmail()` and `@MinLength(8)` are already present in the signup DTO — no change needed. Confirmed during exploration.

### 4.2 Frontend — `ItemForm` (Ant Design `Form`)

- `amount`: Form rule `min: 0.01, max: 1_000_000`
- `merchantName`: Form rule `min: 2` if provided
- `currency`: **Add as a new optional text input** (currently absent from the form). Form rule `pattern: /^[A-Z]{3}$/` if provided. Default value `"USD"` pre-filled.
- `transactionDate`: Replace the raw `<input type="date">` with Ant Design `DatePicker`. Use `disabledDate={(d) => d.isAfter(dayjs())}` to prevent picking future dates. Also validated in `onFinish` handler as a safety net.

### 4.3 Report creation modal

Replace the bare `prompt()` in `ReportsPage` with an Ant Design `Modal` + `Form`:
- `title` field: required, max 255 chars
- `description` field: optional, max 2000 chars, textarea

---

## 5. Track 3: UI Overhaul (Ant Design)

### 5.1 Setup

Install `antd` and `dayjs` (required by Ant Design's `DatePicker`).

Wrap the app in `ConfigProvider` in `main.tsx`:
```tsx
// main.tsx
import { ConfigProvider } from 'antd';

<ConfigProvider theme={{ token: { colorPrimary: '#4f46e5' } }}>
  <AppRouter />
</ConfigProvider>
```

`App.tsx` — replace Vite boilerplate content with `<AppRouter />`. The component was previously unused.

### 5.2 Layout & Navigation

New `AppLayout` component (`src/shared/components/AppLayout.tsx`) wraps all authenticated routes:
- Ant Design `Layout` with a top `Header`
- `Menu` with items determined by decoded JWT role:
  - All authenticated users: "Reports" → `/reports`
  - No separate admin menu item — admin sees their view at `/reports` too
- Logout button in header: clears localStorage token, redirects to `/login`
- Unauthenticated routes (`/login`, `/signup`) render without `AppLayout`

**JWT role decode:** read `localStorage.getItem('token')`, decode the payload (base64, no signature verification needed client-side), extract `role`. Helper: `src/shared/utils/auth.ts`.

### 5.3 Role-Aware `/reports` Route

`ReportsPage` checks the decoded role on mount:
- **`user` role:** calls `GET /api/v1/reports`, shows own reports, columns: Title, Status, Total, Actions (view, delete if DRAFT)
- **`admin` role:** calls `GET /api/v1/admin/reports`, shows all reports, columns: Title, User Email, Status, Total, Actions (view)

Both render an Ant Design `Table`. Filter by status via Ant Design `Select` above the table.

Detail page follows the same pattern:
- `/reports/:id` — role-aware detail; user sees submit/delete/manage items actions; admin sees approve/reject actions

### 5.4 Page-by-Page Component Mapping

| Current | Ant Design replacement |
|---|---|
| Raw `<input>` / `<select>` in Login/Signup | `Form` + `Input` + `Input.Password` + `Button` |
| `<div>` card list in ReportsPage | `Table` with clickable rows |
| `<div>` card list in AdminReportsPage | merged into role-aware `ReportsPage` |
| `style={{}}` inline styles everywhere | Ant Design component props + CSS classes |
| `StatusBadge` custom component | Ant Design `Tag` with color map |
| `LoadingSpinner` custom component | Ant Design `Spin` |
| `prompt()` for report title | `Modal` + `Form` |
| `confirm()` for delete | `Popconfirm` |
| `ItemForm` raw inputs | Ant Design `Form` with field-level validation |
| `ItemList` raw table | Ant Design `Table` with inline edit/delete actions |
| Admin approve/reject buttons (AdminReportDetailPage) | merged into role-aware `/reports/:id` detail page |

---

## 6. Track 4: Frontend Tests

### Setup

- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `@testing-library/user-event` v14 (required for React 19 compatibility)
- `vitest.config.ts`: `jsdom` environment
- `src/test/setup.ts`: imports `@testing-library/jest-dom`
- Mock `localStorage` and axios client globally in setup

### Test files (~12–15 tests)

| File | Tests |
|---|---|
| `ProtectedRoute.test.tsx` | redirects to `/login` when no token; renders children when token exists |
| `AppLayout.test.tsx` | both roles show a single "Reports" nav item linking to `/reports`; admin does not see a separate admin link |
| `StatusBadge.test.tsx` | correct Ant Design Tag color and label for each of 4 statuses |
| `ItemForm.test.tsx` | future date shows validation error; amount ≤ 0 shows error; valid submit calls `createItem` |
| `ReportsPage.test.tsx` | renders user columns when role=user; renders admin columns (User Email column) when role=admin |

### Philosophy

Quality over quantity. Each test covers logic that matters: auth, role-based rendering, form validation, component correctness. Demonstrates testing mindset without padding coverage with trivial assertions.

---

## 7. Track 5: DECISIONS.md Updates

Add a new section to `DECISIONS.md` covering decisions made during the polish pass:

| Decision | Choice | Rationale |
|---|---|---|
| Component library | Ant Design | Purpose-built for admin/CRUD UIs; comprehensive TypeScript support; built-in form validation, tables, modals, and layout — reduces bespoke CSS to near zero in one day |
| Form management | Ant Design `Form` (not `react-hook-form`) | Ant Design's `Form` provides equivalent field state, validation rules, and error display fully integrated with its input components. Adding `react-hook-form` on top would create two competing form systems with no benefit |
| Admin routing | Single role-aware `/reports` and `/reports/:id` | Separate `/admin/reports` and `/admin/reports/:id` routes were invisible to admins without knowing the URL. A unified route that branches on role is simpler to navigate, keeps the URL structure flat, and eliminates the separate admin pages entirely |
| `@IsNotFuture()` validator | Custom `registerDecorator` | `class-validator` has no built-in future-date check; a custom decorator keeps the DTO declarative and reusable |
| Frontend tests | Vitest + React Testing Library | Vitest is the natural choice for Vite projects (shared config, no babel overhead); RTL tests behavior not implementation |

---

## 8. Files Changed (Summary)

### New files
- `prettier.config.js` (root)
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/test/*.test.tsx` (5 files)
- `frontend/src/shared/components/AppLayout.tsx`
- `frontend/src/shared/utils/auth.ts`
- `backend/src/common/validators/is-not-future.validator.ts`
- `backend/src/admin/dto/reject-report.dto.ts` — new `RejectReportDto` class

### Modified files
- `frontend/eslint.config.js` — add prettier flat config
- `frontend/package.json` — add antd, dayjs, vitest, testing-library, prettier
- `frontend/src/main.tsx` — add ConfigProvider
- `frontend/src/App.tsx` — replace boilerplate with `<AppRouter />`
- `frontend/src/router/index.tsx` — update routes (AppLayout wrapper, role-aware reports, remove /admin/* routes)
- `frontend/src/domains/auth/pages/LoginPage.tsx` — Ant Design Form
- `frontend/src/domains/auth/pages/SignupPage.tsx` — Ant Design Form
- `frontend/src/domains/reports/pages/ReportsPage.tsx` — role-aware Table
- `frontend/src/domains/reports/pages/ReportDetailPage.tsx` — role-aware Ant Design components (user: submit/delete/items; admin: approve/reject)
- `frontend/src/domains/items/components/ItemForm.tsx` — Ant Design Form + DatePicker + currency field
- `frontend/src/domains/items/components/ItemList.tsx` — Ant Design Table
- `frontend/src/shared/components/StatusBadge.tsx` — replaced with Ant Design Tag wrapper
- `frontend/src/shared/components/LoadingSpinner.tsx` — replaced with Ant Design Spin wrapper
- `backend/src/items/dto/create-item.dto.ts` — new validators
- `backend/src/items/dto/update-item.dto.ts` — new validators
- `backend/src/reports/dto/create-report.dto.ts` — new validators
- `backend/src/reports/dto/update-report.dto.ts` — new validators
- `backend/src/admin/admin.controller.ts` — use `RejectReportDto` instead of raw body
- `backend/.eslintrc.js` — add prettier config
- `backend/package.json` — add `prettier` and `eslint-config-prettier` to devDependencies
- `DECISIONS.md` — new polish pass section

### Deleted files
- `frontend/src/domains/admin/pages/AdminReportsPage.tsx` — merged into role-aware `ReportsPage`
- `frontend/src/domains/admin/pages/AdminReportDetailPage.tsx` — merged into role-aware `ReportDetailPage`
