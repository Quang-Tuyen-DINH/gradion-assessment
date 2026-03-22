# Expense Report Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Expense Report Management System with a NestJS REST API, PostgreSQL database, React frontend, and AI-powered category suggestion — delivered as a monorepo.

**Architecture:** Layered NestJS backend (Controller → Service → Repository) with strict state machine validation in the service layer. React frontend uses domain-based folder structure. All state transitions enforced in `ReportsService` — never in controllers or DB.

**Tech Stack:** Node.js 20, TypeScript, NestJS, TypeORM, PostgreSQL 16, JWT (passport-jwt), bcrypt, React 18, Vite, Axios, Anthropic Claude API, Docker, docker-compose, Jest, Supertest.

**Spec:** `docs/superpowers/specs/2026-03-22-expense-report-api-design.md`

---

## File Map

### Backend (`backend/src/`)

| File | Responsibility |
|---|---|
| `main.ts` | Bootstrap NestJS app, enable CORS, validation pipe |
| `app.module.ts` | Root module — imports all feature modules |
| `auth/auth.module.ts` | Auth feature module wiring |
| `auth/auth.controller.ts` | `POST /auth/signup`, `POST /auth/login` |
| `auth/auth.service.ts` | signup (bcrypt hash), login (JWT sign) |
| `auth/dto/signup.dto.ts` | Validation: email, password min 8 chars |
| `auth/dto/login.dto.ts` | Validation: email, password |
| `auth/strategies/jwt.strategy.ts` | Passport JWT strategy — extracts user from token |
| `auth/guards/jwt-auth.guard.ts` | Protects endpoints requiring auth |
| `auth/guards/roles.guard.ts` | Enforces `user` / `admin` role |
| `auth/decorators/roles.decorator.ts` | `@Roles()` decorator |
| `users/users.module.ts` | Users feature module |
| `users/users.service.ts` | `findByEmail`, `findById`, `create` |
| `users/entities/user.entity.ts` | TypeORM entity: id, email, passwordHash, role |
| `reports/reports.module.ts` | Reports feature module |
| `reports/reports.controller.ts` | User report CRUD + submit + return-to-draft |
| `reports/reports.service.ts` | All business logic + state machine transitions |
| `reports/reports.repository.ts` | DB queries for reports (with totalAmount sum) |
| `reports/dto/create-report.dto.ts` | title (required), description (optional) |
| `reports/dto/update-report.dto.ts` | title?, description? — partial |
| `reports/dto/filter-reports.dto.ts` | status? filter |
| `reports/entities/report.entity.ts` | TypeORM entity: id, userId, title, description, status |
| `items/items.module.ts` | Items feature module |
| `items/items.controller.ts` | CRUD on `/reports/:id/items` |
| `items/items.service.ts` | Item CRUD with DRAFT-only guard |
| `items/items.repository.ts` | DB queries for expense items |
| `items/dto/create-item.dto.ts` | amount (>0), currency, category (enum), merchantName, transactionDate |
| `items/dto/update-item.dto.ts` | All fields optional — partial of create |
| `items/entities/expense-item.entity.ts` | TypeORM entity with category enum |
| `admin/admin.module.ts` | Admin feature module |
| `admin/admin.controller.ts` | `GET /admin/reports`, `GET /admin/reports/:id`, approve, reject |
| `ai/ai.module.ts` | AI feature module |
| `ai/ai.controller.ts` | `POST /ai/suggest-category` |
| `ai/ai.service.ts` | Sanitize input, call Anthropic API, return category enum value |
| `common/enums/report-status.enum.ts` | `DRAFT \| SUBMITTED \| APPROVED \| REJECTED` |
| `common/enums/expense-category.enum.ts` | `TRAVEL \| MEALS \| ACCOMMODATION \| TRANSPORTATION \| OFFICE_SUPPLIES \| ENTERTAINMENT \| UTILITIES \| OTHER` |
| `common/enums/user-role.enum.ts` | `user \| admin` |
| `migrations/` | TypeORM migration files (auto-generated) |
| `seeds/seed.ts` | Creates admin@gradion.com / admin1234 (idempotent) |

### Backend (`backend/test/`)

| File | Responsibility |
|---|---|
| `unit/reports.service.spec.ts` | State machine unit tests — all valid + invalid transitions |
| `integration/app.e2e-spec.ts` | Happy path + rejection path integration tests |

### Frontend (`frontend/src/`)

| File | Responsibility |
|---|---|
| `main.tsx` | React app entry point |
| `router/index.tsx` | React Router config with protected routes |
| `shared/api/client.ts` | Axios instance with JWT interceptor + 401 redirect |
| `shared/hooks/useDebounce.ts` | Generic debounce hook |
| `shared/components/ErrorBoundary.tsx` | Catches render errors, shows fallback |
| `shared/components/ProtectedRoute.tsx` | Redirects to /login if no JWT |
| `shared/components/StatusBadge.tsx` | Color-coded status pill |
| `shared/components/LoadingSpinner.tsx` | Spinner for async operations |
| `domains/auth/api/auth.ts` | signup(), login() API calls |
| `domains/auth/hooks/useLogin.ts` | Login state + mutation |
| `domains/auth/hooks/useSignup.ts` | Signup state + mutation |
| `domains/auth/components/LoginForm.tsx` | Email + password form |
| `domains/auth/components/SignupForm.tsx` | Registration form |
| `domains/auth/pages/LoginPage.tsx` | Login page |
| `domains/auth/pages/SignupPage.tsx` | Signup page |
| `domains/reports/api/reports.ts` | CRUD + submit + return-to-draft API calls |
| `domains/reports/hooks/useReports.ts` | Fetch + filter reports list |
| `domains/reports/hooks/useReport.ts` | Fetch single report |
| `domains/reports/components/ReportCard.tsx` | Status badge, title, totalAmount |
| `domains/reports/components/ReportForm.tsx` | Create/edit report form |
| `domains/reports/pages/ReportsPage.tsx` | List page with filter + new button |
| `domains/reports/pages/ReportDetailPage.tsx` | Detail page — editable in DRAFT, read-only otherwise |
| `domains/items/api/items.ts` | CRUD item API calls |
| `domains/items/hooks/useItems.ts` | Item mutations |
| `domains/items/components/ItemForm.tsx` | Add/edit item with AI suggest button |
| `domains/items/components/ItemList.tsx` | List of items with edit/delete |
| `domains/ai/api/ai.ts` | suggestCategory() API call |
| `domains/ai/hooks/useSuggestCategory.ts` | Debounced category suggestion |
| `domains/admin/api/admin.ts` | Admin report list + approve/reject API calls |
| `domains/admin/hooks/useAdminReports.ts` | Fetch all reports with filter |
| `domains/admin/pages/AdminReportsPage.tsx` | Admin list page |
| `domains/admin/pages/AdminReportDetailPage.tsx` | Admin detail with approve/reject buttons |

### Root

| File | Responsibility |
|---|---|
| `docker-compose.yml` | db + backend + frontend services |
| `.env.example` | Template with all required env vars |
| `README.md` | Setup instructions + AI usage note |
| `DECISIONS.md` | Stack choices, trade-offs, one-more-day section |
| `CLAUDE.md` | Claude Code project context file (AI artifact) |

---

## Task 1: Repo & Root Setup

**Files:**
- Create: `README.md`
- Create: `DECISIONS.md`
- Create: `CLAUDE.md`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `docker-compose.yml`

