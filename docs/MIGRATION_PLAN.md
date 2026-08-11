# ScholarHub Africa — Django → Next.js (Vercel Serverless) Migration Plan

> **Status:** v1.0 — **All code milestones complete** (M1–M7). Remaining: owner runs the M2 apply on Neon + M8 cutover (sandbox cannot reach neon.tech; see §4 runbook + §12 cutover runbook)
> **Date:** 2026-08-11
> **Source of truth:** this repository at commit `c473ba2` (Django 5.0.7 · DRF 3.15 · Tailwind 3.4 · Alpine.js · PostgreSQL/Neon · Celery · Railway)
> **Target:** Next.js App Router · React · TypeScript · Tailwind CSS · Neon PostgreSQL · Vercel

---

## 0. Why this plan exists

The current Django stack works but the framework isn't working for you: two
frontend build pipelines (Vite + Alpine islands for Django, plus a separate
Next.js 14 `consent-manager/` app), Celery/Redis infrastructure on Railway, and
a server-rendered monolith that's hard to iterate on. The goal is **one
Next.js application on Vercel** that preserves:

- **SEO/AEO parity** — every indexed URL, all JSON-LD, sitemap, robots.txt, llms.txt
- **Functionality parity** — directory, full-text search, filters, tracker, digests
- **Data** — the existing Neon PostgreSQL database
- **Standards** — the four-track enforcement in `AGENTS.md` (SEO/AEO/Security/Performance) continues to apply to every new route and component

**The plan is deliberately conservative:** the Django app stays live on Railway
until the Next.js app reaches feature parity, then we cut over DNS and retire it.

---

## 1. Current state inventory (grounded in this repo)

| Layer | Today | Target |
|---|---|---|
| Framework | Django 5 + DRF, templates | Next.js App Router + React Server Components |
| Frontend build | Vite (`package.json` at root) + Alpine.js islands (`frontend/`) | Tailwind via Next.js; React components |
| Styling | Tailwind 3.4 (`tailwind.config.js`), custom tokens (teal/forest/crimson/navy) | Tailwind (3.4 → 4.x), tokens preserved in `@theme` |
| DB | PostgreSQL on Neon, `public` schema, Django ORM | Neon, **Drizzle ORM** (decided) |
| Search | Postgres `SearchVector`/`SearchRank` (weighted A–D), SQLite fallback | Generated `search_vector` column + GIN index (schema done); `ts_rank` queries in Phase 3 |
| Auth | Django session auth, single admin user (`auth_user`) | **Auth.js v5, multi-user** (decided; tables in schema) |
| Background | Celery beat + worker on Railway (digest Mon 05:00 UTC, daily crawl) | **Vercel Cron + route handlers + Resend** (decided) |
| Email | Resend (weekly digest HTML template `templates/emails/weekly_digest.html`) | React Email template → Resend |
| Consent/GA4 | Separate Next.js 14 app `consent-manager/` (file-based JSONL store, GCM v2 + TCF encoder) | Folded into the main app; store swapped from filesystem → Postgres (Vercel FS is ephemeral) |
| Hosting | Railway (web/worker/beat via Procfile) + Cloudflare in front | Vercel (functions + cron) + Cloudflare DNS/WAF retained |
| CI | GitHub Actions → pytest | GitHub Actions → `next build` + lint + typecheck + Vitest |

### Django models to map (exact)

- **`Country`** — name, iso_code, flag_emoji, region
- **`FieldOfStudy`** — name, slug, icon
- **`Scholarship`** — slug, name, short_name, programme, university, country FK, funding_type/detail, application_fee/currency, eligibility_label, english_requirement, age_min/max, experience_years_min, gpa_minimum, nationality_notes, mba_impact/mba_notes, score, competitiveness, `fields` M2M, deadline_date/notes, status, cycle_year, notes, action_required, official_link, is_verified/verified_at/verified_source, is_featured, is_active, created_at/updated_at
- **`ChangeLog`** — audit trail of edits
- **`ApplicantProfile`** — user FK (nullable), email, full_name, nationality, degree_field, graduation_year, gpa, experience_years, has_ielts/ielts_score, has_toefl/toefl_score, notes
- **`TrackedApplication`** — profile FK, scholarship FK, stage, priority, notes, next_action(+due), sop_status, refs_status, transcript_ready, moi_ready
- **`DocumentItem`** — profile FK, name, status, notes, due_date (24-item checklist)
- **`User`** — Django `auth_user` (single admin today; Phase 2 = registration + Google OAuth)

