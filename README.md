<!-- header:start -->
<div align="center">

# ScholarHub Africa

**ScholarHub Africa: verified, fit-scored scholarship listings for African students seeking fully funded international master's study, with an application tracker, document checklist and weekly digest.**

[![Live: scholarhub-africa.rauell.workers.dev](https://img.shields.io/badge/Live-scholarhub--africa.rauell.workers.dev-0d9488?style=for-the-badge&logo=cloudflare&logoColor=white)](https://scholarhub-africa.rauell.workers.dev) ![Status: live](https://img.shields.io/badge/Status-Live-2ea44f?style=for-the-badge) ![Public repository](https://img.shields.io/badge/Repo-Public-555555?style=for-the-badge&logo=github)

![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white) ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white) ![Drizzle](https://img.shields.io/badge/Drizzle-c5f74f?style=flat-square&logo=drizzle&logoColor=white) ![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-00e599?style=flat-square&logo=postgresql&logoColor=white) ![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-f38020?style=flat-square&logo=cloudflare&logoColor=white)

[Live site](https://scholarhub-africa.rauell.workers.dev) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Code of conduct](CODE_OF_CONDUCT.md)

</div>

---
<!-- header:end -->

**A scholarship discovery and tracking platform for African students seeking fully-funded international master's opportunities.**

Every scholarship record is human-verified against official sources, scored 0-100 for profile fit, and tracked from research to award.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Drizzle ORM · Neon (PostgreSQL) · Auth.js · Inngest · Resend · Cloudflare Workers

---

## ✨ Features

| Feature | Status |
|---|---|
| Scholarship directory - verified opportunities, 23+ countries, 18 fields | ✅ |
| Full-text search (PostgreSQL `tsvector` GIN index) with live suggestions | ✅ |
| Filters - country, field, funding, eligibility, status, min score, deadline window | ✅ |
| Country & field grouping pages | ✅ |
| Detail pages with live deadline countdown, score badge, change history, JSON-LD, OG tags | ✅ |
| Application tracker - kanban (Researching → Drafting → Submitted → Decision) | ✅ |
| 24-item document checklist with readiness progress | ✅ |
| Weekly Monday email digest (cron-job.org + Resend) | ✅ |
| REST API - `/api/v1/scholarships/`, `open_now/`, `top/`, `countries/`, `fields/`, `search/`, tracker CRUD | ✅ |
| Auth - registration, Google OAuth, JWT sessions (Auth.js) | ✅ |
| AI-powered CSV importer - NVIDIA Llama 3.3-70B via Inngest background jobs | ✅ |
| GDPR consent manager - GCM v2 + TCF 2.3, Postgres-backed log, consent-gated GA4 | ✅ |
| Sitemap, robots.txt, JSON-LD, OG/Twitter tags, full SEO scaffolding | ✅ |
| Admin dashboard - CSV upload management, resync, delete | ✅ |

---

## 🚀 Local development

```bash
cd web
cp .env.example .env.local   # fill in DATABASE_URL (Neon pooled), AUTH_SECRET, etc.
npm install
npm run dev                  # http://localhost:3000
```

### Database

```bash
npm run db:generate    # regenerate Drizzle migration SQL (web/drizzle/)
npm run db:migrate     # apply schema migrations to Neon
npm run db:studio      # Drizzle Studio GUI
```

### Tests

```bash
npm run typecheck      # TypeScript check
npm run lint           # ESLint
npm run db:test:local  # offline self-test of the data migration (pg-mem)
npm run db:test:queries
```

---

## 🚢 Deploy (Cloudflare Workers)

The app lives in `web/` and runs on Cloudflare Workers through the OpenNext adapter (`web/open-next.config.ts`, `web/wrangler.jsonc`). `.github/workflows/deploy-web.yml` builds and deploys it on every push to `main`; `.github/workflows/deploy-consent-manager.yml` deploys the consent manager when `consent-manager/` changes.

Runtime variables are Worker secrets (from `web/.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon pooled connection string |
| `AUTH_SECRET` | Auth.js session secret |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth |
| `CRON_SECRET` | Secures `/api/cron/*` endpoints |
| `RESEND_API_KEY` | Transactional email |
| `DIGEST_EMAILS` | Comma-separated digest recipients |
| `DEFAULT_FROM_EMAIL` | Sender address |
| `NVIDIA_API_KEY` | AI CSV parser (NVIDIA NIM) |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Background job queue |
| `GA4_MEASUREMENT_ID` | Analytics (optional) |

Scheduled jobs are called by cron-job.org with the header `Authorization: Bearer <CRON_SECRET>`:
- `GET /api/cron/digest`: Monday 05:00 UTC weekly digest
- `GET /api/cron/crawl`: daily 03:00 UTC crawl
- `GET /api/cron/close-expired`: daily, closes scholarships whose deadline has passed

---

## 🗂️ Project structure

```
web/                    Next.js app (Cloudflare Workers deployment target)
├── src/
│   ├── app/            App Router pages & API routes
│   ├── db/             Drizzle schema + database client
│   ├── inngest/        Background job functions (AI CSV processor)
│   ├── lib/            Shared utilities, consent, email
│   ├── components/     UI components
│   └── types/          Shared TypeScript types
├── drizzle/            Generated SQL migrations
├── scripts/            Data migration + verification scripts
└── wrangler.jsonc      Cloudflare Worker config

consent-manager/        Standalone GDPR consent manager (Next.js)
docs/                   System design, migration plan, SEO guide
```

---

## 🛢️ Neon MCP

The repo ships a project-scoped MCP config (`.mcp.json`) pointing at the Neon MCP server so coding agents (Claude Code, Cursor, VS Code…) can manage the Neon project and run SQL directly.

```bash
export NEON_API_KEY=neon_...   # from console.neon.tech → Account settings → API keys
```

---

*Built for Roy Okola Otieno - and every African student after him. 🇰🇪 → 🌍*

## Project information

| | |
|---|---|
| Live site | https://scholarhub-africa.rauell.workers.dev |
| Hosting | Cloudflare Workers |
| Default branch | `main` |
| Repository | Public |

### Stack

- Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 (in `web/`)
- Drizzle ORM with Neon PostgreSQL
- Auth.js (credentials and Google sign-in)
- Inngest background jobs, Resend email, Upstash rate limiting, Sentry
- A separate consent manager app in `consent-manager/`
- Vitest for tests

### Deployment

Production runs on Cloudflare Workers at https://scholarhub-africa.rauell.workers.dev. `.github/workflows/deploy-web.yml` and `.github/workflows/deploy-consent-manager.yml` build and deploy on every push to `main`, using the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets. Public build-time values are repository variables; runtime secrets are Worker secrets.

### Contributing and security

- How to set up, test and submit changes: [CONTRIBUTING.md](CONTRIBUTING.md)
- How to report a vulnerability: [SECURITY.md](SECURITY.md)
- Expected behaviour in project spaces: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

### Licence

No open-source licence has been granted. The code, content and brand assets belong to the project owner and all rights are reserved. Ask the owner before reusing any part of this repository.
