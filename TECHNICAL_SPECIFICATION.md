# SaaS LMS Platform Technical Specification

## 1. Product Scope
A multi-tenant SaaS learning platform inspired by **Kajabi + Skool**, combining:
- Course delivery (video-first, multilingual lessons)
- Community spaces
- Subscription commerce (Stripe)
- Student engagement (gamification)
- Creator/admin operations (admin panel, page builder)
- Observability and operational controls (debug mode, logs, error monitoring)

### Core Roles
- **Platform Super Admin**: global tenant governance, billing oversight, moderation tooling.
- **Tenant Admin (Creator/School Owner)**: configures school, courses, community, pricing, pages.
- **Instructor/Moderator**: manages lesson content and community moderation.
- **Student**: consumes lessons, interacts in community, tracks progress.

---

## 2. System Architecture

## 2.1 High-Level Architecture

```text
[Browser / Mobile Web]
        |
        v
[Next.js App Router + BFF APIs]
        |
        +--> [Node.js Domain Services Layer]
        |         |
        |         +--> PostgreSQL (primary relational store)
        |         +--> Redis (cache, sessions, queues, rate limits)
        |         +--> Stripe (checkout, subscriptions, webhooks)
        |         +--> SMTP Provider (transactional email)
        |
        +--> [Media/CDN Delivery for videos, images, static assets]
        |
        +--> [Observability Stack]
                  - Structured logs
                  - Error monitoring
                  - Metrics/tracing
```

### Architectural Style
- **Modular monolith** at launch (Next.js + Node.js domain modules in one deployable unit).
- Internal boundaries by domain (auth, billing, courses, community, analytics, admin).
- Evolution path to microservices for heavy domains (video processing, analytics pipeline, notifications).

## 2.2 Runtime Components
1. **Web Frontend (Next.js)**
   - SSR/ISR for SEO-sensitive pages (marketing pages, landing pages).
   - Client components for interactive dashboards, editor/page builder, community feeds.
2. **API/BFF Layer (Next.js route handlers / Node services)**
   - Authenticated JSON APIs for web app.
   - Coordinates domain operations and integrates with Stripe/SMTP.
3. **PostgreSQL**
   - Source of truth for tenants, users, enrollments, subscriptions, events, analytics aggregates.
4. **Redis**
   - Session store, cache layer, queue broker, leaderboard snapshots, rate limiting counters.
5. **Background Workers (Node.js worker process)**
   - Email dispatch, webhook retry handling, analytics aggregation, gamification recalculation.
6. **External Integrations**
   - Stripe for payment intent, checkout, subscriptions, invoices.
   - SMTP for emails (verification, receipts, reminders).

---

## 3. Services / Domain Modules

## 3.1 Identity & Access Service
Responsibilities:
- Registration/login/logout
- Password reset, email verification
- Role-based access control (platform_admin, tenant_admin, instructor, student, moderator)
- Tenant membership resolution

Key features:
- JWT (short-lived access token) + refresh token rotation.
- Optional OAuth in future; email/password v1.

## 3.2 Tenant & Configuration Service
Responsibilities:
- Tenant creation and settings
- Custom domain/subdomain mapping
- Localization defaults, branding, feature toggles

## 3.3 Course Service
Responsibilities:
- Course CRUD, module/lesson management
- Multilingual lesson versions and subtitle tracks
- Progress tracking (lesson completion, watch state)
- Prerequisite rules and drip scheduling

## 3.4 Community Service
Responsibilities:
- Channels/spaces (per tenant or per course)
- Posts, comments, reactions, moderation actions
- Mention notifications and content reporting

## 3.5 Billing & Subscription Service
Responsibilities:
- Product plans and pricing rules
- Stripe checkout session creation
- Subscription lifecycle sync via webhooks
- Entitlement management (feature/course access)

## 3.6 Checkout Service
Responsibilities:
- Tax/currency-aware checkout orchestration
- Promotion codes/coupons
- Idempotent order creation and reconciliation

## 3.7 Gamification Service
Responsibilities:
- Points/rules engine (course completion, community participation)
- Level progression and badges
- Leaderboards (global, tenant, cohort)

## 3.8 Page Builder & CMS Service
Responsibilities:
- Visual page composition using reusable blocks
- Versioned page drafts/publish workflow
- SEO metadata and localization support

## 3.9 Video Player & Media Service
Responsibilities:
- Secure playback URL generation
- Track watch events (play, pause, complete)
- Subtitle/language selection support

## 3.10 Student Dashboard Service
Responsibilities:
- Aggregates enrolled courses, progress, streaks, achievements, community highlights
- Personalized recommendations (v2)

## 3.11 Analytics Service
Responsibilities:
- Event ingestion (client + server)
- Near-real-time aggregates for dashboards
- Funnel and engagement metrics