### API surface to reproduce (DRF → Route Handlers)

| Django endpoint | Next.js replacement |
|---|---|
| `GET /api/v1/scholarships/` (filters + `q`/`search`, paginated) | `app/api/v1/scholarships/route.ts` — same query params, same JSON shape |
| `GET /api/v1/scholarships/{pk}/` | `app/api/v1/scholarships/[id]/route.ts` |
| `GET /api/v1/scholarships/open_now/`, `/top/` | `app/api/v1/scholarships/open_now/route.ts`, `top/route.ts` |
| `GET /api/v1/countries/`, `/fields/` (with counts) | `app/api/v1/countries/route.ts`, `app/api/v1/fields/route.ts` |
| `GET /api/v1/search/?q=` | `app/api/v1/search/route.ts` |
| `GET/POST/PUT /api/v1/tracker/applications/…` | `app/api/v1/tracker/applications/route.ts` + `[id]/route.ts` (auth-gated) |
| `GET/PUT /api/v1/tracker/documents/{id}/`, `profile/` | `app/api/v1/tracker/documents/[id]/route.ts`, `profile/route.ts` |
| `sitemap.xml`, `robots.txt`, `llms.txt`, 404/500 | `app/sitemap.ts`, `app/robots.ts`, `app/llms.txt/route.ts`, `app/not-found.tsx`, `app/error.tsx` |

### Page inventory (templates → routes)

| Django template | Next.js route | Notes |
|---|---|---|
| `base.html` + nav/footer | `app/layout.tsx` + `Navbar`/`Footer` | Metadata API for SEO defaults |
| `scholarships/home.html` | `app/page.tsx` | ISR (revalidate ~60s) |
| `scholarships/directory.html` + filter/search/card components | `app/scholarships/page.tsx` + `FilterSidebar`/`SearchBar`/`ScholarshipCard` (client components for interactivity) | RSC reads data server-side; URL searchParams drive filters |
| `scholarships/detail.html` | `app/scholarships/[slug]/page.tsx` | `generateStaticParams` + `generateMetadata` + MonetaryGrant JSON-LD + countdown |
| `scholarships/by_country.html`, `by_field.html` | `app/scholarships/country/page.tsx`, `field/page.tsx` | |
| `pages/about/faq/contact/privacy/thank_you/case_study.html` | `app/about|faq|contact|privacy|thank-you|case-studies/page.tsx` | FAQ accordion (Alpine) → client component |
| `tracker/dashboard.html`, `checklist.html` | `app/tracker/page.tsx`, `app/tracker/checklist/page.tsx` | Kanban drag-drop; auth-gated |
| `accounts/profile.html`, `registration/*` | `app/account/*` under Auth.js | |
| `emails/weekly_digest.html` | `emails/WeeklyDigest.tsx` (React Email) | |

---

## 2. Target architecture

```
Browser / bots
      │  HTTPS
      ▼
Cloudflare (DNS · WAF · caching) ──► Vercel Edge Network
                                        │
                ┌───────────────────────┼───────────────────────────┐
                ▼                       ▼                           ▼
        Next.js App (RSC/ISR)    Route Handlers (API)         Vercel Cron
        directory · detail ·     /api/v1/* · /api/cron/*      /api/cron/digest
        marketing pages          /api/consent/*               /api/cron/crawl
                │                       │
                └──────────┬────────────┘
                           ▼
              Neon PostgreSQL (pooled conn)
              · app tables (Drizzle/Prisma schema)
              · Auth sessions · consent logs
              · tsvector GIN index (search)
              │
              ▼
        Resend (digest email) · Google OAuth (Phase 2)
```

**Key architecture decisions baked into the plan**

1. **Public pages are React Server Components + ISR** — data is read server-side
   (direct SQL via ORM, no client round-trip), so SEO content is in the initial
   HTML exactly like Django today. The `/api/v1/*` JSON endpoints still exist
   for API consumers, but the UI doesn't depend on them.
2. **URL parity** — Django URLs end in `/`. We enable `trailingSlash: true` so
   every indexed URL (`/scholarships/`, `/scholarships/{slug}/`, `/about/`…)
   keeps its exact form — no 301 chains, zero SEO loss.
