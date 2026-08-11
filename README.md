# 🎓 ScholarHub Africa

**A modern scholarship discovery and tracking platform for African students seeking fully-funded international master's opportunities.**

Every scholarship record is human-verified against official sources, scored 0–100 for profile fit, and tracked from research to award.

- **System design:** [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) (v1.0)
- **Stack:** Django 5 · Django REST Framework · Tailwind CSS · Alpine.js · PostgreSQL (Neon) · Celery · Railway · Cloudflare

---

## ✨ What's implemented (Phase 0 + Phase 1)

| Feature | Status |
|---|---|
| Scholarship directory - 45 verified opportunities, 23 countries, 18 fields | ✅ |
| Full-text search (`/api/v1/search/` + directory `?q=`) with Postgres `SearchVector` + SQLite fallback | ✅ |
| Filters - country, field, funding, eligibility, status, min score, deadline window | ✅ |
| Country & field grouping pages | ✅ |
| Detail pages with live deadline countdown, score badge, change history, JSON-LD, OG tags | ✅ |
| Django Admin - colour-coded badges, fieldsets, bulk actions, auto change-log | ✅ |
| Application tracker - kanban dashboard (Planning → Drafting → Submitted → Decision) | ✅ |
| 24-item document checklist with readiness progress | ✅ |
| Weekly Monday email digest (Celery beat + manual command) | ✅ |
| DRF API - `/api/v1/scholarships/`, `open_now/`, `top/`, `countries/`, `fields/`, `search/`, tracker CRUD | ✅ |
| Sitemap, structured data, SEO meta (server-rendered HTML) | ✅ |
| UX/SEO checklist: custom 404, hero CTA, breadcrumbs, sticky mobile CTA, About/team grid, FAQ accordion, contact + map + 24h promise, thank-you page, case study template, testimonials, robots.txt, OG/Twitter tags, GA4, JSON-LD, privacy policy | ✅ |
| Excel import command (`import_scholarships`) | ✅ |
| CI (GitHub Actions → pytest) | ✅ |
| Phase 2 - registration, OAuth, bookmarks, AI match scores, alerts | 🔜 Roadmap |

---

## 🧭 Pages

| URL | Page |
|---|---|
| `/` | Homepage - hero with above-the-fold CTA, testimonials, sticky mobile CTA |
| `/about/` | About us - story, stats, team photo grid |
| `/faq/` | 5-question Alpine.js accordion |
| `/contact/` | Contact form + 24h response promise + Google Maps embed & directions |
| `/thank-you/` | Post-submission confirmation with next steps |
| `/case-studies/` | Reusable case-study template (Background → Challenge → Solution → Results) |
| `/privacy/` | Privacy Policy |
| `/robots.txt` | robots.txt (disallows `/admin/`, `/api/`, `/accounts/`, `/tracker/`) |
| *any missing URL* | Custom branded 404 (JSON for `/api/` paths) |

SEO details (3 meta-description variations, alt-text guidance, GA4 placement, internal-linking review, dynamic title structure): see [`docs/seo-guide.md`](docs/seo-guide.md).

**Web standards enforcement** (SEO/AEO/Security/Performance - thelazydeveloper.org four-track checklist, with acceptance-criteria audit): see [`docs/standards-enforcement.md`](docs/standards-enforcement.md). Highlights: consent-gated GA4 (Reject → nothing loads), canonical + OG/Twitter on every page, Organization/WebSite/FAQPage/Article/MonetaryGrant JSON-LD, AI-crawler robots.txt + `llms.txt`, CSP + Permissions-Policy + rate limiting (fail-closed), WebP images, zero N+1 queries.

## ⚛️ Next.js app (migration target — `web/`)

The Django → serverless migration (see [`docs/MIGRATION_PLAN.md`](docs/MIGRATION_PLAN.md))
is building the new app in `web/` — **Next.js 15 (App Router) · React 19 ·
TypeScript · Tailwind v4 · Drizzle ORM · Neon**. The Django app stays live on
Railway until cutover.

```bash
cd web
cp .env.example .env.local   # add DATABASE_URL (Neon POOLED string)
npm install
npm run dev                  # http://localhost:3000
npm run build                # production build + lint + typecheck
npm run db:generate          # regenerate Drizzle migration SQL (web/drizzle/)
npm run db:migrate           # apply schema migrations to the DB
npm run db:migrate:data      # copy Django data into the new tables + verify
npm run db:verify            # read-only parity re-check (any time)
npm run db:test:local        # offline self-test of the data migration (pg-mem)
```

Status: **M1–M4a complete** — app skeleton, design-token parity, SEO/AEO
scaffolding, consent engine (banner + GCM v2 + TCF 2.3, Postgres-backed log),
consent-gated GA4, full Drizzle schema + migration toolkit (locally tested),
the Phase 3 query layer + `/api/v1/*` route handlers (DRF parity), and the
**public pages**: directory (URL-driven filters, sorting, pagination, live
search suggestions), detail (ISR + MonetaryGrant JSON-LD + change history +
related + live countdown), by-country/by-field, and the full homepage.
Offline test suite: `npm run db:test:local`, `npm run db:test:queries`.
To apply the data migration on Neon run `npm run db:migrate && npm run db:migrate:data`
from your own machine (see `docs/MIGRATION_PLAN.md` §4 runbook).