## 3.12 Admin & Operations Service
Responsibilities:
- Admin panel endpoints for moderation, tenant controls, billing issues
- Debug mode tooling (request traces, feature flag overrides)
- Logs viewer and error incident links

---

## 4. Database Entities (PostgreSQL)

> All entities include `id (uuid)`, `created_at`, `updated_at` unless noted.

## 4.1 Multi-tenancy & Auth
- **tenants**: name, slug, status, default_locale, timezone, branding_json
- **users**: email (unique), password_hash, status, global_role
- **tenant_memberships**: tenant_id, user_id, role, joined_at
- **sessions**: user_id, refresh_token_hash, expires_at, ip, user_agent
- **audit_logs**: tenant_id, actor_user_id, action, resource_type, resource_id, metadata_json

## 4.2 Courses & Lessons
- **courses**: tenant_id, title, description, visibility, published_at, difficulty
- **course_modules**: course_id, title, position
- **lessons**: module_id, lesson_type(video/text/quiz), position, duration_seconds, is_preview
- **lesson_localizations**: lesson_id, locale, title, body_richtext_json, subtitles_url, video_asset_id
- **enrollments**: tenant_id, course_id, user_id, enrolled_at, source(subscription/manual)
- **lesson_progress**: enrollment_id, lesson_id, completion_state, watched_seconds, completed_at

## 4.3 Community
- **communities**: tenant_id, name, access_scope(public/private/course-bound)
- **community_posts**: community_id, author_user_id, title, body, pinned_at
- **community_comments**: post_id, author_user_id, body
- **community_reactions**: subject_type(post/comment), subject_id, user_id, reaction_type
- **content_reports**: tenant_id, reporter_user_id, subject_type, subject_id, reason, status

## 4.4 Commerce
- **plans**: tenant_id, stripe_price_id, name, interval(month/year), amount_cents, currency
- **subscriptions**: tenant_id, user_id, plan_id, stripe_subscription_id, status, current_period_end
- **orders**: tenant_id, user_id, stripe_payment_intent_id, amount_cents, currency, status
- **order_items**: order_id, item_type(course/plan), item_ref_id, unit_amount_cents
- **coupons**: tenant_id, code, discount_type(percent/fixed), value, active, expires_at

## 4.5 Gamification
- **point_events**: tenant_id, user_id, source_type, source_id, points_delta
- **user_levels**: tenant_id, user_id, level, total_points
- **badges**: tenant_id, key, name, criteria_json
- **user_badges**: badge_id, user_id, awarded_at
- **leaderboard_snapshots**: tenant_id, period(daily/weekly/all_time), snapshot_json, generated_at

## 4.6 Page Builder / CMS
- **pages**: tenant_id, slug, page_type(landing/sales/about), status(draft/published)
- **page_versions**: page_id, version_number, blocks_json, locale, seo_json, published_at

## 4.7 Analytics / Ops
- **event_stream**: tenant_id, user_id nullable, event_name, event_time, payload_json, source(client/server)
- **metric_daily_rollups**: tenant_id, metric_key, dimension_json, date, value
- **error_events**: tenant_id nullable, service, severity, fingerprint, message, stacktrace, context_json
- **job_runs**: job_type, status, started_at, finished_at, result_json

### Indexing & Constraints
- Composite indexes on hot paths:
  - `(tenant_id, user_id)` for memberships, enrollments, subscriptions
  - `(course_id, position)` and `(module_id, position)` for content ordering
  - `(tenant_id, event_time)` for event querying
- Partial indexes for active subscriptions and pending reports.
- Unique constraints:
  - users.email
  - tenant scoped slug/code uniqueness (e.g., pages, coupons)

---

## 5. API Endpoints (Representative v1)

Base path: `/api/v1`

## 5.1 Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

## 5.2 Tenant & Admin
- `GET /tenants/:tenantId`
- `PATCH /tenants/:tenantId/settings`
- `GET /admin/users`
- `POST /admin/feature-flags/:flagKey/toggle`

## 5.3 Courses
- `GET /courses`
- `POST /courses`
- `GET /courses/:courseId`
- `PATCH /courses/:courseId`
- `POST /courses/:courseId/modules`
- `POST /lessons/:lessonId/localizations`
- `POST /courses/:courseId/enroll`
- `GET /me/enrollments`
- `POST /lessons/:lessonId/progress`

## 5.4 Community
- `GET /communities/:communityId/feed`
- `POST /communities/:communityId/posts`
- `POST /posts/:postId/comments`
- `POST /reactions`
- `POST /reports`

## 5.5 Billing / Checkout / Subscriptions
- `GET /billing/plans`
- `POST /checkout/session` (creates Stripe Checkout Session)
- `POST /webhooks/stripe` (signature verified)
- `GET /me/subscription`
- `POST /me/subscription/cancel`

