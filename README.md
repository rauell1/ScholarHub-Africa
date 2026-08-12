# 🎓 ScholarHub Africa

**A scholarship discovery and tracking platform for African students seeking fully-funded international master's opportunities.**

Every scholarship record is human-verified against official sources, scored 0–100 for profile fit, and tracked from research to award.

- **Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Drizzle ORM · Neon (PostgreSQL) · Auth.js · Inngest · Resend · Vercel

---

## ✨ Features

| Feature | Status |
|---|---|
| Scholarship directory — verified opportunities, 23+ countries, 18 fields | ✅ |
| Full-text search (PostgreSQL `tsvector` GIN index) with live suggestions | ✅ |
| Filters — country, field, funding, eligibility, status, min score, deadline window | ✅ |
| Country & field grouping pages | ✅ |
| Detail pages with live deadline countdown, score badge, change history, JSON-LD, OG tags | ✅ |
| Application tracker — kanban (Researching → Drafting → Submitted → Decision) | ✅ |
| 24-item document checklist with readiness progress | ✅ |
| Weekly Monday email digest (Vercel Cron + Resend) | ✅ |
| REST API — `/api/v1/scholarships/`, `open_now/`, `top/`, `countries/`, `fields/`, `search/`, tracker CRUD | ✅ |
| Auth — registration, Google OAuth, JWT sessions (Auth.js) | ✅ |
| AI-powered CSV importer — NVIDIA Llama 3.3-70B via Inngest background jobs | ✅ |
| GDPR consent manager — GCM v2 + TCF 2.3, Postgres-backed log, consent-gated GA4 | ✅ |
| Sitemap, robots.txt, JSON-LD, OG/Twitter tags, full SEO scaffolding | ✅ |
| Admin dashboard — CSV upload management, resync, delete | ✅ |

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

## 🚢 Deploy (Vercel)

The app lives in `web/`. Set the **Root Directory** to `web/` in the Vercel dashboard.

Required environment variables (from `web/.env.example`):

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

Crons are defined in `web/vercel.json`:
- `0 5 * * 1` — Monday 05:00 UTC weekly digest
- `0 3 * * *` — Daily 03:00 UTC crawl slot

---

## 🗂️ Project structure

```
web/                    Next.js app (Vercel deployment target)
├── src/
│   ├── app/            App Router pages & API routes
│   ├── db/             Drizzle schema + database client
│   ├── inngest/        Background job functions (AI CSV processor)
│   ├── lib/            Shared utilities, consent, email
│   ├── components/     UI components
│   └── types/          Shared TypeScript types
├── drizzle/            Generated SQL migrations
├── scripts/            Data migration + verification scripts
└── vercel.json         Vercel Cron config

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

*Built for Roy Okola Otieno — and every African student after him. 🇰🇪 → 🌍*