- [ ] **Step 1: Initialize git repo in working directory and connect to GitHub**

```bash
cd D:/Dev/Projects/gradion-home-assignment
git init
git remote add origin https://github.com/Quang-Tuyen-DINH/gradion-assessment.git
git checkout -b main
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
dist/
.env
*.local
.DS_Store
coverage/
```

- [ ] **Step 3: Create `.env.example`**

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/gradion
JWT_SECRET=changeme_replace_with_32_char_min_secret
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your_key_here
PORT=3000
FRONTEND_URL=http://localhost:5173
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: gradion
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - '3000:3000'
    env_file: .env
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/gradion
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - '5173:80'
    depends_on:
      - backend

volumes:
  pgdata:
```

- [ ] **Step 5: Create `CLAUDE.md`** (AI artifact — committed to repo)

```markdown
# Gradion Assessment — Claude Code Project Context

## Project
Full-stack Expense Report Management System. Monorepo: /backend (NestJS) + /frontend (React).

## Key Rules
- State machine transitions live ONLY in ReportsService — never controllers
- All JSON responses use camelCase
- Invalid transitions throw UnprocessableEntityException (422)
- Category is an enum: TRAVEL | MEALS | ACCOMMODATION | TRANSPORTATION | OFFICE_SUPPLIES | ENTERTAINMENT | UTILITIES | OTHER
- TypeORM uses formal migration files (never synchronize: true)

## Spec
docs/superpowers/specs/2026-03-22-expense-report-api-design.md
```

- [ ] **Step 6: Create stub `README.md` and `DECISIONS.md`** (will be fleshed out in Task 16)

```bash
echo "# Gradion Assessment" > README.md
echo "# Decisions" > DECISIONS.md
```

- [ ] **Step 7: Commit**

```bash
git add .gitignore .env.example docker-compose.yml CLAUDE.md README.md DECISIONS.md
git commit -m "chore: monorepo root setup with docker-compose and AI artifacts"
```

---

## Task 2: Backend — NestJS Scaffold

**Files:**
- Create: `backend/` (full NestJS project)
- Create: `backend/src/common/enums/report-status.enum.ts`
- Create: `backend/src/common/enums/expense-category.enum.ts`
- Create: `backend/src/common/enums/user-role.enum.ts`

- [ ] **Step 1: Scaffold NestJS project**

```bash
cd backend
npx @nestjs/cli new . --package-manager npm --skip-git --language typescript
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @nestjs/typeorm typeorm pg @nestjs/passport @nestjs/jwt @nestjs/config @nestjs/mapped-types passport passport-jwt bcrypt class-validator class-transformer @anthropic-ai/sdk
npm install -D @types/passport-jwt @types/bcrypt @types/supertest supertest ts-node
```

- [ ] **Step 3: Create shared enums**

`src/common/enums/report-status.enum.ts`:
```typescript
export enum ReportStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
```

`src/common/enums/expense-category.enum.ts`:
```typescript
export enum ExpenseCategory {
  TRAVEL = 'TRAVEL',
  MEALS = 'MEALS',
  ACCOMMODATION = 'ACCOMMODATION',
  TRANSPORTATION = 'TRANSPORTATION',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  ENTERTAINMENT = 'ENTERTAINMENT',
  UTILITIES = 'UTILITIES',
  OTHER = 'OTHER',
}
```

`src/common/enums/user-role.enum.ts`:
```typescript
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
```

- [ ] **Step 4: Configure `main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors({ origin: process.env.FRONTEND_URL });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