3. **One app, not two — consent engine ported (M1).** The end-user consent
   environment of `consent-manager/` now lives in the main app:
   `src/lib/consent/*` (GCM v2 + TCF 2.3 encoder + ScriptManager), the
   `ConsentProvider`/`CookieBanner`/`PreferencesModal`/`FloatingShield`
   components, the edge `middleware.ts` region detection, and
   `src/lib/server/store.ts` — **rewritten Postgres-backed**
   (`consent_logs`/`consent_config`/`consent_policies`, schema in
   `src/db/schema.ts`) because Vercel's filesystem is ephemeral. The same
   file store signature is kept so the `/api/consent` routes port unchanged.
   GA4 is consent-gated via `Analytics.tsx` (port of `static/js/analytics.js`
   + base.html gtag snippet): scripts are registered with the ScriptManager
   and injected only after analytics consent; every event is double-gated.
4. **Database schema (M2)** — the full Drizzle schema (`src/db/schema.ts`, 13
   tables) and generated migration SQL (`web/drizzle/0000_m2-django-to-drizzle.sql`)
   are in the repo: scholarships with the weighted A–D generated `search_vector`
   + GIN index, Auth.js tables (users/accounts/sessions/verificationTokens),
   tracker tables (multi-user `applicant_profiles`), and the consent tables.
5. **Connection pooling** — `@neondatabase/serverless` driver with the pooled
   connection string (`-pooler` host); every request uses a single pooled
   connection. No `conn_max_age` gymnastics needed.
5. **Timezone** — deadline math (`days_until_deadline`, countdown) is computed
   server-side in `Africa/Nairobi` (EAT), preserving current behavior.

---

## 3. Phase 1 — Project setup & architecture

**Goal:** a compiling Next.js app with the ORM, DB connection, and standards scaffolding in place.

1. Scaffold Next.js (App Router, TypeScript, Tailwind) in `web/` — keeps the
   live Django app untouched at the repo root during the transition. At cutover
   the new app is promoted to the root and Django moves to `django-legacy/`.
2. ORM: **Drizzle** (decided M0) — `drizzle-orm` + `drizzle-kit`, `@neondatabase/serverless` driver. ✅ done
3. Install `@neondatabase/serverless`, wire `DATABASE_URL` (pooled), add
   connection helper `lib/db.ts` with a per-request singleton (RSC-safe).
4. Tailwind 4 CSS-first config; port the existing design tokens from
   `tailwind.config.js` + `static/css/main.css` into `@theme` so the visual
   design is pixel-identical.
5. Port the consent engine from `consent-manager/` as `lib/consent/*` +
   `components/consent/*`; replace `store.ts` with Postgres-backed tables
   (`consent_logs`, `consent_config`, `consent_policies`). ✅ done (M1)
6. **Standards scaffolding** (AGENTS.md tracks): `next.config` security headers
   (CSP, HSTS, X-Frame-Options, Permissions-Policy — copy from
   `consent-manager/next.config.mjs`), `app/robots.ts`, `app/sitemap.ts`,
   `app/llms.txt/route.ts`, `app/not-found.tsx`, `app/error.tsx`.
7. CI: replace pytest with `next build` + `eslint` + `tsc --noEmit` + Vitest;
   keep GitHub Actions.
8. Update `AGENTS.md` framework note (currently states "Django, no TypeScript").

**Exit criteria:** `next dev` renders a shell layout with header/footer identical
to `base.html`, DB ping succeeds, headers verified.

---

## 4. Phase 2 — Database migration (schema + data)

**Strategy (recommended): Neon branching.** Neon's branching gives us a
production-clone branch of the exact production DB. We build the new schema and
run migrations against the branch, validate, then either promote the branch or
replay migrations on production. Zero risk to live data; full rollback.

