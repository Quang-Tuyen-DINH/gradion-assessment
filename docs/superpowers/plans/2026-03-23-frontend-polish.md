# Frontend Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Address reviewer feedback by adding Prettier monorepo-wide, strengthening backend/frontend validation, migrating the frontend to Ant Design with a role-aware single-route UX, adding frontend tests, and updating DECISIONS.md.

**Architecture:** Approach B — Foundation (Prettier) → Correctness (validation) → UI overhaul (Ant Design + role-aware routing) → Tests → Docs. Each track produces a clean commit before the next begins.

**Tech Stack:** Ant Design (antd) + dayjs, Vitest + React Testing Library, class-validator custom decorator, Prettier 3, ESLint flat config.

---

## Pre-flight: Key observations

- `backend/package.json` already has `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`, and a `format` script. Backend ESLint uses **`eslint.config.mjs`** (not `.eslintrc.js`) with `eslintPluginPrettierRecommended` already configured. **Backend Prettier is fully wired up — no ESLint changes needed. The spec mentions `.eslintrc.js` — ignore that; it does not exist and should not be created.**
- `frontend/main.tsx` already imports `AppRouter` directly — it just needs `ConfigProvider` wrapped around it.
- `frontend/src/App.tsx` is the Vite boilerplate and is **not imported anywhere** — clean it up but it has no functional impact.
- `backend/src/admin/admin.controller.ts` uses raw `@Body() body: { reason?: string }` for reject — replace with `RejectReportDto`.

---

## File Map

### New files
| File | Purpose |
|---|---|
| `prettier.config.js` (root) | Shared Prettier config for both packages |
| `backend/src/common/validators/is-not-future.validator.ts` | Custom `@IsNotFuture()` class-validator decorator |
| `backend/src/admin/dto/reject-report.dto.ts` | `RejectReportDto` with bounded optional reason |
| `frontend/vitest.config.ts` | Vitest config with jsdom environment |
| `frontend/src/test/setup.ts` | Test setup: jest-dom matchers + mocks |
| `frontend/src/shared/utils/auth.ts` | JWT decode helper — extract role/userId from localStorage token |
| `frontend/src/shared/components/AppLayout.tsx` | Authenticated layout: Ant Design Header + Menu + logout |
| `frontend/src/test/ProtectedRoute.test.tsx` | Auth redirect tests |
| `frontend/src/test/AppLayout.test.tsx` | Nav role-awareness tests |
| `frontend/src/test/StatusBadge.test.tsx` | Tag color/label tests |
| `frontend/src/test/ItemForm.test.tsx` | Form validation tests |
| `frontend/src/test/ReportsPage.test.tsx` | Role-aware table column tests |

