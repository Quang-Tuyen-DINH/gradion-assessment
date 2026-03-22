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

## Roles
- UserRole enum: `user` | `admin`
- Protected endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles(UserRole.ADMIN)` for admin-only routes

## Seed Admin Credentials
- email: admin@gradion.com
- password: admin1234
- Run: `docker-compose exec backend npm run seed` (idempotent)