1. **Schema mapping** (Django → new ORM):

   | Django model | Target table | Notes |
   |---|---|---|
   | `auth_user` | `users` (+ Auth.js `accounts`/`sessions` tables) | one-time admin password reset at cutover (Django PBKDF2 hashes don't carry over) |
   | `Country` | `countries` | same columns |
   | `FieldOfStudy` | `fields_of_study` | same columns |
   | `Scholarship` | `scholarships` | same columns; M2M → `scholarship_fields` junction |
   | `ChangeLog` | `change_logs` | same columns |
   | `ApplicantProfile` | `applicant_profiles` | `user_id` unique FK → `users.id` (required — multi-user, M0 decision #5) |
   | `TrackedApplication` | `tracked_applications` | unique(profile_id, scholarship_id) |
   | `DocumentItem` | `document_items` | same columns |
   | — new | `search_vector` generated tsvector column + GIN index | `GENERATED ALWAYS AS (...)` from name/programme/university/notes/funding_detail — same A–D weights as `search.py` |
   | — new | `consent_logs`, `consent_config`, `consent_policies` | replaces consent-manager JSONL files |

   Choice enums (funding, eligibility, status, stage, priority…) become
   Postgres `enum` types or `text` + app-level Zod validation (recommended:
   `text` + Zod for serverless simplicity; enums are fine either way).

2. **Data migration — DONE in the repo, locally tested.** `web/scripts/migrate-data.mjs`
   copies every row from the Django tables into the new tables preserving ids
   (FKs map 1:1), except:
   - `auth_user.id` → `users.id` as `user_<id>` (Auth.js text PK)
   - `applicant_profiles.user_id` → `user_<id>`
   - duplicate `auth_user` emails are deduped (kept lowest id; `users.email` is UNIQUE)
   It is read-only over Django tables, runs in one transaction (rollback on any
   parity mismatch), skips already-populated targets (resume-safe), advances all
   `bigserial` sequences, and verifies counts + FK orphans + full-text search
   before committing. `web/scripts/test-migrate-local.mjs` exercises the exact
   same logic against an in-memory Postgres (pg-mem) — **passing** (including
   the dedupe, id mapping, idempotent re-run, and zero-orphan assertions).
   `web/scripts/verify-migration.mjs` re-checks parity read-only at any time.
3. **Indexes** — port all Django `Meta.indexes` (country, status, -score, deadline_date) plus the tsvector GIN index.
4. **RLS** — `deploy/rls.sql` and `enable_rls` command exist today; optionally port
   RLS policies so tracker data is tenant-isolated at the DB layer (nice-to-have).

### M2 runbook (apply on Neon — run from your machine, not this sandbox)

The coding sandbox cannot reach neon.tech (README documents the same block for
CI), so the apply step is two commands you run locally. The plan's Neon-branch
strategy was relaxed to **shadow tables in the same database**: the new tables
are created alongside Django's (no name collisions, Django untouched), the copy
is read-only over Django data, and rollback = `DROP TABLE` the new tables. If
you'd rather do a proper branch first, provide a `NEON_API_KEY` and the same
scripts run unchanged against the branch.

```bash
cd web
npm install                     # first time
npm run db:test:local           # optional: re-run the offline self-test
# 1) put DATABASE_URL in web/.env.local (Neon POOLED string, see .env.example)
npm run db:migrate              # creates the 13 new tables (drizzle-kit migrate)
npm run db:migrate:data         # copies data, verifies parity, commits
npm run db:verify               # read-only parity re-check any time
```

Expected output ends with `✅ Parity OK` and a per-table django=… drizzle=…
report. After the copy: one-time admin password reset at cutover (Django PBKDF2
hashes don't carry into Auth.js).

**Exit criteria:** `✅ Parity OK` on the live DB (counts match, 0 FK orphans,
search-vector hits for DAAD/scholarship/Germany), `next build` type-checks
against the new schema.

---

## 5. Phase 3 — API & core logic

**Goal:** identical query semantics, identical JSON.

1. **Queries** — a shared `lib/queries.ts` (Drizzle: `drizzle-orm` relations +
   raw SQL) implementing:
   - visible scholarships (`is_active=True`, `select_related` equivalent, ordering `-score, deadline_date`)
   - the full filter set from `apps/scholarships/filters.py`: `country` (CSV, ISO),
     `field` (slug), `funding`, `eligibility`, `status` (CSV), `min_score`/`max_score`,
     `deadline_before`/`after`, `deadline_in_next`, `is_open` (365-day window logic)
   - weighted full-text search: `websearch_to_tsquery('english', $q)` +
     `ts_rank` over the generated tsvector, `rank >= 0.001`, order `rank, score`
     (exact port of `search.py`); optional later upgrade to Neon `pg_search`
     for typo tolerance without changing the API
   - `countries`/`fields` with active scholarship counts (annotate equivalents)
2. **Route handlers** — the table in §1, one file per endpoint, using
   `NextRequest.nextUrl.searchParams` as the filter source. Pagination matches
   DRF's page/page_size shape.
3. **RSC pages reuse the same queries** — no duplicate logic between the API
   and the rendered pages; filters render server-side with `useSearchParams`
   (via a Suspense boundary) for URL-driven state — same UX as Django's
   `?country=DE&funding=full` URLs.
4. **Validation** — Zod schemas for every filter/body; 400 responses shaped
   like DRF errors.
5. **Rate limiting** — replace Redis rate limiter (fail-closed) with
   Upstash Ratelimit (or `@vercel/functions` rate limiting) on contact, auth,
   and cron endpoints.
6. **Tests** — port `apps/scholarships/tests.py` filter/search assertions to
   Vitest against the branch DB.

**Exit criteria:** automated diff of API responses (Django vs Next) for a
sampled set of filter/search queries returns identical JSON.

---

## 6. Phase 4 — Frontend & UI conversion

**Goal:** pixel-parity UI, one page group at a time, SEO checked per page.

1. **Layout** — `app/layout.tsx`: header/nav (auth-aware via session),
   footer, consent banner, GA4 via GCM v2 (existing consent lib), Metadata API
   defaults (title template, description, canonical, OG/Twitter, `en_GB`, 1200×630 OG image).
2. **Component inventory** (Django partials → React):
   - `scholarship_card.html` → `ScholarshipCard.tsx` (server component)
   - `score_badge.html`, `deadline_badge.html`, `eligibility_badge.html`, `flag_chip.html` → small presentational components
   - `filter_sidebar.html` → `FilterSidebar.tsx` (client; URL-driven)
   - `search_bar.html` → `SearchBar.tsx` (client; debounced → `/api/v1/search/`)
   - `sticky_cta.html`, `breadcrumbs.html`, `testimonials.html` → components
   - Alpine.js patterns (FAQ accordion, mobile menu, theme toggle, kanban
     drag-and-drop, checklist toggles) → React client components; keep all
     existing Tailwind classes unchanged
3. **Directory** — RSC reads filters from `searchParams`, renders cards; the
   sidebar updates URLs (server navigation) instead of client-side filtering —
   preserves shareable URLs, back-button, and bot-crawlable filtered pages.
4. **Detail** — `generateStaticParams` for all active slugs + ISR revalidation
   on data change; live countdown client component initialized from server
   values (EAT); change-log history section; MonetaryGrant JSON-LD + OG image
   (`@vercel/og` replaces the `generate_og_image` Pillow command).
5. **JSON-LD parity** — Organization + WebSite site-wide, FAQPage, Article,
   BreadcrumbList, MonetaryGrant on detail — same types as today.
6. **Tracker** — kanban board + checklist as client components backed by the
   tracker route handlers; optimistic updates; auth-gated pages redirect to login.
7. **Emails** — rewrite `weekly_digest.html` as a React Email template; the
   digest SQL (60-day urgent + new-this-week queries from `tasks.py`) lives in
   `lib/queries.ts` shared with the cron handler.

**Exit criteria:** Lighthouse/`next build` per-route metadata check passes the
AGENTS.md acceptance audit; visual diff of key pages matches Django screenshots.

---

## 7. Phase 5 — Authentication & background jobs

1. **Auth — Auth.js (NextAuth v5) — DONE.** Credentials (bcrypt hashes in
   `users.password`, registration via `/api/auth/register`) + Google OAuth
   (user row upserted in the signIn callback). **JWT sessions** (edge-safe
   middleware gate for `/tracker/*` + `/accounts/profile`). Login page at
   `/accounts/login/` (client form with register/sign-in modes), logout via
   `/accounts/logout/`. Password migration note: Django PBKDF2 hashes cannot
   be read by Auth.js — the legacy admin resets their password at cutover.
2. **Vercel Cron — DONE (confirmed M0 decision #4 — Vercel Cron + Resend, no Inngest).**
   - `web/vercel.json`: `"0 5 * * 1"` → `/api/cron/digest` (Monday 05:00 UTC =
     08:00 EAT, matching today's Celery beat), `"0 3 * * *"` → `/api/cron/crawl`.
   - Handlers authenticate with `Authorization: Bearer $CRON_SECRET`
     (`maxDuration = 300`). The digest runs the shared queries
     (`src/lib/digest.ts` — port of `tasks.py build_digest_context`), renders
     the ported weekly-digest HTML, and sends via the Resend REST API
     (`RESEND_API_KEY`, `DIGEST_EMAILS`, `DEFAULT_FROM_EMAIL`); dry-runs
     (logs) when the key is unset.
   - The crawler endpoint is wired with the same guard; the
     `crawl_scholarships.py` port to Node/cheerio is the one remaining TODO.
   - *Escalation path:* if the crawler needs retries/queues, move both jobs to
     **Inngest** (durable execution) without changing the job logic.
3. **Import/ops commands** (`import_scholarships`, `seed_demo`) → Node scripts
   runnable via `vercel run` or a script entry in the repo.

**Exit criteria:** cron fires on schedule in production, digest email renders
identically, tracker works end-to-end with the new auth.

---

## 8. Phase 6 — Deployment & cutover

1. **`vercel.json`** — crons + `trailingSlash: true` + headers (or keep headers
   in `next.config`).
2. **Env vars** (Vercel project): `DATABASE_URL` (pooled), `AUTH_SECRET`,
   `AUTH_GOOGLE_ID/SECRET` (Phase 2), `RESEND_API_KEY`, `DIGEST_EMAILS`,
   `DEFAULT_FROM_EMAIL`, `CRON_SECRET`, `GA4_MEASUREMENT_ID`, `SITE_DOMAIN`,
   `NEXT_PUBLIC_SITE_URL`.
3. **Domains** — keep Cloudflare in front (DNS/WAF); CNAME `scholarhub.africa`
   + `www` to the Vercel deployment; verify TLS + the Cloudflare proxy still
   terminates HTTPS correctly.
4. **Data migration runbook** — run the §4 migration against production (Neon
   branch → promote), reset the admin password, spot-verify.
5. **Cutover** — flip DNS; keep Django on `legacy.scholarhub.africa` (Railway)
   for 30 days as rollback; after validation, archive `apps/`, `templates/`,
   `scholarhub/` into `django-legacy/` and remove Railway services.
6. **Post-cutover checks** — sitemap parity, `?q=` search parity, JSON-LD
   validation (Rich Results / Schema validator), GA4 consent flow, cron logs,
   performance budget (LCP unchanged or better), 404/500 pages.
7. **CI/CD** — GitHub Actions: build → lint → typecheck → Vitest → deploy
   (Vercel Git integration); preview deployments per PR.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| SEO loss on cutover (URL changes, missing meta) | `trailingSlash: true`, full URL parity table, metadata audit per page before cutover, sitemap diff after |
| Password hashes don't migrate (PBKDF2 vs Auth.js) | One-time admin password reset in the cutover runbook (single user today) |
| FTS ranking differences | Exact port of weights/rank threshold; diff-test search results Django vs Next |
| Vercel function cold starts on directory | RSC + ISR; only interactive bits are client components |
| File-based consent store breaks on Vercel | Store swapped to Postgres in Phase 1 |
| Crawler exceeds cron/function limits | `maxDuration = 300` + incremental batch processing; Inngest escalation path |
| Celery → cron semantics (missed runs, retries) | Cron has no retries by design — digest is idempotent; add `last_run` guard in DB if needed |
| Rate limiting without Redis | Upstash Ratelimit (or `@vercel/functions`) with fail-closed default, same as today |

---

## 10. Build order & milestones

| Milestone | Deliverable | Effort |
|---|---|---|
| **M0** | Decisions (ORM=auth=DB=cron=tracker scope) — **locked 2026-08-11** | ✅ done |
| **M1** | Phase 1 — skeleton, DB connection, consent port, standards scaffolding | ✅ done |
| **M2** | Phase 2 — schema + migration SQL generated; migration toolkit built & locally tested; **apply on Neon pending owner run** (`npm run db:migrate:all`) | **~done** |
| **M3** | Phase 3 — queries + route handlers + tests | ✅ done |
| **M4** | Phase 4a — layout, home, directory, detail, by-country/by-field (SEO parity) | ✅ done |
| **M4b** | Phase 4b — marketing pages (about, faq, contact, privacy, thank-you, case studies), testimonials, homepage SearchBar | ✅ done |
| **M5** | Tracker + checklist (kanban, 24-item checklist, DRF-parity tracker API, multi-user isolation) | ✅ done |
| **M6** | Phase 5 — Auth.js (credentials + Google, JWT sessions, registration), Vercel Cron (digest via Resend REST, crawler slot) | ✅ done |
| **M7** | Deployment config — vercel.json crons, env matrix, CI workflow (web/ + Django jobs) | ✅ done |
| **M8** | Django retirement (archive → `django-legacy/`, remove Railway) | small |

> Suggested sequencing: ship **public directory first** (M1→M4a) because that's
> where all the SEO/AEO value lives; tracker + auth second; cron + ops last.

---

## 11. Decisions (locked — M0, answered by the project owner on 2026-08-11)

| # | Decision | Choice | Impact |
|---|---|---|---|
| 1 | ORM | **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`, `@neondatabase/serverless` driver) | Fastest cold starts; SQL-first schema in `web/src/db/schema.ts` (Phase 2) |
| 2 | Auth | **Auth.js (NextAuth v5)**, self-hosted, sessions in Postgres | Credentials for admin + **registration and Google OAuth in the first release** (multi-user tracker from day one — scope increase vs today's single admin) |
| 3 | DB cutover | **Neon branch → validate → promote** | Zero risk to live data; full rollback; Django stays live on Railway until cutover |
| 4 | Background jobs | **Vercel Cron + secure route handlers + Resend** | `/api/cron/digest` (Mon 05:00 UTC) + `/api/cron/crawl` (daily), guarded by `CRON_SECRET`; Inngest as escalation path only if the crawler outgrows function limits |
| 5 | Tracker scope | **Multi-user from day one** | Registration + Google OAuth; `applicant_profiles.user_id` becomes a required unique FK; per-user isolation enforced in queries + RLS (nice-to-have) |
| 6 | Admin/data editing | Django admin stays available during the transition on Railway; replacement decided after cutover (Neon Console / minimal custom admin / legacy subdomain) | **Open** — revisit in Phase 6 |

With the tracker going multi-user, `docs/SYSTEM_DESIGN.md` Phase 2 (registration,
OAuth, bookmarks, AI match scores, alerts) is pulled forward into this migration
for the auth + profile parts; bookmarks/alerts remain roadmap.


---

## 12. Cutover runbook (M8 — owner, from your machine)

1. **Apply the schema + data (M2):**
   ```bash
   cd web && npm install
   # If you ran db:migrate before the auth column was added, reset the new
   # tables first (they contain no production data yet):
   #   node scripts/drop-new-tables.mjs   (drops only the new Drizzle tables)
   npm run db:migrate && npm run db:migrate:data
   npm run db:verify        # expect ✅ Parity OK
   ```
2. **Deploy to Vercel** (`vercel` CLI or Git integration, root `web/`):
   set env vars from `web/.env.example` (DATABASE_URL pooled, AUTH_SECRET,
   AUTH_GOOGLE_ID/SECRET, CRON_SECRET, RESEND_API_KEY, DIGEST_EMAILS,
   DEFAULT_FROM_EMAIL, GA4_MEASUREMENT_ID, SITE_*).
3. **Verify on the preview/production URL:** home stats, directory filters +
   search suggestions, detail pages + JSON-LD, /api/v1/* responses match
   Django, login → tracker → checklist flow, cron digest dry-run (or real
   send), robots/sitemap/llms.txt, 404/500.
4. **Admin access:** sign in with the new registration flow, then reset the
   legacy admin's password (Django PBKDF2 hashes don't carry over).
5. **DNS cutover:** CNAME `scholarhub.africa` + `www` to the Vercel
   deployment (keep Cloudflare in front); keep Django on Railway at
   `legacy.scholarhub.africa` for 30 days as rollback.
6. **Retire Django:** after validation, move `apps/`, `templates/`,
   `scholarhub/`, `manage.py` into `django-legacy/`, remove Railway services,
   and archive this plan.
7. **CI:** commit `.github/workflows/ci.yml` manually (repo convention — the
   GitHub App token lacks workflows permission); it runs Next.js lint/typecheck/
   build/offline tests plus Django pytest until cutover.