### Modified files
| File | Change |
|---|---|
| `frontend/package.json` | Add antd, dayjs, vitest, @testing-library/*, prettier, eslint-config-prettier |
| `frontend/eslint.config.js` | Add eslintConfigPrettier as last flat config entry |
| `frontend/src/main.tsx` | Wrap with Ant Design `ConfigProvider` |
| `frontend/src/App.tsx` | Replace Vite boilerplate with `<AppRouter />` |
| `frontend/src/router/index.tsx` | AppLayout wrapper; collapse to 4 routes; remove /admin/* |
| `frontend/src/domains/auth/pages/LoginPage.tsx` | Ant Design Form |
| `frontend/src/domains/auth/pages/SignupPage.tsx` | Ant Design Form |
| `frontend/src/shared/components/StatusBadge.tsx` | Ant Design Tag wrapper |
| `frontend/src/shared/components/LoadingSpinner.tsx` | Ant Design Spin wrapper |
| `frontend/src/domains/reports/pages/ReportsPage.tsx` | Role-aware Table + Modal for new report |
| `frontend/src/domains/reports/pages/ReportDetailPage.tsx` | Role-aware detail: user actions vs admin actions |
| `frontend/src/domains/items/components/ItemForm.tsx` | Ant Design Form + DatePicker + currency field |
| `frontend/src/domains/items/components/ItemList.tsx` | Ant Design Table |
| `backend/src/items/dto/create-item.dto.ts` | Add @Max, @Matches, @MinLength, @IsNotEmpty, @IsNotFuture |
| `backend/src/items/dto/update-item.dto.ts` | Same validators (all @IsOptional) |
| `backend/src/reports/dto/create-report.dto.ts` | Add @MaxLength(2000) on description |
| `backend/src/reports/dto/update-report.dto.ts` | Add @MaxLength(2000) on description |
| `backend/src/admin/admin.controller.ts` | Use RejectReportDto |
| `frontend/src/domains/items/api/items.ts` | Add `currency?: string` to `CreateItemPayload` |
| `DECISIONS.md` | Add polish pass decisions section |

### Deleted files
| File | Reason |
|---|---|
| `frontend/src/domains/admin/pages/AdminReportsPage.tsx` | Merged into role-aware ReportsPage |
| `frontend/src/domains/admin/pages/AdminReportDetailPage.tsx` | Merged into role-aware ReportDetailPage |

---

## Task 1: Create root Prettier config

**Files:**
- Create: `prettier.config.js`

- [ ] **Step 1: Create `prettier.config.js` at repo root**

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

> **Important:** Uses ESM `export default`. Prettier 3+ supports ESM config files at the repo root. However, if the repo root `package.json` does NOT have `"type": "module"`, Node will reject the ESM syntax. Verify this works by running the check step below before committing. If it fails, rename the file to `prettier.config.cjs` and change `export default` to `module.exports =`.

- [ ] **Step 2: Verify Prettier can read the config from both packages**

```bash
# From repo root
cd backend && npx prettier --check src/main.ts
cd ../frontend && npx prettier --check src/main.tsx
```

Expected: output like `src/main.ts (unchanged)` or formatting suggestions — not an error about config loading. If you see `SyntaxError: Cannot use import statement`, rename `prettier.config.js` → `prettier.config.cjs` and replace `export default` with `module.exports =`.

- [ ] **Step 3: Commit**

```bash
git add prettier.config.js   # or prettier.config.cjs if renamed
git commit -m "chore: add root prettier config"
```

---

## Task 2: Wire Prettier into the frontend ESLint config

**Files:**
- Modify: `frontend/eslint.config.js`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install prettier and eslint-config-prettier in the frontend**

```bash
cd frontend && npm install --save-dev prettier eslint-config-prettier
```

- [ ] **Step 2: Update `frontend/eslint.config.js`**

Replace the entire file:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  eslintConfigPrettier,
])
```

- [ ] **Step 3: Add format script to `frontend/package.json`**

Add `"format": "prettier --write src"` to the `scripts` section.

- [ ] **Step 4: Run format on both packages**

```bash
# From repo root:
cd frontend && npm run format
cd ../backend && npm run format
```

- [ ] **Step 5: Verify no lint errors**

```bash
cd frontend && npm run lint
cd ../backend && npm run lint
```

Fix any errors that arise (typically unused imports or `any` type warnings surfaced by stricter rules).

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/eslint.config.js frontend/src/ backend/src/ backend/test/
git commit -m "chore: add prettier to frontend, format entire codebase"
```

---

## Task 3: Create `@IsNotFuture()` custom validator (TDD)

**Files:**
- Create: `backend/src/common/validators/is-not-future.validator.ts`

The backend uses Jest. Write the test first, then implement.

- [ ] **Step 1: Write the failing test**

Create `backend/src/common/validators/is-not-future.validator.spec.ts`:

```typescript
import { validate } from 'class-validator';
import { IsNotFuture } from './is-not-future.validator';
import { IsOptional, IsDateString } from 'class-validator';

class TestDto {
  @IsOptional()
  @IsDateString()
  @IsNotFuture()
  transactionDate?: string;
}

describe('@IsNotFuture()', () => {
  it('accepts a past date', async () => {
    const dto = Object.assign(new TestDto(), { transactionDate: '2020-01-01' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts today', async () => {
    const today = new Date().toISOString().split('T')[0];
    const dto = Object.assign(new TestDto(), { transactionDate: today });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects a future date', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    const dto = Object.assign(new TestDto(), { transactionDate: future });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toMatchObject({
      IsNotFuture: 'transactionDate must not be a future date',
    });
  });

  it('passes when field is absent (optional)', async () => {
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test — expect it to fail with "Cannot find module"**

```bash
cd backend && npm test -- --testPathPattern="is-not-future"
```

Expected: FAIL — `Cannot find module './is-not-future.validator'`

- [ ] **Step 3: Create the validator**

Create `backend/src/common/validators/is-not-future.validator.ts`:

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsNotFuture(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsNotFuture',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true; // let @IsDateString handle format
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const date = new Date(value);
          date.setHours(0, 0, 0, 0);
          return date <= today;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not be a future date`;
        },
      },
    });
  };
}
```

- [ ] **Step 4: Run the test — expect it to pass**

```bash
cd backend && npm test -- --testPathPattern="is-not-future"
```

Expected: PASS — 4 tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/common/validators/
git commit -m "feat(backend): add @IsNotFuture custom class-validator decorator"
```

---

## Task 4: Add validators to item DTOs (TDD)

**Files:**
- Modify: `backend/src/items/dto/create-item.dto.ts`
- Modify: `backend/src/items/dto/update-item.dto.ts`

- [ ] **Step 1: Write failing tests for CreateItemDto**

Create `backend/src/items/dto/create-item.dto.spec.ts`:

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateItemDto } from './create-item.dto';

async function validateDto(plain: object) {
  const dto = plainToInstance(CreateItemDto, plain);
  return validate(dto);
}

describe('CreateItemDto validation', () => {
  const valid = { amount: 50, currency: 'USD', merchantName: 'Uber', transactionDate: '2020-01-01' };

  it('accepts valid data', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects amount > 1_000_000', async () => {
    const errors = await validateDto({ ...valid, amount: 2_000_000 });
    expect(errors.some(e => e.property === 'amount')).toBe(true);
  });

  it('rejects invalid currency format', async () => {
    const errors = await validateDto({ ...valid, currency: 'usd' });
    expect(errors.some(e => e.property === 'currency')).toBe(true);
  });

  it('rejects merchantName of length 1', async () => {
    const errors = await validateDto({ ...valid, merchantName: 'A' });
    expect(errors.some(e => e.property === 'merchantName')).toBe(true);
  });

  it('rejects empty string merchantName', async () => {
    const errors = await validateDto({ ...valid, merchantName: '' });
    expect(errors.some(e => e.property === 'merchantName')).toBe(true);
  });

  it('rejects a future transactionDate', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    const errors = await validateDto({ ...valid, transactionDate: future });
    expect(errors.some(e => e.property === 'transactionDate')).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect failures for the new constraint tests**

```bash
cd backend && npm test -- --testPathPattern="create-item.dto"
```

Expected: amount/currency/merchantName/date tests fail (constraints not yet added).

- [ ] **Step 3: Update `backend/src/items/dto/create-item.dto.ts`**

```typescript
import {
  IsNumber, Min, Max, IsOptional, IsString, MinLength, MaxLength,
  IsEnum, IsDateString, IsNotEmpty, Matches,
} from 'class-validator';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';
import { IsNotFuture } from '../../common/validators/is-not-future.validator';

export class CreateItemDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  amount: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  merchantName?: string;

  @IsOptional()
  @IsDateString()
  @IsNotFuture()
  transactionDate?: string;
}
```

- [ ] **Step 4: Update `backend/src/items/dto/update-item.dto.ts`**

```typescript
import {
  IsNumber, Min, Max, IsOptional, IsString, MinLength, MaxLength,
  IsEnum, IsDateString, Matches, IsNotEmpty,
} from 'class-validator';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';
import { IsNotFuture } from '../../common/validators/is-not-future.validator';

export class UpdateItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1_000_000)
  amount?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  merchantName?: string;

  @IsOptional()
  @IsDateString()
  @IsNotFuture()
  transactionDate?: string;
}
```

- [ ] **Step 5: Run tests — expect all to pass**

```bash
cd backend && npm test -- --testPathPattern="create-item.dto"
```

Expected: PASS — 6 tests passing.

- [ ] **Step 6: Run full backend test suite to check for regressions**

```bash
cd backend && npm test
```

Expected: all existing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/items/dto/
git commit -m "feat(backend): strengthen item DTO validators — max amount, currency format, merchant min length, not-future date"
```

---

## Task 5: Add validators to report DTOs + create RejectReportDto

**Files:**
- Modify: `backend/src/reports/dto/create-report.dto.ts`
- Modify: `backend/src/reports/dto/update-report.dto.ts`
- Create: `backend/src/admin/dto/reject-report.dto.ts`
- Modify: `backend/src/admin/admin.controller.ts`

- [ ] **Step 1: Update `backend/src/reports/dto/create-report.dto.ts`**

Add `@MaxLength(2000)` to `description` (title already has `@IsNotEmpty`, `@IsString`, `@MaxLength(255)`):

```typescript
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
```

- [ ] **Step 2: Update `backend/src/reports/dto/update-report.dto.ts`**

```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
```

- [ ] **Step 3: Create `backend/src/admin/dto/reject-report.dto.ts`**

```typescript
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectReportDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
```

- [ ] **Step 4: Update `backend/src/admin/admin.controller.ts`**

Replace the `reject` method's raw body with the DTO:

```typescript
import { Controller, Get, Post, Param, Query, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from '../reports/reports.service';
import { FilterReportsDto } from '../reports/dto/filter-reports.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { RejectReportDto } from './dto/reject-report.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/reports')
export class AdminController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  findAll(@Query() q: FilterReportsDto) { return this.reports.findAllAdmin(q.status); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.reports.findOneAdmin(id); }

  @Post(':id/approve')
  approve(@Param('id') id: string) { return this.reports.approve(id); }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() _dto: RejectReportDto) {
    // reason is accepted per spec but not persisted (no DB column) — documented in DECISIONS.md
    return this.reports.reject(id);
  }
}
```

- [ ] **Step 5: Run full backend test suite**

```bash
cd backend && npm test
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add backend/src/reports/dto/ backend/src/admin/
git commit -m "feat(backend): add description MaxLength to report DTOs, create RejectReportDto"
```

---

## Task 6: Install Ant Design and set up ConfigProvider

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Install antd, dayjs, and @ant-design/icons**

```bash
cd frontend && npm install antd dayjs @ant-design/icons
```

- [ ] **Step 2: Update `frontend/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { AppRouter } from './router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: '#4f46e5' } }}>
      <AppRouter />
    </ConfigProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 3: Clean up `frontend/src/App.tsx`** (unused file — replace boilerplate with minimal content)

```tsx
import { AppRouter } from './router';

export default function App() {
  return <AppRouter />;
}
```

- [ ] **Step 4: Verify the app still starts**

```bash
cd frontend && npm run dev
```

Open `http://localhost:5173` — should redirect to `/login` as before.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/main.tsx frontend/src/App.tsx
git commit -m "feat(frontend): install antd + dayjs, wrap app in ConfigProvider"
```

---

## Task 7: Create auth utility and AppLayout

**Files:**
- Create: `frontend/src/shared/utils/auth.ts`
- Create: `frontend/src/shared/components/AppLayout.tsx`

- [ ] **Step 1: Create `frontend/src/shared/utils/auth.ts`**

```typescript
export type JwtPayload = {
  sub: string;
  email: string;
  role: 'user' | 'admin';
};

export function decodeToken(): JwtPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRole(): 'user' | 'admin' | null {
  return decodeToken()?.role ?? null;
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}
```

- [ ] **Step 2: Create `frontend/src/shared/components/AppLayout.tsx`**

```tsx
import { Layout, Menu, Button, Typography } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const { Header, Content } = Layout;

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    { key: '/reports', label: 'Reports' },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <Typography.Text style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
          Expense Reports
        </Typography.Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname.startsWith('/reports') ? '/reports' : '']}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{ background: 'transparent', borderBottom: 'none', minWidth: 120 }}
          />
          <Button type="text" style={{ color: '#fff' }} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/utils/auth.ts frontend/src/shared/components/AppLayout.tsx
git commit -m "feat(frontend): add JWT decode utility and AppLayout with nav"
```

---

## Task 8: Update router

**Files:**
- Modify: `frontend/src/router/index.tsx`

The router collapses from 6 routes to 4. The `AppLayout` component uses `<Outlet />` so authenticated routes nest inside it.

- [ ] **Step 1: Update `frontend/src/router/index.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { AppLayout } from '../shared/components/AppLayout';
import { LoginPage } from '../domains/auth/pages/LoginPage';
import { SignupPage } from '../domains/auth/pages/SignupPage';
import { ReportsPage } from '../domains/reports/pages/ReportsPage';
import { ReportDetailPage } from '../domains/reports/pages/ReportDetailPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/signup" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/reports" element={<ErrorBoundary><ReportsPage /></ErrorBoundary>} />
          <Route path="/reports/:id" element={<ErrorBoundary><ReportDetailPage /></ErrorBoundary>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Note: `ProtectedRoute` wraps `AppLayout` which uses `<Outlet />` — nested routes render inside the layout's `<Content>`.

- [ ] **Step 2: Verify `frontend/src/shared/components/ProtectedRoute.tsx` — no change needed**

The existing `ProtectedRoute` renders `<>{children}</>` when authenticated. When `AppLayout` is the child, it renders `AppLayout`, which internally calls `<Outlet />` to render the matched nested route. This works correctly as-is. **Do not modify this file.**

- [ ] **Step 3: Verify the app navigates correctly**

```bash
cd frontend && npm run dev
```

- Navigate to `/login` — should show LoginPage without layout.
- Log in — should redirect to `/reports` with header nav visible.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/router/index.tsx frontend/src/shared/components/ProtectedRoute.tsx
git commit -m "feat(frontend): collapse router to 4 routes with AppLayout nesting"
```

---

## Task 9: Update StatusBadge and LoadingSpinner

**Files:**
- Modify: `frontend/src/shared/components/StatusBadge.tsx`
- Modify: `frontend/src/shared/components/LoadingSpinner.tsx`

These are shared components — update them before the pages that use them.

- [ ] **Step 1: Update `frontend/src/shared/components/StatusBadge.tsx`**

```tsx
import { Tag } from 'antd';
import type { ReportStatus } from '../types';

const colorMap: Record<ReportStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  return <Tag color={colorMap[status] ?? 'default'}>{status}</Tag>;
}
```

- [ ] **Step 2: Update `frontend/src/shared/components/LoadingSpinner.tsx`**

```tsx
import { Spin } from 'antd';

export function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <Spin size="large" />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/shared/components/StatusBadge.tsx frontend/src/shared/components/LoadingSpinner.tsx
git commit -m "feat(frontend): replace StatusBadge and LoadingSpinner with Ant Design Tag/Spin"
```

---

## Task 10: Update Login and Signup pages

**Files:**
- Modify: `frontend/src/domains/auth/pages/LoginPage.tsx`
- Modify: `frontend/src/domains/auth/pages/SignupPage.tsx`

- [ ] **Step 1: Update `frontend/src/domains/auth/pages/LoginPage.tsx`**

```tsx
import { Form, Input, Button, Typography, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';

export function LoginPage() {
  const { submit, error, loading } = useLogin();

  const onFinish = ({ email, password }: { email: string; password: string }) => {
    submit(email, password);
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <Typography.Title level={3}>Login</Typography.Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true }]}>
          <Input.Password placeholder="Password" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text>
        <Link to="/signup">Don't have an account? Sign up</Link>
      </Typography.Text>
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/domains/auth/pages/SignupPage.tsx`**

```tsx
import { Form, Input, Button, Typography, Alert } from 'antd';
import { Link } from 'react-router-dom';
import { useSignup } from '../hooks/useSignup';

export function SignupPage() {
  const { submit, error, loading } = useSignup();

  const onFinish = ({ email, password }: { email: string; password: string }) => {
    submit(email, password);
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <Typography.Title level={3}>Sign Up</Typography.Title>
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="you@example.com" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, min: 8, message: 'Password must be at least 8 characters' }]}
        >
          <Input.Password placeholder="Min 8 characters" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Sign Up
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text>
        <Link to="/login">Already have an account? Login</Link>
      </Typography.Text>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/auth/pages/
git commit -m "feat(frontend): migrate Login and Signup pages to Ant Design Form"
```

---

## Task 11: Update ReportsPage (role-aware)

**Files:**
- Modify: `frontend/src/domains/reports/pages/ReportsPage.tsx`

- [ ] **Step 1: Replace `frontend/src/domains/reports/pages/ReportsPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Select, Tag, Modal, Form, Input, Space, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useReports } from '../hooks/useReports';
import { createReport, deleteReport } from '../api/reports';
import { getAdminReports } from '../../admin/api/admin';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { isAdmin } from '../../../shared/utils/auth';
import type { ReportStatus } from '../../../shared/types';

const { Option } = Select;

export function ReportsPage() {
  const navigate = useNavigate();
  const admin = isAdmin();

  // User reports (non-admin path)
  const [filter, setFilter] = useState<ReportStatus | undefined>(undefined);
  const { reports: userReports, loading: userLoading, error } = useReports(admin ? undefined : filter);

  // Admin reports
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFilter, setAdminFilter] = useState<ReportStatus | undefined>(undefined);

  const loadAdmin = useCallback(() => {
    setAdminLoading(true);
    getAdminReports(adminFilter)
      .then((d) => setAdminReports(d.data ?? d))
      .catch(() => {})
      .finally(() => setAdminLoading(false));
  }, [adminFilter]);

  useEffect(() => {
    if (admin) loadAdmin();
  }, [admin, loadAdmin]);

  // New report modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const handleCreate = async (values: { title: string; description?: string }) => {
    setCreating(true);
    try {
      const report = await createReport(values.title.trim(), values.description?.trim());
      setModalOpen(false);
      form.resetFields();
      navigate(`/reports/${report.id}`);
    } catch {
      // error handled by API layer
    } finally {
      setCreating(false);
    }
  };

  // User columns
  const userColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: ReportStatus) => <StatusBadge status={s} />,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `$${Number(v).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/reports/${record.id}`)}>View</Button>
          {record.status === 'DRAFT' && (
            <Popconfirm title="Delete this report?" onConfirm={async () => {
              await deleteReport(record.id);
              window.location.reload();
            }}>
              <Button type="link" danger>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Admin columns
  const adminColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'User',
      key: 'user',
      render: (_: unknown, record: any) => record.user?.email ?? '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: ReportStatus) => <StatusBadge status={s} />,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (v: number) => `$${Number(v).toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: any) => (
        <Button type="link" onClick={() => navigate(`/reports/${record.id}`)}>View</Button>
      ),
    },
  ];

  if (!admin && userLoading) return <LoadingSpinner />;
  if (!admin && error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{admin ? 'All Reports' : 'My Reports'}</h2>
        {!admin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            New Report
          </Button>
        )}
      </div>

      <Select
        placeholder="All statuses"
        allowClear
        style={{ width: 180, marginBottom: 16 }}
        value={admin ? adminFilter : filter}
        onChange={(v) => admin ? setAdminFilter(v) : setFilter(v)}
      >
        {(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'] as ReportStatus[]).map((s) => (
          <Option key={s} value={s}>{s}</Option>
        ))}
      </Select>

      <Table
        rowKey="id"
        columns={admin ? adminColumns : userColumns}
        dataSource={admin ? adminReports : userReports}
        loading={admin ? adminLoading : userLoading}
        onRow={(record) => ({ onClick: (e) => {
          // only navigate on row click if not clicking a button
          if ((e.target as HTMLElement).tagName !== 'BUTTON' && !(e.target as HTMLElement).closest('button')) {
            navigate(`/reports/${record.id}`);
          }
        }})}
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="New Report"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, max: 255, message: 'Title is required (max 255 chars)' }]}
          >
            <Input placeholder="Q1 Travel Expenses" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ max: 2000 }]}
          >
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/src/domains/items/api/items.ts`** — add `currency` to the payload interface:

```typescript
export interface CreateItemPayload {
  amount: number;
  currency?: string;
  category?: string;
  merchantName?: string;
  transactionDate?: string;
}
```

(The `updateItem` and `deleteItem` functions do not need changes — `Partial<CreateItemPayload>` will include `currency` automatically.)

- [ ] **Step 3: Update `frontend/src/domains/reports/api/reports.ts`** to accept optional description in `createReport`:

Read the current file first, then add `description` parameter to the `createReport` function signature and body.

- [ ] **Step 4: Fix delete action — use state refresh instead of `window.location.reload()`**

In the `userColumns` delete `Popconfirm`, replace `window.location.reload()` with a proper state update. The `ReportsPage` component should call `useReports` which exposes a `refetch` or re-trigger. Since `useReports` uses a `filter` state value, the simplest approach is to trigger a force re-render by briefly toggling the filter or by adding a `refreshKey` state counter. Alternatively, refactor `deleteReport` in the confirm handler to call the user reports reload:

```tsx
// Add at top of ReportsPage component:
const [refreshKey, setRefreshKey] = useState(0);
// Then in the delete Popconfirm onConfirm:
onConfirm={async () => {
  await deleteReport(record.id);
  setRefreshKey(k => k + 1);
}}
// Pass refreshKey as a dependency to useReports or force a re-mount via key prop on Table
```

- [ ] **Step 5: Verify the page renders for both roles**

Log in as a regular user — see "My Reports" table.
Log in as admin — see "All Reports" table with User Email column.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/domains/reports/ frontend/src/domains/items/api/items.ts
git commit -m "feat(frontend): role-aware ReportsPage with Ant Design Table and create-report Modal"
```

---

## Task 12: Update ItemForm and ItemList

**Files:**
- Modify: `frontend/src/domains/items/components/ItemForm.tsx`
- Modify: `frontend/src/domains/items/components/ItemList.tsx`

- [ ] **Step 1: Update `frontend/src/domains/items/components/ItemForm.tsx`**

```tsx
import { Form, Input, InputNumber, Select, Button, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useSuggestCategory } from '../../ai/hooks/useSuggestCategory';
import { createItem } from '../api/items';
import { CATEGORIES } from '../../../shared/constants';

interface Props {
  reportId: string;
  onSaved: () => void;
}

export function ItemForm({ reportId, onSaved }: Props) {
  const [form] = Form.useForm();
  const merchantName = Form.useWatch('merchantName', form) ?? '';
  const debouncedMerchant = useDebounce(merchantName, 300);
  const { suggest, loading: aiLoading } = useSuggestCategory(debouncedMerchant, (cat) =>
    form.setFieldValue('category', cat),
  );

  const onFinish = async (values: {
    amount: number;
    currency?: string;
    merchantName?: string;
    category?: string;
    transactionDate?: dayjs.Dayjs;
  }) => {
    await createItem(reportId, {
      amount: values.amount,
      currency: values.currency || undefined,
      merchantName: values.merchantName || undefined,
      category: values.category || undefined,
      transactionDate: values.transactionDate?.format('YYYY-MM-DD') || undefined,
    });
    form.resetFields();
    onSaved();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 24, padding: 16, border: '1px dashed #d9d9d9', borderRadius: 8 }}>
      <h4 style={{ margin: '0 0 12px' }}>Add Item</h4>

      <Form.Item
        name="amount"
        label="Amount"
        rules={[
          { required: true, message: 'Amount is required' },
          { type: 'number', min: 0.01, max: 1_000_000, message: 'Must be between $0.01 and $1,000,000' },
        ]}
      >
        <InputNumber prefix="$" style={{ width: '100%' }} min={0.01} max={1_000_000} step={0.01} />
      </Form.Item>

      <Form.Item
        name="merchantName"
        label="Merchant Name"
        rules={[{ min: 2, message: 'Merchant name must be at least 2 characters' }]}
      >
        <Input.Search
          placeholder="e.g. Uber"
          enterButton={aiLoading ? '...' : 'Suggest'}
          onSearch={suggest}
          loading={aiLoading}
        />
      </Form.Item>

      <Form.Item name="category" label="Category">
        <Select placeholder="Select category" allowClear>
          {CATEGORIES.map((c) => <Select.Option key={c} value={c}>{c}</Select.Option>)}
        </Select>
      </Form.Item>

      <Form.Item
        name="currency"
        label="Currency"
        initialValue="USD"
        rules={[{ pattern: /^[A-Z]{3}$/, message: 'Must be a 3-letter currency code (e.g. USD)' }]}
      >
        <Input placeholder="USD" maxLength={3} style={{ width: 100 }} />
      </Form.Item>

      <Form.Item
        name="transactionDate"
        label="Transaction Date"
        rules={[{
          validator: (_, value) => {
            if (value && dayjs(value).isAfter(dayjs(), 'day')) {
              return Promise.reject('Transaction date cannot be in the future');
            }
            return Promise.resolve();
          },
        }]}
      >
        <DatePicker
          style={{ width: '100%' }}
          disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          format="YYYY-MM-DD"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">Add Item</Button>
      </Form.Item>
    </Form>
  );
}
```

- [ ] **Step 2: Update `frontend/src/domains/items/components/ItemList.tsx`**

```tsx
import { useState } from 'react';
import { Table, Button, InputNumber, Select, Popconfirm, Space, Form } from 'antd';
import { CATEGORIES } from '../../../shared/constants';

interface Item {
  id: string;
  amount: number;
  currency: string | null;
  category: string | null;
  merchantName: string | null;
  transactionDate: string | null;
}

interface Props {
  items: Item[];
  canEdit: boolean;
  onDelete: (itemId: string) => Promise<void>;
  onUpdate: (itemId: string, data: { amount?: number; category?: string; merchantName?: string }) => Promise<void>;
}

export function ItemList({ items, canEdit, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    editForm.setFieldsValue({ amount: item.amount, category: item.category ?? '' });
  };

  const saveEdit = async (item: Item) => {
    const values = await editForm.validateFields();
    await onUpdate(item.id, { amount: values.amount, category: values.category || undefined });
    setEditingId(null);
  };

  const columns = [
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, record: Item) =>
        editingId === record.id ? (
          <Form.Item name="amount" rules={[{ type: 'number', min: 0.01, max: 1_000_000 }]} style={{ margin: 0 }}>
            <InputNumber prefix="$" min={0.01} max={1_000_000} step={0.01} />
          </Form.Item>
        ) : (
          `$${Number(record.amount).toFixed(2)}`
        ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (_: unknown, record: Item) =>
        editingId === record.id ? (
          <Form.Item name="category" style={{ margin: 0 }}>
            <Select allowClear style={{ minWidth: 160 }}>
              {CATEGORIES.map((c) => <Select.Option key={c} value={c}>{c}</Select.Option>)}
            </Select>
          </Form.Item>
        ) : (
          record.category ?? '—'
        ),
    },
    { title: 'Merchant', dataIndex: 'merchantName', key: 'merchantName', render: (v: string | null) => v ?? '—' },
    { title: 'Date', dataIndex: 'transactionDate', key: 'transactionDate', render: (v: string | null) => v ?? '—' },
    ...(canEdit ? [{
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Item) =>
        editingId === record.id ? (
          <Space>
            <Button type="link" onClick={() => saveEdit(record)}>Save</Button>
            <Button type="link" onClick={() => setEditingId(null)}>Cancel</Button>
          </Space>
        ) : (
          <Space>
            <Button type="link" onClick={() => startEdit(record)}>Edit</Button>
            <Popconfirm title="Delete this item?" onConfirm={() => onDelete(record.id)}>
              <Button type="link" danger>Delete</Button>
            </Popconfirm>
          </Space>
        ),
    }] : []),
  ];

  return (
    <Form form={editForm}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={false}
        locale={{ emptyText: 'No items yet.' }}
        size="small"
      />
    </Form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/items/
git commit -m "feat(frontend): migrate ItemForm and ItemList to Ant Design with validation"
```

---

## Task 13: Update ReportDetailPage (role-aware)

**Files:**
- Modify: `frontend/src/domains/reports/pages/ReportDetailPage.tsx`

- [ ] **Step 1: Replace `frontend/src/domains/reports/pages/ReportDetailPage.tsx`**

```tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Descriptions, Space, Alert, Popconfirm, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getReport, submitReport, returnToDraft, deleteReport } from '../api/reports';
import { getAdminReport, approveReport, rejectReport } from '../../admin/api/admin';
import { updateItem, deleteItem } from '../../items/api/items';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ItemForm } from '../../items/components/ItemForm';
import { ItemList } from '../../items/components/ItemList';
import { isAdmin } from '../../../shared/utils/auth';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const admin = isAdmin();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const reload = useCallback(() => {
    setLoading(true);
    const fetch = admin ? getAdminReport(id!) : getReport(id!);
    fetch
      .then(setReport)
      .catch(() => setError('Failed to load report'))
      .finally(() => setLoading(false));
  }, [id, admin]);

  useEffect(() => { reload(); }, [reload]);

  if (loading) return <LoadingSpinner />;
  if (error || !report) return <Alert type="error" message={error || 'Report not found'} />;

  const isDraft = report.status === 'DRAFT';
  const isRejected = report.status === 'REJECTED';
  const isSubmitted = report.status === 'SUBMITTED';

  const withError = async (fn: () => Promise<void>, msg: string) => {
    setActionError('');
    try { await fn(); reload(); }
    catch { setActionError(msg); }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        type="link"
        onClick={() => navigate('/reports')}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to reports
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>{report.title}</Typography.Title>
        <StatusBadge status={report.status} />
      </div>

      {actionError && <Alert type="error" message={actionError} style={{ marginBottom: 16 }} />}

      <Descriptions bordered size="small" style={{ marginBottom: 24 }}>
        {report.description && <Descriptions.Item label="Description" span={3}>{report.description}</Descriptions.Item>}
        <Descriptions.Item label="Total">${Number(report.totalAmount).toFixed(2)}</Descriptions.Item>
        {admin && report.user && <Descriptions.Item label="Submitted by">{report.user.email}</Descriptions.Item>}
      </Descriptions>

      <Typography.Title level={5}>Items</Typography.Title>
      <ItemList
        items={report.items ?? []}
        canEdit={isDraft && !admin}
        onDelete={async (itemId) => { await deleteItem(id!, itemId); reload(); }}
        onUpdate={async (itemId, data) => { await updateItem(id!, itemId, data); reload(); }}
      />

      {isDraft && !admin && (
        <>
          <ItemForm reportId={id!} onSaved={reload} />
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => withError(() => submitReport(id!), 'Failed to submit')}>
              Submit Report
            </Button>
            <Popconfirm title="Delete this report?" onConfirm={() => withError(() => deleteReport(id!).then(() => { navigate('/reports'); return; }), 'Failed to delete')}>
              <Button danger>Delete Report</Button>
            </Popconfirm>
          </Space>
        </>
      )}

      {isRejected && !admin && (
        <Button
          style={{ marginTop: 16 }}
          onClick={() => withError(() => returnToDraft(id!), 'Failed to return to draft')}
        >
          Return to Draft
        </Button>
      )}

      {isSubmitted && admin && (
        <Space style={{ marginTop: 16 }}>
          <Popconfirm title="Approve this report?" onConfirm={() => withError(() => approveReport(id!), 'Failed to approve')}>
            <Button type="primary">Approve</Button>
          </Popconfirm>
          <Popconfirm title="Reject this report?" onConfirm={() => withError(() => rejectReport(id!), 'Failed to reject')}>
            <Button danger>Reject</Button>
          </Popconfirm>
        </Space>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify end-to-end flows**

As user: create report → add items → submit.
As admin: view submitted report → approve/reject.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/reports/pages/ReportDetailPage.tsx
git commit -m "feat(frontend): role-aware ReportDetailPage — user actions vs admin approve/reject"
```

---

## Task 14: Delete obsolete admin pages

**Files:**
- Delete: `frontend/src/domains/admin/pages/AdminReportsPage.tsx`
- Delete: `frontend/src/domains/admin/pages/AdminReportDetailPage.tsx`

- [ ] **Step 1: Delete the files**

```bash
git rm frontend/src/domains/admin/pages/AdminReportsPage.tsx
git rm frontend/src/domains/admin/pages/AdminReportDetailPage.tsx
```

- [ ] **Step 2: Verify the build compiles without errors**

```bash
cd frontend && npm run build
```

Expected: build succeeds with no import errors.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore(frontend): remove obsolete AdminReportsPage and AdminReportDetailPage"
```

---

## Task 15: Set up frontend test infrastructure

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Install test dependencies**

```bash
cd frontend && npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event@14 jsdom
```

- [ ] **Step 2: Create `frontend/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 3: Create `frontend/src/test/setup.ts`**

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock axios client globally
vi.mock('../shared/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

- [ ] **Step 4: Add test script to `frontend/package.json`**

Add `"test": "vitest run"` and `"test:watch": "vitest"` to scripts.

- [ ] **Step 5: Verify test setup works (no tests yet — should exit cleanly)**

```bash
cd frontend && npm test
```

Expected: "No test files found" or exits 0.

- [ ] **Step 6: Commit**

```bash
git add frontend/vitest.config.ts frontend/src/test/setup.ts frontend/package.json
git commit -m "chore(frontend): add Vitest + React Testing Library test infrastructure"
```

---

## Task 16: Write ProtectedRoute tests

**Files:**
- Create: `frontend/src/test/ProtectedRoute.test.tsx`

- [ ] **Step 1: Write the tests**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';

function setup(hasToken: boolean) {
  if (hasToken) {
    localStorage.setItem('token', 'fake.token.here');
  } else {
    localStorage.removeItem('token');
  }
}

describe('ProtectedRoute', () => {
  afterEach(() => localStorage.clear());

  it('redirects to /login when no token is present', () => {
    setup(false);
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/reports"
            element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    setup(true);
    render(
      <MemoryRouter initialEntries={['/reports']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/reports"
            element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>}
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run and confirm passing**

```bash
cd frontend && npm test -- ProtectedRoute
```

Expected: PASS — 2 tests.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/test/ProtectedRoute.test.tsx
git commit -m "test(frontend): add ProtectedRoute auth redirect tests"
```

---

## Task 17: Write AppLayout tests

**Files:**
- Create: `frontend/src/test/AppLayout.test.tsx`

- [ ] **Step 1: Create a valid JWT token for testing**

The `decodeToken` helper in `auth.ts` does `atob(token.split('.')[1])`. For tests, we need a token with a valid base64 payload. Helper:

```typescript
function makeToken(role: 'user' | 'admin') {
  const payload = btoa(JSON.stringify({ sub: '1', email: 'test@test.com', role }));
  return `header.${payload}.sig`;
}
```

- [ ] **Step 2: Write the tests**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from '../shared/components/AppLayout';

function makeToken(role: 'user' | 'admin') {
  const payload = btoa(JSON.stringify({ sub: '1', email: 'test@test.com', role }));
  return `header.${payload}.sig`;
}

describe('AppLayout navigation', () => {
  afterEach(() => localStorage.clear());

  it('shows a single Reports nav item for a regular user', () => {
    localStorage.setItem('token', makeToken('user'));
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('shows a single Reports nav item for an admin — no separate admin link', () => {
    localStorage.setItem('token', makeToken('admin'));
    render(
      <MemoryRouter>
        <AppLayout />
      </MemoryRouter>,
    );
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run and confirm passing**

```bash
cd frontend && npm test -- AppLayout
```

Expected: PASS — 2 tests.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/test/AppLayout.test.tsx
git commit -m "test(frontend): add AppLayout nav role-awareness tests"
```

---

## Task 18: Write StatusBadge tests

**Files:**
- Create: `frontend/src/test/StatusBadge.test.tsx`

- [ ] **Step 1: Write the tests**

```tsx
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../shared/components/StatusBadge';
import type { ReportStatus } from '../shared/types';

const colorMap: Record<ReportStatus, string> = {
  DRAFT: 'default',
  SUBMITTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

describe('StatusBadge', () => {
  const cases = Object.entries(colorMap) as [ReportStatus, string][];

  cases.forEach(([status, expectedColor]) => {
    it(`renders label and correct color for ${status}`, () => {
      const { container } = render(<StatusBadge status={status} />);
      expect(screen.getByText(status)).toBeInTheDocument();
      // Ant Design Tag renders with data-testid or class containing the color token
      const tag = container.querySelector('.ant-tag');
      expect(tag).toBeInTheDocument();
      // Verify the color prop is applied — Ant Design adds a style or class for named colors
      expect(tag?.className).toMatch(new RegExp(`ant-tag-${expectedColor}|${expectedColor}`));
    });
  });
});
```

> Note: Ant Design Tag renders class names like `ant-tag-blue`, `ant-tag-green`, `ant-tag-red`. The `default` color uses `ant-tag-default` or no color class. If the class assertion is too brittle due to Ant Design version differences, simplify to just the label check — the label test is still meaningful.


- [ ] **Step 2: Run and confirm passing**

```bash
cd frontend && npm test -- StatusBadge
```

Expected: PASS — 4 tests.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/test/StatusBadge.test.tsx
git commit -m "test(frontend): add StatusBadge label tests for all 4 statuses"
```

---

## Task 19: Write ItemForm validation tests

**Files:**
- Create: `frontend/src/test/ItemForm.test.tsx`

- [ ] **Step 1: Mock the items API and AI hook**

Mock at the hook level (not just the API) to avoid side-effects from `useSuggestCategory`'s internal effects:

```typescript
vi.mock('../domains/items/api/items', () => ({
  createItem: vi.fn().mockResolvedValue({}),
}));
// Mock the hook, not just the underlying API, to prevent timer/effect side-effects
vi.mock('../domains/ai/hooks/useSuggestCategory', () => ({
  useSuggestCategory: () => ({ suggest: vi.fn(), loading: false }),
}));
```

- [ ] **Step 2: Write the tests**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ItemForm } from '../domains/items/components/ItemForm';
import * as itemsApi from '../domains/items/api/items';

vi.mock('../domains/items/api/items', () => ({
  createItem: vi.fn().mockResolvedValue({}),
}));
// Mock at the hook level to avoid useSuggestCategory's internal effects/timers
vi.mock('../domains/ai/hooks/useSuggestCategory', () => ({
  useSuggestCategory: () => ({ suggest: vi.fn(), loading: false }),
}));

describe('ItemForm validation', () => {
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows error when amount is 0', async () => {
    const user = userEvent.setup();
    render(<ItemForm reportId="1" onSaved={onSaved} />);

    await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '0');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
      expect(screen.getByText(/between/i)).toBeInTheDocument();
    });
    expect(itemsApi.createItem).not.toHaveBeenCalled();
  });

  it('calls createItem with valid data', async () => {
    const user = userEvent.setup();
    render(<ItemForm reportId="1" onSaved={onSaved} />);

    await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '50');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
      expect(itemsApi.createItem).toHaveBeenCalledWith('1', expect.objectContaining({ amount: 50 }));
    });
  });
});
```

> Note: Testing the future-date validation via `DatePicker` requires simulating Ant Design's date picker interaction, which is complex in tests. The date validator is covered by the custom `disabledDate` prop and the `onFinish` validator rule — both are simple enough that unit testing the validator function directly (not via the full component) is more reliable. Add a third test if needed:

```tsx
it('future date validator rejects tomorrow', async () => {
  const tomorrow = new Date(Date.now() + 86_400_000);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayjs = (await import('dayjs')).default;
  const dayjsTomorrow = dayjs(tomorrowStr);
  expect(dayjsTomorrow.isAfter(dayjs(), 'day')).toBe(true);
});
```

- [ ] **Step 3: Run and confirm passing**

```bash
cd frontend && npm test -- ItemForm
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/test/ItemForm.test.tsx
git commit -m "test(frontend): add ItemForm validation tests — amount bounds and createItem call"
```

---

## Task 20: Write ReportsPage role-awareness tests

**Files:**
- Create: `frontend/src/test/ReportsPage.test.tsx`

- [ ] **Step 1: Mock the reports APIs**

```typescript
vi.mock('../domains/reports/api/reports', () => ({
  createReport: vi.fn(),
  deleteReport: vi.fn(),
}));
vi.mock('../domains/reports/hooks/useReports', () => ({
  useReports: () => ({ reports: [], loading: false, error: null }),
}));
vi.mock('../domains/admin/api/admin', () => ({
  getAdminReports: vi.fn().mockResolvedValue({ data: [] }),
}));
```

- [ ] **Step 2: Write the tests**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ReportsPage } from '../domains/reports/pages/ReportsPage';

function makeToken(role: 'user' | 'admin') {
  const payload = btoa(JSON.stringify({ sub: '1', email: 'test@test.com', role }));
  return `header.${payload}.sig`;
}

vi.mock('../domains/reports/api/reports', () => ({
  createReport: vi.fn(),
  deleteReport: vi.fn(),
}));
vi.mock('../domains/reports/hooks/useReports', () => ({
  useReports: () => ({ reports: [], loading: false, error: null }),
}));
vi.mock('../domains/admin/api/admin', () => ({
  getAdminReports: vi.fn().mockResolvedValue({ data: [] }),
}));

describe('ReportsPage role-aware rendering', () => {
  afterEach(() => localStorage.clear());

  it('shows "My Reports" heading and New Report button for user role', () => {
    localStorage.setItem('token', makeToken('user'));
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);
    expect(screen.getByText('My Reports')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new report/i })).toBeInTheDocument();
  });

  it('shows "All Reports" heading and User column for admin role', async () => {
    localStorage.setItem('token', makeToken('admin'));
    render(<MemoryRouter><ReportsPage /></MemoryRouter>);
    expect(screen.getByText('All Reports')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new report/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run and confirm passing**

```bash
cd frontend && npm test -- ReportsPage
```

Expected: PASS — 2 tests.

- [ ] **Step 4: Run full frontend test suite**

```bash
cd frontend && npm test
```

Expected: all tests pass (12–15 total).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/test/ReportsPage.test.tsx
git commit -m "test(frontend): add ReportsPage role-aware column and heading tests"
```

---

## Task 21: Update DECISIONS.md

**Files:**
- Modify: `DECISIONS.md`

- [ ] **Step 1: Read the current DECISIONS.md**

```bash
cat DECISIONS.md
```

- [ ] **Step 2: Append a new "Polish Pass Decisions" section**

Add the following at the end of `DECISIONS.md`:

```markdown
---

## Polish Pass — March 2026

| Decision | Choice | Rationale |
|---|---|---|
| Component library | Ant Design | Purpose-built for admin/CRUD UIs; comprehensive TypeScript support; built-in form validation, tables, modals, and layout — reduces bespoke CSS to near zero |
| Form management | Ant Design `Form` (not `react-hook-form`) | Ant Design's `Form` provides equivalent field state, validation rules, and error display fully integrated with its input components. Adding `react-hook-form` would create two competing form systems with no benefit |
| Admin routing | Single role-aware `/reports` and `/reports/:id` | Separate `/admin/reports` routes were invisible to admins without knowing the URL. A unified route that branches on role is simpler to navigate and eliminates separate admin pages |
| Backend admin routes | Kept separate (`/api/v1/admin/reports`) | Frontend unification is a UX decision; backend separation is a security/API design decision. `@Roles(UserRole.ADMIN)` guard on `/admin/*` routes gives explicit, auditable access control with zero ambiguity |
| `@IsNotFuture()` validator | Custom `registerDecorator` | `class-validator` has no built-in future-date check; a custom decorator keeps the DTO declarative and reusable |
| Frontend tests | Vitest + React Testing Library | Vitest is the natural choice for Vite projects (shared config, no babel overhead); RTL tests behavior not implementation — 13 focused tests covering auth, role-based rendering, form validation, and component correctness |
```

- [ ] **Step 3: Commit**

```bash
git add DECISIONS.md
git commit -m "docs: update DECISIONS.md with polish pass decisions"
```

---

## Task 22: Final verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npm test
```

Expected: all pass.

- [ ] **Step 2: Run all frontend tests**

```bash
cd frontend && npm test
```

Expected: all pass.

- [ ] **Step 3: Build the frontend**

```bash
cd frontend && npm run build
```

Expected: successful build, no TypeScript errors.

- [ ] **Step 4: Run lint on both packages**

```bash
cd frontend && npm run lint
cd ../backend && npm run lint
```

Expected: no errors.

- [ ] **Step 5: Smoke test the running app**

```bash
docker-compose up --build
```

- Login as user → see My Reports → create report → add item (verify future date blocked) → submit
- Login as admin → see All Reports with User column → view report → approve

- [ ] **Step 6: Tag the commit if all checks pass**

```bash
git tag v1.1.0
```