---

## 🛢️ Neon MCP (database tooling)

The repo ships a project-scoped MCP config (`.mcp.json`) pointing at the official
**Neon MCP server** (`https://mcp.neon.tech/mcp`, streamable HTTP) so coding agents
(Claude Code, Cursor, VS Code…) can manage the Neon project and run SQL directly.

**No secret is committed** - the config references `${NEON_API_KEY}` from the
environment (Track 3.4: secrets stay server-side):

```bash
# Create a key at console.neon.tech → Account settings → API keys, then:
export NEON_API_KEY=neon_...          # shell, or your agent's environment
```

Install / update:

```bash
npx add-mcp https://mcp.neon.tech/mcp -a claude-code -t http -h 'Authorization: Bearer ${NEON_API_KEY}' -y
```

> Note: the remote endpoint is not reachable from restricted sandboxes (e.g. this
> repo's CI sandbox blocks TLS to neon.tech) - the config works from any normal
> dev machine. An alternative stdio transport is `@neondatabase/mcp-server-neon`
> if you prefer a local process.

## 🚀 Quickstart (local)

```bash
# 1. Clone + virtual environment
git clone https://github.com/royokola/scholarhub-africa
cd scholarhub-africa
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install
pip install -r requirements.txt
npm install                       # Tailwind CSS compilation

# 3. Environment
cp .env.example .env              # edit if you want a PostgreSQL URL

# 4. Database + demo data
python manage.py migrate
python manage.py seed_demo        # 45 scholarships, demo user "roy"
python manage.py createsuperuser  # (optional - seed_demo already creates "roy")

# 5. Tailwind (separate terminal, re-run after template edits)
npm run watch:css

# 6. Run
python manage.py runserver
```

Open **http://localhost:8000** (site) and **http://localhost:8000/admin** (admin).

### Demo login (Phase 1 - private tracker)

`seed_demo` creates a superuser:

```
username: roy
email:    royokola3@gmail.com
password: change-me-roy-2026   (set via DEMO_PASSWORD in .env - change it!)
```

---

## 🗄️ Database

- **Local:** SQLite out of the box (`db.sqlite3`, gitignored).
- **Production:** Neon PostgreSQL - set `DATABASE_URL`; `settings/production.py` parses it with `sslmode=require` and `conn_max_age=600` (System Design §16.4).
- PostgreSQL unlocks `SearchVector` full-text search; SQLite automatically falls back to `icontains` (same code path in `apps/scholarships/search.py`).

```bash
python manage.py import_scholarships --file Roy_Okola_Scholarship_Database_Cycle1_v2.xlsx
```

Expected columns are documented in `apps/scholarships/management/commands/import_scholarships.py`.

## 📧 Weekly digest

```bash
python manage.py send_weekly_digest          # send now (console backend locally)
python manage.py send_weekly_digest --async  # dispatch to Celery
```

Production: Celery beat fires it every **Monday 05:00 UTC (08:00 EAT)**. Emails go through **Resend** when `RESEND_API_KEY` is set, otherwise Django's email backend. Recipients come from `DIGEST_EMAILS`.

## 🧪 Tests

```bash
python -m pytest          # 19 tests - models, search, filters, views, API, tracker
```

## 🚢 Deployment

Railway + Neon + Cloudflare per System Design §16:

- `railway.toml` - web (Gunicorn), worker (Celery), beat (Celery beat with `django_celery_beat`)
- `Procfile` - same roles
- `settings/production.py` - Neon DB, Whitenoise (or Cloudflare R2 static storage), secure cookies/HSTS, SSL redirect
- Cloudflare sits in front as CDN/DNS/proxy with cache rules for static assets

Set env vars on Railway from `.env.example`.

---

## 🗺️ Roadmap

- **Phase 1.5** - email alerts, data verification checks (Celery)
- **Phase 2** - user registration (email + Google OAuth), personalised profiles, AI match scores, bookmarks, shareable shortlists
- **Phase 3** - community submissions with moderation, PWA/mobile

---

## 🛡️ Consent Manager

The repo also contains a complete **GDPR & CCPA-compliant Cookie & Consent Management System** at [`consent-manager/`](consent-manager/README.md) - a Next.js 14 app with:

- Edge geolocation middleware (GDPR opt-in vs CCPA opt-out)
- `useConsent` hook with Google Consent Mode v2 + IAB TCF 2.3 TC-string encoding
- Auto-blocking script injection manager
- RBAC-protected admin command center: customization engine (colors/fonts/35-language texts), cookie scanner, policy generators, consent logs, Recharts analytics, CSV/PDF export

```bash
cd consent-manager && npm install && npm run dev   # http://localhost:3000
```

---

*Built for Roy Okola Otieno - and every African student after him. 🇰🇪 → 🌍*
