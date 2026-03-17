# LMS Platform Monorepo Foundation

This repository provides a **scalable, modular monorepo architecture** for a SaaS LMS platform (Kajabi + Skool style), aligned to `TECHNICAL_SPECIFICATION.md`.

## Monorepo Layout

```text
apps/
  frontend/        # Next.js app (student dashboard, admin UI, page builder UI)
  backend/         # Node.js API (domain modules + integrations)
packages/
  shared/          # Shared types, contracts, utilities
  config/          # Shared runtime config helpers
  eslint-config/   # Shared linting presets
  tsconfig/        # Shared TypeScript base configs
database/
  prisma/          # Prisma schema and migrations
scripts/           # Repo utility scripts (bootstrap, health checks)
docker/            # Docker-related assets (if needed)
```

## Domains Prepared

Both frontend and backend are structured for:
- Authentication
- Courses
- Community
- Payments
- Checkouts
- Gamification
- Admin panel

## Quick Start

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
```bash
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env
cp database/.env.example database/.env
```

### 3) Start infra (PostgreSQL + Redis + Mailhog)
```bash
docker compose up -d postgres redis mailhog
```

### 4) Generate Prisma client and run migrations
```bash
npm run db:generate
npm run db:migrate
```

### 5) Run apps
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Mailhog: http://localhost:8025

## Docker

Run the full stack locally:
```bash
docker compose up --build
```

## Notes

- This is a **foundation only** (no full business features implemented yet).
- Domain boundaries, shared modules, and infrastructure are in place for incremental delivery.

## Authentication Module (Implemented)

Business rule enforced:
- Public self-registration is disabled.
- Accounts must be provisioned by admin workflows or payment workflows.

Auth endpoints:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`

Password recovery details:
- Secure token generated server-side
- Token expires in 1 hour
- Single-use token handling
- SMTP/template integration point with email logging

## Billing & Subscription Flow (Implemented)

- Stripe checkout endpoint for monthly/yearly subscription initiation.
- Stripe webhook handler for subscription lifecycle events:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Automatic user provisioning from successful checkout (student role).
- Automatic enrollment to all courses after successful subscription.
- Grace period behavior:
  - `past_due` allows platform access with warning for 10 days.
  - after grace period, access is blocked and paywall is shown.
- Customer portal link endpoint and admin billing config endpoint.


## Admin Panel (Implemented)

Admin API (role-protected):
- `GET /api/v1/admin/dashboard`
- `GET/POST/PATCH/DELETE /api/v1/admin/students`
- `POST /api/v1/admin/students/send-email`
- `GET /api/v1/admin/subscriptions`
- `POST /api/v1/admin/tracks|courses|modules|lessons`
- `GET/POST /api/v1/admin/stripe`
- `GET/POST /api/v1/admin/checkouts`
- `GET/POST /api/v1/admin/emails/templates`
- `GET/POST /api/v1/admin/files`

Admin frontend pages:
- `/admin`
- `/admin/students`
- `/admin/courses`
- `/admin/subscriptions`
- `/admin/emails`
- `/admin/stripe`
- `/admin/checkouts`

## Admin Email + Analytics Extension

- Admin dashboard now includes:
  - total users
  - active subscriptions
  - canceled subscriptions
  - total revenue (basic)
  - course completion rate
- Admin email system now supports:
  - create + edit email templates
  - SMTP settings (host/port/user/password)
  - send test email endpoint