## 5.6 Page Builder
- `GET /pages/:slug?locale=xx`
- `POST /pages`
- `POST /pages/:pageId/versions`
- `POST /pages/:pageId/publish`

## 5.7 Gamification
- `GET /me/gamification`
- `GET /leaderboards?period=weekly`
- `POST /admin/gamification/recalculate`

## 5.8 Analytics & Ops
- `POST /events/batch`
- `GET /analytics/overview`
- `GET /analytics/course/:courseId`
- `GET /ops/logs`
- `GET /ops/errors`
- `POST /ops/debug-mode` (admin only)

### API Standards
- REST + JSON, versioned URLs.
- Idempotency keys required for checkout/order operations.
- Cursor pagination for feeds and events.
- Error contract:
  ```json
  { "error": { "code": "string", "message": "string", "requestId": "uuid" } }
  ```

---

## 6. Scalability Considerations

## 6.1 Application Layer
- Stateless API instances behind load balancer.
- Horizontal autoscaling based on CPU + request latency + queue depth.
- Split worker pool by workload type (webhooks, emails, analytics jobs).

## 6.2 Data Layer
- PostgreSQL:
  - Read replicas for analytics-heavy reads.
  - Partition `event_stream` by time (monthly) for retention/query performance.
  - Online index management and vacuum tuning.
- Redis:
  - Dedicated logical databases or clusters for cache vs queues.
  - TTL-driven cache invalidation for dashboards/feed hot data.

## 6.3 Async & Event Processing
- Queue-backed jobs for non-blocking user flows.
- Retry with exponential backoff and dead-letter queue.
- Exactly-once-like processing via idempotency keys and de-dup tables.

## 6.4 Media & Delivery
- CDN-backed media/video delivery.
- Signed URLs for protected assets.
- Adaptive bitrate streaming (HLS/DASH via provider).

## 6.5 Multi-tenancy Growth
- Row-level tenant isolation initially.
- Sharding strategy later by tenant_id for very large tenants.
- Tenant-aware rate limits to avoid noisy-neighbor effects.

---

## 7. Security Model

## 7.1 Authentication & Session Security
- Access tokens short-lived (e.g., 15 min), refresh tokens rotated and hashed at rest.
- MFA for admin roles (recommended v1.1).
- Device/session revocation endpoint.

## 7.2 Authorization
- RBAC with tenant scoping on every request.
- Policy checks at service boundary (e.g., `canManageCourse`, `canModerateCommunity`).
- Course/community access linked to active entitlements.

## 7.3 Data Protection
- TLS everywhere in transit.
- Encrypt sensitive data at rest (DB disk encryption + secrets in KMS).
- Password hashing with Argon2id/Bcrypt (cost tuned).
- PII minimization and retention policy for logs/events.

## 7.4 API & Web Security
- CSRF protection for cookie-auth routes.
- Rate limiting + bot protection on auth and checkout endpoints.
- Input validation with schema validators (Zod/Joi).
- Output encoding and CSP headers to mitigate XSS.
- Secure headers: HSTS, X-Content-Type-Options, X-Frame-Options/frame-ancestors.

## 7.5 Stripe & Webhook Security
- Verify Stripe webhook signatures.
- Idempotent webhook handlers with replay protection.
- Store webhook event IDs to prevent duplicate processing.

## 7.6 Auditability & Monitoring
- Immutable audit logs for admin/security actions.
- Centralized error monitoring with alert routing.
- Correlation IDs across requests/logs/jobs.
- Debug mode gated by high-privilege roles and full audit trail.

---

## 8. Observability, Debug Mode, Logs, Error Monitoring

- **Structured logging** (JSON): request_id, tenant_id, user_id, endpoint, latency_ms, status_code.
- **Log streams**:
  - access logs
  - application logs
  - security/audit logs
- **Debug mode**:
  - tenant- or user-scoped temporary diagnostic verbosity
  - auto-expiry (e.g., 30 minutes)
  - redaction guarantees for secrets/PII
- **Error monitoring**:
  - capture unhandled exceptions + frontend errors
  - release tagging and source maps
  - alert thresholds for error rate spikes

---

## 9. Deployment & Environments

- Environments: `dev`, `staging`, `prod`.
- CI/CD pipeline:
  - lint/test/build
  - migration checks
  - deploy with health checks and rollback.
- Infrastructure baseline:
  - Next.js app instances
  - worker instances
  - managed PostgreSQL + Redis
  - secret manager for keys (Stripe, SMTP, JWT signing secrets)

---

## 10. Non-Functional Targets (Initial)

- Availability: 99.9% monthly uptime target.
- P95 API latency: < 300 ms for read endpoints (excluding heavy analytics).
- Checkout success SLO: > 99.5% successful payment intent confirmations.
- RPO: 15 minutes; RTO: 1 hour.