- [ ] **Step 5: Configure stub `app.module.ts`** (feature modules added in Task 8 Step 7)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      migrationsRun: true,
      synchronize: false,
    }),
    // Feature modules imported in Task 8 Step 7
  ],
})
export class AppModule {}
```

- [ ] **Step 6: Create `backend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
CMD ["node", "dist/main"]
```

- [ ] **Step 7: Commit**

```bash
git add backend/
git commit -m "feat: scaffold NestJS backend with TypeORM config and shared enums"
```

---

## Task 3: Backend — Database Entities & Migration

**Files:**
- Create: `backend/src/users/entities/user.entity.ts`
- Create: `backend/src/reports/entities/report.entity.ts`
- Create: `backend/src/items/entities/expense-item.entity.ts`
- Create: `backend/migrations/<timestamp>-InitSchema.ts`

- [ ] **Step 1: Create `user.entity.ts`**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

- [ ] **Step 2: Create `report.entity.ts`**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ExpenseItem } from '../../items/entities/expense-item.entity';
import { ReportStatus } from '../../common/enums/report-status.enum';

@Entity('expense_reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  status: ReportStatus;

  @OneToMany(() => ExpenseItem, (item) => item.report, { cascade: true })
  items: ExpenseItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 3: Create `expense-item.entity.ts`**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Report } from '../../reports/entities/report.entity';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';

@Entity('expense_items')
export class ExpenseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id' })
  reportId: string;

  @ManyToOne(() => Report, (report) => report.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: ExpenseCategory, nullable: true })
  category: ExpenseCategory | null;

  @Column({ name: 'merchant_name', length: 255, nullable: true })
  merchantName: string | null;

  @Column({ name: 'transaction_date', type: 'date', nullable: true })
  transactionDate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 4: Add TypeORM CLI script to `package.json`, then generate migration**

Add to `backend/package.json` scripts:
```json
"typeorm": "typeorm-ts-node-commonjs"
```

Then generate:
```bash
cd backend
npm run typeorm -- migration:generate migrations/InitSchema -d src/data-source.ts
```

> Create `src/data-source.ts` for CLI use:
```typescript
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/*.ts'],
});
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/users/entities/ backend/src/reports/entities/ backend/src/items/entities/ backend/migrations/ backend/src/data-source.ts
git commit -m "feat: add TypeORM entities and initial schema migration"
```

---

## Task 4: Backend — Auth Module

**Files:**
- Create: `backend/src/auth/auth.module.ts`
- Create: `backend/src/auth/auth.controller.ts`
- Create: `backend/src/auth/auth.service.ts`
- Create: `backend/src/auth/dto/signup.dto.ts`
- Create: `backend/src/auth/dto/login.dto.ts`
- Create: `backend/src/auth/strategies/jwt.strategy.ts`
- Create: `backend/src/auth/guards/jwt-auth.guard.ts`
- Create: `backend/src/auth/guards/roles.guard.ts`
- Create: `backend/src/auth/decorators/roles.decorator.ts`
- Create: `backend/src/users/users.module.ts`
- Create: `backend/src/users/users.service.ts`

- [ ] **Step 1: Write failing test for signup**

`backend/test/unit/auth.service.spec.ts`:
```typescript
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    usersService = { findByEmail: jest.fn(), create: jest.fn() } as any;
    jwtService = { sign: jest.fn().mockReturnValue('token') } as any;
    service = new AuthService(usersService, jwtService);
  });

  it('should hash password on signup', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({ id: '1', email: 'a@b.com', role: 'user' } as any);
    await service.signup({ email: 'a@b.com', password: 'password123' });
    expect(usersService.create).toHaveBeenCalledWith(
      'a@b.com',
      expect.stringMatching(/^\$2b\$/), // bcrypt hash
      'user',
    );
  });

  it('should throw ConflictException if email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: '1' } as any);
    await expect(service.signup({ email: 'a@b.com', password: 'password123' })).rejects.toThrow();
  });

  it('should return access_token on valid login', async () => {
    const hash = await bcrypt.hash('password123', 10);
    usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', passwordHash: hash, role: 'user' } as any);
    const result = await service.login({ email: 'a@b.com', password: 'password123' });
    expect(result.accessToken).toBe('token');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd backend && npx jest test/unit/auth.service.spec.ts --no-coverage
```
Expected: `Cannot find module`

- [ ] **Step 3: Implement `users.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id });
  }

  create(email: string, passwordHash: string, role: UserRole = UserRole.USER): Promise<User> {
    const user = this.repo.create({ email, passwordHash, role });
    return this.repo.save(user);
  }
}
```

- [ ] **Step 4: Implement `auth.service.ts`**

```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async signup(dto: SignupDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create(dto.email, passwordHash);
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const accessToken = this.jwt.sign({ sub: user.id, role: user.role });
    return { accessToken };
  }
}
```

- [ ] **Step 5: Implement DTOs, strategy, guards, decorators**

> Also create `auth/decorators/current-user.decorator.ts` here (used by all controllers):
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
export const CurrentUser = createParamDecorator((key: string, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest().user;
  return key ? user[key] : user;
});
```

`auth/dto/signup.dto.ts`:
```typescript
import { IsEmail, MinLength } from 'class-validator';
export class SignupDto {
  @IsEmail() email: string;
  @MinLength(8) password: string;
}
```

`auth/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
```

`auth/strategies/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  validate(payload: { sub: string; role: string }) {
    return { id: payload.sub, role: payload.role };
  }
}
```

`auth/guards/jwt-auth.guard.ts`:
```typescript
import { AuthGuard } from '@nestjs/passport';
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

`auth/guards/roles.guard.ts`:
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required) return true;
    const { user } = ctx.switchToHttp().getRequest();
    return required.includes(user.role);
  }
}
```

`auth/decorators/roles.decorator.ts`:
```typescript
import { SetMetadata } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 6: Implement `auth.controller.ts` and wire `auth.module.ts` + `users.module.ts`**

`users/users.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

`auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
```

`auth/auth.controller.ts`:
```typescript
import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) { return this.auth.signup(dto); }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }
}
```

- [ ] **Step 7: Run auth tests — expect PASS**

```bash
cd backend && npx jest test/unit/auth.service.spec.ts --no-coverage
```
Expected: 3 tests pass

- [ ] **Step 8: Commit**

```bash
git add backend/src/auth/ backend/src/users/
git commit -m "feat: auth module — signup, login, JWT strategy, RBAC guards"
```

---

## Task 5: Backend — Reports Service & State Machine

**Files:**
- Create: `backend/src/reports/reports.service.ts`
- Create: `backend/src/reports/reports.repository.ts`
- Create: `backend/src/reports/dto/create-report.dto.ts`
- Create: `backend/src/reports/dto/update-report.dto.ts`
- Create: `backend/src/reports/dto/filter-reports.dto.ts`
- Create: `backend/test/unit/reports.service.spec.ts`

- [ ] **Step 1: Write failing state machine unit tests**

`backend/test/unit/reports.service.spec.ts`:
```typescript
import { ReportsService } from '../../src/reports/reports.service';
import { ReportStatus } from '../../src/common/enums/report-status.enum';
import { UnprocessableEntityException, ForbiddenException, NotFoundException } from '@nestjs/common';

const mockRepo = {
  findOneWithItems: jest.fn(),
  findAllByUser: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

describe('ReportsService — state machine', () => {
  let service: ReportsService;
  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(mockRepo as any);
  });

  // --- Valid transitions ---
  it('DRAFT → SUBMITTED on submit()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.DRAFT, items: [] });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.submit('1', userId);
    expect(result.status).toBe(ReportStatus.SUBMITTED);
  });

  it('SUBMITTED → APPROVED on approve()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.SUBMITTED });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.approve('1');
    expect(result.status).toBe(ReportStatus.APPROVED);
  });

  it('SUBMITTED → REJECTED on reject()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.SUBMITTED });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.reject('1');
    expect(result.status).toBe(ReportStatus.REJECTED);
  });

  it('REJECTED → DRAFT on returnToDraft()', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.REJECTED });
    mockRepo.save.mockImplementation((r) => Promise.resolve(r));
    const result = await service.returnToDraft('1', userId);
    expect(result.status).toBe(ReportStatus.DRAFT);
  });

  // --- Invalid transitions ---
  it('throws 422 when submitting non-DRAFT report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.APPROVED });
    await expect(service.submit('1', userId)).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 422 when approving non-SUBMITTED report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.DRAFT });
    await expect(service.approve('1')).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 422 when rejecting non-SUBMITTED report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.APPROVED });
    await expect(service.reject('1')).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 422 when returnToDraft on non-REJECTED report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.SUBMITTED });
    await expect(service.returnToDraft('1', userId)).rejects.toThrow(UnprocessableEntityException);
  });

  // --- Edit/delete guards ---
  it('throws 422 when editing report not in DRAFT', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.SUBMITTED });
    await expect(service.update('1', userId, { title: 'new' })).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 422 when deleting report not in DRAFT', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId, status: ReportStatus.APPROVED });
    await expect(service.remove('1', userId)).rejects.toThrow(UnprocessableEntityException);
  });

  // --- Ownership ---
  it('throws 403 when user accesses another user report', async () => {
    mockRepo.findOneWithItems.mockResolvedValue({ id: '1', userId: 'other-user', status: ReportStatus.DRAFT });
    await expect(service.submit('1', userId)).rejects.toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd backend && npx jest test/unit/reports.service.spec.ts --no-coverage
```
Expected: `Cannot find module`

- [ ] **Step 3: Implement `reports.repository.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportStatus } from '../common/enums/report-status.enum';

@Injectable()
export class ReportsRepository {
  constructor(@InjectRepository(Report) private repo: Repository<Report>) {}

  async findOneWithItems(id: string): Promise<Report | null> {
    return this.repo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.items', 'items')
      .where('r.id = :id', { id })
      .getOne();
  }

  findAllByUser(userId: string, status?: ReportStatus): Promise<Report[]> {
    const qb = this.repo.createQueryBuilder('r').where('r.user_id = :userId', { userId });
    if (status) qb.andWhere('r.status = :status', { status });
    return qb.getMany();
  }

  findAll(status?: ReportStatus): Promise<Report[]> {
    const qb = this.repo.createQueryBuilder('r').leftJoinAndSelect('r.items', 'items');
    if (status) qb.where('r.status = :status', { status });
    return qb.getMany();
  }

  create(data: Partial<Report>): Promise<Report> {
    const report = this.repo.create(data);
    return this.repo.save(report);
  }

  save(report: Report): Promise<Report> {
    return this.repo.save(report);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
```

- [ ] **Step 4: Implement `reports.service.ts`**

```typescript
import { Injectable, NotFoundException, ForbiddenException, UnprocessableEntityException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportStatus } from '../common/enums/report-status.enum';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { Report } from './entities/report.entity';

@Injectable()
export class ReportsService {
  constructor(private repo: ReportsRepository) {}

  private async findAndCheckOwner(id: string, userId: string): Promise<Report> {
    const report = await this.repo.findOneWithItems(id);
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    if (report.userId !== userId) throw new ForbiddenException('Access denied');
    return report;
  }

  private async findOrFail(id: string): Promise<Report> {
    const report = await this.repo.findOneWithItems(id);
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    return report;
  }

  private computeTotalAmount(report: Report): number {
    return (report.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  }

  private toResponse(report: Report) {
    return { ...report, totalAmount: this.computeTotalAmount(report) };
  }

  async findAll(userId: string, status?: ReportStatus) {
    const data = await this.repo.findAllByUser(userId, status);
    return { data: data.map((r) => this.toResponse(r)), total: data.length };
  }

  async findAllAdmin(status?: ReportStatus) {
    const data = await this.repo.findAll(status);
    return { data: data.map((r) => this.toResponse(r)), total: data.length };
  }

  async findOne(id: string, userId: string) {
    const report = await this.findAndCheckOwner(id, userId);
    return this.toResponse(report);
  }

  async findOneAdmin(id: string) {
    const report = await this.findOrFail(id);
    return this.toResponse(report);
  }

  async create(userId: string, dto: CreateReportDto) {
    const report = await this.repo.create({ userId, ...dto, status: ReportStatus.DRAFT });
    return this.toResponse(report);
  }

  async update(id: string, userId: string, dto: UpdateReportDto) {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot edit a report with status ${report.status}`);
    }
    Object.assign(report, dto);
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot delete a report with status ${report.status}`);
    }
    await this.repo.delete(id);
  }

  async submit(id: string, userId: string) {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot submit a report with status ${report.status}`);
    }
    report.status = ReportStatus.SUBMITTED;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async returnToDraft(id: string, userId: string) {
    const report = await this.findAndCheckOwner(id, userId);
    if (report.status !== ReportStatus.REJECTED) {
      throw new UnprocessableEntityException(`Cannot return to draft a report with status ${report.status}`);
    }
    report.status = ReportStatus.DRAFT;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async approve(id: string) {
    const report = await this.findOrFail(id);
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new UnprocessableEntityException(`Cannot approve a report with status ${report.status}`);
    }
    report.status = ReportStatus.APPROVED;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }

  async reject(id: string) {
    const report = await this.findOrFail(id);
    if (report.status !== ReportStatus.SUBMITTED) {
      throw new UnprocessableEntityException(`Cannot reject a report with status ${report.status}`);
    }
    report.status = ReportStatus.REJECTED;
    const saved = await this.repo.save(report);
    return this.toResponse(saved);
  }
}
```

- [ ] **Step 5: Run state machine tests — expect PASS**

```bash
cd backend && npx jest test/unit/reports.service.spec.ts --no-coverage
```
Expected: 11 tests pass

- [ ] **Step 6: Commit**

```bash
git add backend/src/reports/ backend/test/unit/reports.service.spec.ts
git commit -m "feat: reports service with state machine — all transitions tested"
```

---

## Task 6: Backend — Reports Controller

**Files:**
- Create: `backend/src/reports/reports.controller.ts`
- Create: `backend/src/reports/reports.module.ts`

- [ ] **Step 1: Implement `reports.controller.ts`**

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { FilterReportsDto } from './dto/filter-reports.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ReportStatus } from '../common/enums/report-status.enum';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() q: FilterReportsDto) {
    return this.service.findAll(userId, q.status);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateReportDto) {
    return this.service.create(userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateReportDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.remove(id, userId);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.submit(id, userId);
  }

  @Post(':id/return-to-draft')
  returnToDraft(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.returnToDraft(id, userId);
  }
}
```

- [ ] **Step 2: Implement DTOs**

`dto/create-report.dto.ts`:
```typescript
import { IsString, IsOptional, MaxLength } from 'class-validator';
export class CreateReportDto {
  @IsString() @MaxLength(255) title: string;
  @IsOptional() @IsString() description?: string;
}
```

`dto/update-report.dto.ts`:
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateReportDto } from './create-report.dto';
export class UpdateReportDto extends PartialType(CreateReportDto) {}
```

`dto/filter-reports.dto.ts`:
```typescript
import { IsOptional, IsEnum } from 'class-validator';
import { ReportStatus } from '../../common/enums/report-status.enum';
export class FilterReportsDto {
  @IsOptional() @IsEnum(ReportStatus) status?: ReportStatus;
}
```

- [ ] **Step 3: Wire `reports.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/reports/
git commit -m "feat: reports controller and module wiring"
```

---

## Task 7: Backend — Items Module

**Files:**
- Create: `backend/src/items/items.service.ts`
- Create: `backend/src/items/items.repository.ts`
- Create: `backend/src/items/items.controller.ts`
- Create: `backend/src/items/items.module.ts`
- Create: `backend/src/items/dto/create-item.dto.ts`
- Create: `backend/src/items/dto/update-item.dto.ts`
- Create: `backend/test/unit/items.service.spec.ts`

- [ ] **Step 1: Write failing test — DRAFT-only guard**

`backend/test/unit/items.service.spec.ts`:
```typescript
import { ItemsService } from '../../src/items/items.service';
import { ReportsService } from '../../src/reports/reports.service';
import { ReportStatus } from '../../src/common/enums/report-status.enum';
import { UnprocessableEntityException } from '@nestjs/common';

describe('ItemsService', () => {
  let service: ItemsService;
  let reportsService: jest.Mocked<ReportsService>;
  let itemsRepo: any;

  beforeEach(() => {
    reportsService = { findAndCheckOwnerRaw: jest.fn() } as any;
    itemsRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), delete: jest.fn() };
    service = new ItemsService(itemsRepo, reportsService);
  });

  it('throws 422 when adding item to non-DRAFT report', async () => {
    reportsService.findAndCheckOwnerRaw.mockResolvedValue({ status: ReportStatus.SUBMITTED });
    await expect(service.create('r1', 'u1', { amount: 10 } as any)).rejects.toThrow(UnprocessableEntityException);
  });

  it('allows adding item to DRAFT report', async () => {
    reportsService.findAndCheckOwnerRaw.mockResolvedValue({ id: 'r1', status: ReportStatus.DRAFT });
    itemsRepo.create.mockReturnValue({ id: 'i1', reportId: 'r1', amount: 10 });
    itemsRepo.save.mockResolvedValue({ id: 'i1', reportId: 'r1', amount: 10 });
    const result = await service.create('r1', 'u1', { amount: 10 } as any);
    expect(result.id).toBe('i1');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd backend && npx jest test/unit/items.service.spec.ts --no-coverage
```

- [ ] **Step 3: Implement `items.service.ts`**

```typescript
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ItemsRepository } from './items.repository';
import { ReportsService } from '../reports/reports.service';
import { ReportStatus } from '../common/enums/report-status.enum';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private repo: ItemsRepository, private reports: ReportsService) {}

  private async guardDraft(reportId: string, userId: string) {
    const report = await this.reports.findAndCheckOwnerRaw(reportId, userId);
    if (report.status !== ReportStatus.DRAFT) {
      throw new UnprocessableEntityException(`Cannot modify items on a report with status ${report.status}`);
    }
    return report;
  }

  async create(reportId: string, userId: string, dto: CreateItemDto) {
    await this.guardDraft(reportId, userId);
    return this.repo.create({ reportId, ...dto });
  }

  async update(reportId: string, itemId: string, userId: string, dto: UpdateItemDto) {
    await this.guardDraft(reportId, userId);
    const item = await this.repo.findOne(itemId, reportId);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(reportId: string, itemId: string, userId: string): Promise<void> {
    await this.guardDraft(reportId, userId);
    await this.repo.delete(itemId, reportId);
  }
}
```

> Add `findAndCheckOwnerRaw` to `ReportsService` (returns raw Report entity without mapping):
```typescript
async findAndCheckOwnerRaw(id: string, userId: string): Promise<Report> {
  return this.findAndCheckOwner(id, userId);
}
```

- [ ] **Step 4: Implement `items.repository.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExpenseItem } from './entities/expense-item.entity';

@Injectable()
export class ItemsRepository {
  constructor(@InjectRepository(ExpenseItem) private repo: Repository<ExpenseItem>) {}

  async create(data: Partial<ExpenseItem>): Promise<ExpenseItem> {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async findOne(id: string, reportId: string): Promise<ExpenseItem> {
    const item = await this.repo.findOneBy({ id, reportId });
    if (!item) throw new NotFoundException(`Item ${id} not found`);
    return item;
  }

  save(item: ExpenseItem): Promise<ExpenseItem> {
    return this.repo.save(item);
  }

  async delete(id: string, reportId: string): Promise<void> {
    await this.repo.delete({ id, reportId });
  }
}
```

- [ ] **Step 5: Implement DTOs and controller**

`dto/create-item.dto.ts`:
```typescript
import { IsNumber, Min, IsOptional, IsString, MaxLength, IsEnum, IsDateString } from 'class-validator';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';

export class CreateItemDto {
  @IsNumber() @Min(0.01) amount: number;
  @IsOptional() @IsString() @MaxLength(3) currency?: string;
  @IsOptional() @IsEnum(ExpenseCategory) category?: ExpenseCategory;
  @IsOptional() @IsString() @MaxLength(255) merchantName?: string;
  @IsOptional() @IsDateString() transactionDate?: string;
}
```

`dto/update-item.dto.ts`:
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateItemDto } from './create-item.dto';
export class UpdateItemDto extends PartialType(CreateItemDto) {}
```

`items/items.controller.ts`:
```typescript
import { Controller, Post, Patch, Delete, Body, Param, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports/:reportId/items')
export class ItemsController {
  constructor(private service: ItemsService) {}

  @Post()
  create(@Param('reportId') reportId: string, @CurrentUser('id') userId: string, @Body() dto: CreateItemDto) {
    return this.service.create(reportId, userId, dto);
  }

  @Patch(':itemId')
  update(@Param('reportId') rId: string, @Param('itemId') iId: string, @CurrentUser('id') userId: string, @Body() dto: UpdateItemDto) {
    return this.service.update(rId, iId, userId, dto);
  }

  @Delete(':itemId')
  @HttpCode(204)
  remove(@Param('reportId') rId: string, @Param('itemId') iId: string, @CurrentUser('id') userId: string) {
    return this.service.remove(rId, iId, userId);
  }
}
```

- [ ] **Step 6: Create `items/items.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseItem } from './entities/expense-item.entity';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { ItemsRepository } from './items.repository';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseItem]), ReportsModule],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRepository],
})
export class ItemsModule {}
```

> Note: `ReportsModule` must be imported here because `ItemsService` depends on `ReportsService`. `ReportsModule` already exports `ReportsService` (Task 6 Step 3).

- [ ] **Step 7: Run items tests — expect PASS**

```bash
cd backend && npx jest test/unit/items.service.spec.ts --no-coverage
```
Expected: 2 tests pass

- [ ] **Step 8: Commit**

```bash
git add backend/src/items/ backend/test/unit/items.service.spec.ts
git commit -m "feat: items module with DRAFT-only guard"
```

---

## Task 8: Backend — Admin Module & AI Module

**Files:**
- Create: `backend/src/admin/admin.module.ts`
- Create: `backend/src/admin/admin.controller.ts`
- Create: `backend/src/ai/ai.module.ts`
- Create: `backend/src/ai/ai.controller.ts`
- Create: `backend/src/ai/ai.service.ts`
- Create: `backend/test/unit/ai.service.spec.ts`

- [ ] **Step 1: Implement `admin.controller.ts`**

```typescript
import { Controller, Get, Post, Param, Query, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from '../reports/reports.service';
import { FilterReportsDto } from '../reports/dto/filter-reports.dto';
import { UserRole } from '../common/enums/user-role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/reports')
export class AdminController {
  constructor(private reports: ReportsService) {}

  @Get()
  findAll(@Query() q: FilterReportsDto) { return this.reports.findAllAdmin(q.status); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.reports.findOneAdmin(id); }

  @Post(':id/approve')
  approve(@Param('id') id: string) { return this.reports.approve(id); }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { reason?: string }) {
    // reason is accepted per spec but not persisted (no DB column) — documented in DECISIONS.md
    return this.reports.reject(id);
  }
}
```

- [ ] **Step 2: Write failing AI service test**

`backend/test/unit/ai.service.spec.ts`:
```typescript
import { AiService } from '../../src/ai/ai.service';

const mockAnthropicCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockAnthropicCreate },
  })),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(() => {
    service = new AiService();
  });

  it('returns a valid category enum value', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'MEALS' }],
    });
    const result = await service.suggestCategory('McDonalds');
    expect(result.category).toBe('MEALS');
  });

  it('returns OTHER for unrecognized category', async () => {
    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'INVALID_CATEGORY' }],
    });
    const result = await service.suggestCategory('Unknown Corp');
    expect(result.category).toBe('OTHER');
  });

  it('sanitizes merchant name — truncates to 200 chars', async () => {
    mockAnthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: 'TRAVEL' }] });
    const longName = 'A'.repeat(300);
    await service.suggestCategory(longName);
    const calledWith = mockAnthropicCreate.mock.calls[0][0].messages[0].content;
    expect(calledWith.length).toBeLessThanOrEqual(300); // prompt includes surrounding text
    expect(calledWith).not.toContain('A'.repeat(201));
  });
});
```

- [ ] **Step 3: Run — expect FAIL**

```bash
cd backend && npx jest test/unit/ai.service.spec.ts --no-coverage
```

- [ ] **Step 4: Implement `ai.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ExpenseCategory } from '../common/enums/expense-category.enum';

const VALID_CATEGORIES = Object.values(ExpenseCategory);

@Injectable()
export class AiService {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  private sanitize(input: string): string {
    return input.replace(/[^\x20-\x7E]/g, '').slice(0, 200);
  }

  async suggestCategory(merchantName: string): Promise<{ category: string }> {
    const safe = this.sanitize(merchantName);
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Claude Haiku 4.5 — fast and cheap for single-word classification
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `Classify the expense category for merchant: "${safe}". Reply with exactly one word from: ${VALID_CATEGORIES.join(', ')}. No explanation.`,
      }],
    });
    const raw = (response.content[0] as any).text?.trim().toUpperCase();
    const category = VALID_CATEGORIES.includes(raw as ExpenseCategory) ? raw : ExpenseCategory.OTHER;
    return { category };
  }
}
```

`ai/ai.controller.ts`:
```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { IsString } from 'class-validator';

class SuggestCategoryDto {
  @IsString() merchantName: string;
}

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  @Post('suggest-category')
  suggest(@Body() dto: SuggestCategoryDto) {
    return this.ai.suggestCategory(dto.merchantName);
  }
}
```

- [ ] **Step 5: Run AI tests — expect PASS**

```bash
cd backend && npx jest test/unit/ai.service.spec.ts --no-coverage
```
Expected: 3 tests pass

- [ ] **Step 6: Create `admin/admin.module.ts` and `ai/ai.module.ts`**

`admin/admin.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ReportsModule],
  controllers: [AdminController],
})
export class AdminModule {}
```

`ai/ai.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
```

- [ ] **Step 7: Wire all feature modules into `app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { ItemsModule } from './items/items.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      migrationsRun: true,
      synchronize: false,
    }),
    AuthModule,
    UsersModule,
    ReportsModule,
    ItemsModule,
    AdminModule,
    AiModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Commit**

```bash
git add backend/src/admin/ backend/src/ai/ backend/src/app.module.ts backend/test/unit/ai.service.spec.ts
git commit -m "feat: admin and AI modules, wire all feature modules into AppModule"
```

---

## Task 9: Backend — Integration Tests & Seed

**Files:**
- Create: `backend/test/integration/app.e2e-spec.ts`
- Create: `backend/seeds/seed.ts`

- [ ] **Step 1: Write integration tests**

`backend/test/integration/app.e2e-spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Expense Report — E2E', () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let reportId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /auth/signup — creates user', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(201);
  });

  it('POST /auth/login — returns token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'test@test.com', password: 'password123' })
      .expect(200);
    userToken = res.body.accessToken;
    expect(userToken).toBeDefined();
  });

  it('POST /reports — creates DRAFT report', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Business Trip Q1' })
      .expect(201);
    reportId = res.body.id;
    expect(res.body.status).toBe('DRAFT');
    expect(res.body.totalAmount).toBe(0);
  });

  it('POST /reports/:id/items — adds item to DRAFT report', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${reportId}/items`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 150.00, category: 'TRAVEL', merchantName: 'Air France' })
      .expect(201);
  });

  it('GET /reports/:id — totalAmount reflects items', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/reports/${reportId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(Number(res.body.totalAmount)).toBe(150);
  });

  it('POST /reports/:id/submit — DRAFT → SUBMITTED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/reports/${reportId}/submit`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('POST /reports/:id/items — blocked when SUBMITTED (422)', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/reports/${reportId}/items`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ amount: 50, category: 'MEALS' })
      .expect(422);
  });

  // Admin happy path
  it('Admin login', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@gradion.com', password: 'admin1234' })
      .expect(200);
    adminToken = res.body.accessToken;
  });

  it('POST /admin/reports/:id/approve — SUBMITTED → APPROVED', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/admin/reports/${reportId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(res.body.status).toBe('APPROVED');
  });

  // Rejection path
  it('Full rejection path: DRAFT → SUBMITTED → REJECTED → DRAFT → SUBMITTED → APPROVED', async () => {
    // Create new report
    const r = await request(app.getHttpServer())
      .post('/api/v1/reports').set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Rejection test' }).expect(201);
    const rId = r.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${rId}/submit`).set('Authorization', `Bearer ${userToken}`).expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/admin/reports/${rId}/reject`).set('Authorization', `Bearer ${adminToken}`).expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${rId}/return-to-draft`).set('Authorization', `Bearer ${userToken}`)
      .expect(res => expect(res.body.status).toBe('DRAFT'));

    await request(app.getHttpServer())
      .post(`/api/v1/reports/${rId}/submit`).set('Authorization', `Bearer ${userToken}`).expect(201);

    const approved = await request(app.getHttpServer())
      .post(`/api/v1/admin/reports/${rId}/approve`).set('Authorization', `Bearer ${adminToken}`).expect(201);
    expect(approved.body.status).toBe('APPROVED');
  });
});
```

- [ ] **Step 2: Create seed script**

`backend/seeds/seed.ts`:
```typescript
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // Use compiled JS entities — works in both ts-node (dev) and compiled Docker image
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  });
  await ds.initialize();
  const repo = ds.getRepository('users');
  const existing = await repo.findOneBy({ email: 'admin@gradion.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin1234', 10);
    await repo.save({ email: 'admin@gradion.com', passwordHash, role: 'admin' });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists — skipping');
  }
  await ds.destroy();
}

seed().catch(console.error);
```

Add to `package.json` scripts:
```json
"seed": "node dist/seeds/seed.js",
"seed:dev": "ts-node seeds/seed.ts"
```

> The seed compiles to `dist/seeds/seed.js` as part of `npm run build`. The Docker container runs `npm run seed` (compiled JS). Local dev uses `npm run seed:dev` (ts-node). The Dockerfile already copies `dist/` — no source files needed in the production image.

- [ ] **Step 3: Run integration tests (requires running DB)**

```bash
cd backend
docker-compose up db -d
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gradion npm run seed
npx jest test/integration/app.e2e-spec.ts --no-coverage --runInBand
```
Expected: all integration tests pass

- [ ] **Step 4: Commit**

```bash
git add backend/test/integration/ backend/seeds/
git commit -m "test: integration tests for happy path and rejection flow + seed script"
```

---

## Task 10: Frontend — Scaffold & Shared

**Files:**
- Create: `frontend/` (Vite + React project)
- Create: `frontend/src/shared/api/client.ts`
- Create: `frontend/src/shared/hooks/useDebounce.ts`
- Create: `frontend/src/shared/components/ErrorBoundary.tsx`
- Create: `frontend/src/shared/components/ProtectedRoute.tsx`
- Create: `frontend/src/shared/components/StatusBadge.tsx`
- Create: `frontend/src/shared/components/LoadingSpinner.tsx`

- [ ] **Step 1: Scaffold Vite + React + TypeScript**

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install axios react-router-dom
npm install -D @types/react @types/react-dom
```

- [ ] **Step 2: Create `shared/api/client.ts`**

```typescript
import axios from 'axios';

const client = axios.create({ baseURL: '/api/v1' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default client;
```

- [ ] **Step 3: Create `shared/hooks/useDebounce.ts`**

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

- [ ] **Step 4: Create shared components**

`ErrorBoundary.tsx`:
```typescript
import { Component, ReactNode } from 'react';
interface State { hasError: boolean }
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div>Something went wrong. Please refresh.</div>;
    return this.props.children;
  }
}
```

`ProtectedRoute.tsx`:
```typescript
import { Navigate } from 'react-router-dom';
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}
```

`StatusBadge.tsx`:
```typescript
const colors: Record<string, string> = {
  DRAFT: '#9ca3af', SUBMITTED: '#3b82f6', APPROVED: '#22c55e', REJECTED: '#ef4444',
};
export function StatusBadge({ status }: { status: string }) {
  return <span style={{ background: colors[status] ?? '#9ca3af', padding: '2px 8px', borderRadius: 4, color: '#fff', fontSize: 12 }}>{status}</span>;
}
```

`LoadingSpinner.tsx`:
```typescript
export function LoadingSpinner() {
  return <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>;
}
```

- [ ] **Step 5: Create `frontend/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx.conf`:
```nginx
server {
  listen 80;
  location / {
    root /usr/share/nginx/html;
    try_files $uri /index.html;
  }
  location /api/ {
    proxy_pass http://backend:3000;
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffold with shared components, axios client, useDebounce"
```

---

## Task 11: Frontend — Auth Domain

**Files:**
- Create: `frontend/src/domains/auth/api/auth.ts`
- Create: `frontend/src/domains/auth/hooks/useLogin.ts`
- Create: `frontend/src/domains/auth/hooks/useSignup.ts`
- Create: `frontend/src/domains/auth/components/LoginForm.tsx`
- Create: `frontend/src/domains/auth/components/SignupForm.tsx`
- Create: `frontend/src/domains/auth/pages/LoginPage.tsx`
- Create: `frontend/src/domains/auth/pages/SignupPage.tsx`

- [ ] **Step 1: Create `auth/api/auth.ts`**

```typescript
import client from '../../../shared/api/client';
export const signup = (email: string, password: string) =>
  client.post('/auth/signup', { email, password }).then(r => r.data);
export const login = (email: string, password: string) =>
  client.post('/auth/login', { email, password }).then(r => r.data);
```

- [ ] **Step 2: Create hooks and page components**

`useLogin.ts`:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

export function useLogin() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.accessToken);
      navigate('/reports');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  return { submit, error, loading };
}
```

`LoginPage.tsx`:
```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { submit, error, loading } = useLogin();

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading && <LoadingSpinner />}
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }} />
      <button onClick={() => submit(email, password)} disabled={loading}>Login</button>
      <p><Link to="/signup">Don't have an account? Sign up</Link></p>
    </div>
  );
}
```

> Implement `SignupPage.tsx` and `useSignup.ts` following same pattern.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domains/auth/
git commit -m "feat: auth domain — login and signup pages"
```

---

## Task 12: Frontend — Reports & Items Domains

**Files:**
- Create: `frontend/src/domains/reports/` (full domain)
- Create: `frontend/src/domains/items/` (full domain)
- Create: `frontend/src/domains/ai/` (hooks + api)

- [ ] **Step 1: Create `shared/types.ts` and `shared/constants.ts`**

`shared/types.ts`:
```typescript
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type ExpenseCategory = 'TRAVEL' | 'MEALS' | 'ACCOMMODATION' | 'TRANSPORTATION' | 'OFFICE_SUPPLIES' | 'ENTERTAINMENT' | 'UTILITIES' | 'OTHER';
```

`shared/constants.ts`:
```typescript
import { ExpenseCategory } from './types';
export const CATEGORIES: ExpenseCategory[] = [
  'TRAVEL', 'MEALS', 'ACCOMMODATION', 'TRANSPORTATION',
  'OFFICE_SUPPLIES', 'ENTERTAINMENT', 'UTILITIES', 'OTHER',
];
```

- [ ] **Step 2: Create reports API and hooks**

`reports/api/reports.ts`:
```typescript
import client from '../../../shared/api/client';
export const getReports = (status?: string) =>
  client.get('/reports', { params: status ? { status } : {} }).then(r => r.data);
export const getReport = (id: string) => client.get(`/reports/${id}`).then(r => r.data);
export const createReport = (title: string, description?: string) =>
  client.post('/reports', { title, description }).then(r => r.data);
export const updateReport = (id: string, data: object) =>
  client.patch(`/reports/${id}`, data).then(r => r.data);
export const deleteReport = (id: string) => client.delete(`/reports/${id}`);
export const submitReport = (id: string) => client.post(`/reports/${id}/submit`).then(r => r.data);
export const returnToDraft = (id: string) => client.post(`/reports/${id}/return-to-draft`).then(r => r.data);
```

`reports/hooks/useReports.ts`:
```typescript
import { useState, useEffect, useMemo } from 'react';
import { getReports } from '../api/reports';

export function useReports(statusFilter?: string) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getReports(statusFilter)
      .then(d => setReports(d.data))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const sorted = useMemo(() => [...reports].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ), [reports]);

  return { reports: sorted, loading, error, refetch: () => setLoading(true) };
}
```

- [ ] **Step 2: Create `ReportsPage.tsx`**

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { createReport } from '../api/reports';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ReportStatus } from '../../../shared/types';

export function ReportsPage() {
  const [filter, setFilter] = useState('');
  const { reports, loading, error } = useReports(filter || undefined);
  const navigate = useNavigate();

  const handleCreate = async () => {
    const title = prompt('Report title:');
    if (!title) return;
    const report = await createReport(title);
    navigate(`/reports/${report.id}`);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My Reports</h2>
        <button onClick={handleCreate}>+ New Report</button>
      </div>
      <select value={filter} onChange={e => setFilter(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="">All</option>
        {['DRAFT','SUBMITTED','APPROVED','REJECTED'].map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      {reports.map(r => (
        <div key={r.id} onClick={() => navigate(`/reports/${r.id}`)}
          style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 8, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{r.title}</strong>
            <StatusBadge status={r.status} />
          </div>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Total: ${Number(r.totalAmount).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `ReportDetailPage.tsx`** with inline item editing, submit/return-to-draft buttons, and `ItemForm` with AI suggestion

```typescript
// ReportDetailPage.tsx — shows report, items list, action buttons based on status
// DRAFT: show ItemForm to add items, edit/delete item buttons, Submit button
// REJECTED: show "Return to Draft" button, read-only items
// SUBMITTED/APPROVED: read-only
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getReport, submitReport, returnToDraft } from '../api/reports';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ItemForm } from '../../items/components/ItemForm';
import { ItemList } from '../../items/components/ItemList';
import { createItem, updateItem, deleteItem } from '../../items/api/items';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = () => getReport(id!).then(setReport).catch(() => setError('Failed to load')).finally(() => setLoading(false));

  useEffect(() => { reload(); }, [id]);

  const totalAmount = useMemo(() =>
    (report?.items ?? []).reduce((s: number, i: any) => s + Number(i.amount), 0),
    [report?.items]
  );

  if (loading) return <LoadingSpinner />;
  if (error || !report) return <p style={{ color: 'red' }}>{error || 'Not found'}</p>;

  const isDraft = report.status === 'DRAFT';
  const isRejected = report.status === 'REJECTED';

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{report.title}</h2>
        <StatusBadge status={report.status} />
      </div>
      <p style={{ color: '#6b7280' }}>Total: ${totalAmount.toFixed(2)}</p>

      <ItemList items={report.items} canEdit={isDraft}
        onDelete={async (itemId) => { await deleteItem(id!, itemId); reload(); }}
        onUpdate={async (itemId, data) => { await updateItem(id!, itemId, data); reload(); }}
      />

      {isDraft && (
        <>
          <ItemForm reportId={id!} onSaved={reload} />
          <button onClick={async () => { await submitReport(id!); reload(); }} style={{ marginTop: 16 }}>
            Submit Report
          </button>
        </>
      )}

      {isRejected && (
        <button onClick={async () => { await returnToDraft(id!); reload(); }} style={{ marginTop: 16, background: '#f59e0b', color: '#fff' }}>
          Return to Draft
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `ItemForm.tsx` with AI suggestion**

```typescript
import { useState } from 'react';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useSuggestCategory } from '../../ai/hooks/useSuggestCategory';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { createItem } from '../api/items';
import { CATEGORIES } from '../../../shared/constants';

export function ItemForm({ reportId, onSaved }: { reportId: string; onSaved: () => void }) {
  const [amount, setAmount] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [saving, setSaving] = useState(false);

  const debouncedMerchant = useDebounce(merchantName, 300);
  const { suggest, loading: aiLoading } = useSuggestCategory(debouncedMerchant, setCategory);

  const handleSubmit = async () => {
    if (!amount) return;
    setSaving(true);
    try {
      await createItem(reportId, { amount: Number(amount), merchantName, category: category || undefined, transactionDate: transactionDate || undefined });
      setAmount(''); setMerchantName(''); setCategory(''); setTransactionDate('');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h4>Add Item</h4>
      <input placeholder="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ marginBottom: 8, width: '100%' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="Merchant name" value={merchantName} onChange={e => setMerchantName(e.target.value)} style={{ flex: 1 }} />
        <button onClick={suggest} disabled={aiLoading || !merchantName}>{aiLoading ? '...' : 'Suggest'}</button>
      </div>
      <select value={category} onChange={e => setCategory(e.target.value)} style={{ display: 'block', width: '100%', margin: '8px 0' }}>
        <option value="">Select category</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="date" value={transactionDate} onChange={e => setTransactionDate(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 8 }} />
      <button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Add Item'}</button>
    </div>
  );
}
```

`ai/hooks/useSuggestCategory.ts`:
```typescript
import { useState, useEffect } from 'react';
import { suggestCategory } from '../api/ai';

export function useSuggestCategory(debouncedMerchantName: string, setCategory: (c: string) => void) {
  const [loading, setLoading] = useState(false);

  // Auto-fire when debounced value changes (after 300ms pause in typing)
  useEffect(() => {
    if (!debouncedMerchantName) return;
    setLoading(true);
    suggestCategory(debouncedMerchantName)
      .then(({ category }) => setCategory(category))
      .finally(() => setLoading(false));
  }, [debouncedMerchantName]);

  // Also expose manual trigger for the "Suggest" button
  const suggest = async () => {
    if (!debouncedMerchantName) return;
    setLoading(true);
    try {
      const { category } = await suggestCategory(debouncedMerchantName);
      setCategory(category);
    } finally {
      setLoading(false);
    }
  };

  return { suggest, loading };
}
```

`ai/api/ai.ts`:
```typescript
import client from '../../../shared/api/client';
export const suggestCategory = (merchantName: string) =>
  client.post('/ai/suggest-category', { merchantName }).then(r => r.data);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/domains/
git commit -m "feat: reports, items, and AI domains with full CRUD and suggest-category"
```

---

## Task 13: Frontend — Admin Domain & Router

**Files:**
- Create: `frontend/src/domains/admin/`
- Create: `frontend/src/router/index.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Create admin pages**

`admin/api/admin.ts`:
```typescript
import client from '../../../shared/api/client';
export const getAdminReports = (status?: string) =>
  client.get('/admin/reports', { params: status ? { status } : {} }).then(r => r.data);
export const getAdminReport = (id: string) => client.get(`/admin/reports/${id}`).then(r => r.data);
export const approveReport = (id: string) => client.post(`/admin/reports/${id}/approve`).then(r => r.data);
export const rejectReport = (id: string) => client.post(`/admin/reports/${id}/reject`).then(r => r.data);
```

`admin/pages/AdminReportsPage.tsx` — list all reports with status filter, navigate to detail.

`admin/pages/AdminReportDetailPage.tsx` — show report + items (read-only), Approve/Reject buttons only when `status === SUBMITTED`.

- [ ] **Step 2: Create `router/index.tsx`**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import { LoginPage } from '../domains/auth/pages/LoginPage';
import { SignupPage } from '../domains/auth/pages/SignupPage';
import { ReportsPage } from '../domains/reports/pages/ReportsPage';
import { ReportDetailPage } from '../domains/reports/pages/ReportDetailPage';
import { AdminReportsPage } from '../domains/admin/pages/AdminReportsPage';
import { AdminReportDetailPage } from '../domains/admin/pages/AdminReportDetailPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/signup" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
        <Route path="/reports" element={<ProtectedRoute><ErrorBoundary><ReportsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><ErrorBoundary><ReportDetailPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><ErrorBoundary><AdminReportsPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/admin/reports/:id" element={<ProtectedRoute><ErrorBoundary><AdminReportDetailPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 3: Update `main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './router';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppRouter /></React.StrictMode>
);
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/domains/admin/ frontend/src/router/ frontend/src/main.tsx
git commit -m "feat: admin domain and app router with ErrorBoundary per route"
```

---

## Task 14: Docs — README & DECISIONS.md

**Files:**
- Modify: `README.md`
- Modify: `DECISIONS.md`

- [ ] **Step 1: Write `README.md`**

Content must include:
- Project overview
- Quick start: `git clone → cp .env.example .env → docker-compose up --build → seed`
- How to run tests: `cd backend && npm test`
- Architecture overview (monorepo, layered backend, domain frontend)
- **AI Usage section** (required by assessment):
  - Tool: Claude Code (claude-sonnet-4-6)
  - How it helped: scaffolded structure, generated boilerplate, wrote state machine, drafted docs
  - Overrides: state machine flow corrected (REJECTED → DRAFT, not direct re-submit), frontend structure corrected to domain-based, UX enhancements added (ErrorBoundary, useDebounce, useMemo, LoadingSpinner)

- [ ] **Step 2: Write `DECISIONS.md`**

Content must include:
- Stack choices and why (NestJS, TypeORM, PostgreSQL, React+Vite)
- State machine design: REJECTED → DRAFT (explicit) → SUBMITTED — and why
- totalAmount computed at query time — why
- JWT in localStorage — trade-off acknowledged
- Admin creation via seed — why no self-registration
- TypeORM migrations vs synchronize — why
- Category as enum — why not free text
- **"If you had one more day, what would you build next and why?"** (~300–600 words)
  Suggested content: frontend tests (Vitest + React Testing Library), refresh token flow, pagination, receipt image upload (MinIO), audit log for status transitions, rate limiting on AI endpoint, role management UI for admins

- [ ] **Step 3: Commit**

```bash
git add README.md DECISIONS.md
git commit -m "docs: README with AI usage note and DECISIONS.md with trade-offs"
```

---

## Task 15: Final — Docker Smoke Test & GitHub Push

- [ ] **Step 1: Full docker-compose build**

```bash
docker-compose down -v
docker-compose up --build
```
Expected: db starts, backend runs migrations, frontend served at http://localhost:5173

- [ ] **Step 2: Seed admin user**

```bash
docker-compose exec backend npm run seed
```

- [ ] **Step 3: Smoke test key flows**

```bash
# Signup
curl -X POST http://localhost:3000/api/v1/auth/signup -H "Content-Type: application/json" -d '{"email":"smoke@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"smoke@test.com","password":"password123"}'

# Open http://localhost:5173 — login, create report, add items, submit
```

- [ ] **Step 4: Run all backend tests**

```bash
cd backend && npm test -- --coverage
```
Expected: all tests pass, state machine coverage 100%

- [ ] **Step 5: Final commit and push to GitHub**

```bash
git add -A
git commit -m "chore: final cleanup and smoke test verification"
git push origin main
```

- [ ] **Step 6: Create Pull Request on GitHub**

```bash
gh pr create --title "feat: Expense Report Management System" \
  --body "Full-stack expense report system — NestJS backend, React frontend, PostgreSQL, JWT auth, state machine, AI category suggestion. Includes unit tests, integration tests, docker-compose, README and DECISIONS.md."
```

---

## Summary

| Task | Deliverable |
|---|---|
| 1 | Monorepo root, docker-compose, CLAUDE.md |
| 2 | NestJS scaffold, enums, main.ts, Dockerfile |
| 3 | TypeORM entities, migration |
| 4 | Auth module — signup, login, JWT, RBAC |
| 5 | Reports service + state machine (11 unit tests) |
| 6 | Reports controller + module wiring |
| 7 | Items module with DRAFT-only guard |
| 8 | Admin controller + AI service (mocked tests) |
| 9 | Integration tests (happy + rejection paths) + seed |
| 10 | Frontend scaffold + shared components |
| 11 | Auth domain (login/signup) |
| 12 | Reports, items, AI domains |
| 13 | Admin domain + router |
| 14 | README (AI usage) + DECISIONS.md |
| 15 | Docker smoke test + push + PR |
