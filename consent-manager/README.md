# 🛡️ ScholarHub Consent Manager

A comprehensive **GDPR & CCPA-compliant Cookie & Consent Management System** with
strict separation of concerns between the **End-User Environment** (cookie banner
& preferences) and the **Admin Environment** (command center).

**Stack:** Next.js 14 (App Router) · TypeScript · Edge Middleware · Recharts · zero
third-party consent dependencies (own GCM v2 + IAB TCF 2.3 encoder).

```
consent-manager/
├── middleware.ts                  # Edge geolocation (GDPR vs CCPA) - stamps region cookies
├── package.json / tsconfig.json / next.config.mjs
├── .env.example
└── src/
    ├── middleware.ts              # Edge middleware (src layout)
    ├── lib/
    │   ├── consent/               # ══ END-USER DOMAIN LIBRARY ══
    │   │   ├── types.ts           #   ConsentState, ConsentRegion, ConsentConfig…
    │   │   ├── regions.ts         #   GDPR/CCPA country tables + default postures
    │   │   ├── categories.ts      #   Cookie categories ↔ GCM keys ↔ TCF purposes
    │   │   ├── config.ts          #   Default banner configuration object
    │   │   ├── i18n.ts            #   35-language dictionary (English default)
    │   │   ├── storage.ts         #   localStorage + HTTP-only cookie persistence
    │   │   ├── consent-string.ts  #   GCM v2 string + IAB TCF 2.3 bit-packed encoder
    │   │   ├── gcm.ts             #   dataLayer/gtag Consent Mode v2 pushes
    │   │   ├── script-manager.ts  #   Auto-blocking script injection manager
    │   │   └── geo.ts             #   Client-side region resolution
    │   ├── hooks/
    │   │   ├── useConsent.ts      #   ══ THE CORE HOOK ══ (auto-block + GCM v2 + TCF)
    │   │   └── useAdminSession.ts
    │   ├── components/
    │   │   ├── end-user/          # ══ END-USER ENVIRONMENT UI ══
    │   │   │   ├── ConsentProvider.tsx
    │   │   │   ├── CookieBanner.tsx        # region-aware banner (opt-in / opt-out)
    │   │   │   ├── PreferencesModal.tsx    # category toggles (Necessary locked ON)
    │   │   │   └── FloatingShield.tsx      # reopen preferences anytime
    │   │   └── admin/             # ══ ADMIN ENVIRONMENT UI (RBAC) ══
    │   │       ├── AdminDashboard.tsx      # tabbed command center
    │   │       ├── CustomizationEngine.tsx # colors, fonts, 35-language text editor
    │   │       ├── CookieScanner.tsx       # automatic cookie & tracker scan
    │   │       ├── PolicyGenerator.tsx     # Privacy / Cookie / Terms generators
    │   │       ├── ConsentLogsTable.tsx    # audit table (anonymized IP, geo, string, version)
    │   │       ├── AnalyticsCharts.tsx     # Recharts opt-in rates
    │   │       └── ExportButtons.tsx       # CSV + printable PDF report
    │   ├── lib/server/
    │   │   ├── store.ts           #   JSONL consent logs + config + policy persistence
    │   │   ├── rbac.ts            #   role === 'ADMIN' gate (pages + APIs)
    │   │   └── analytics.ts       #   opt-in rate computations
    │   ├── lib/scanner/scanner.ts #   tracker classification + headless hook
    │   ├── lib/policy/generators.ts # legal document templates
    │   └── app/
    │       ├── layout.tsx                 # loads admin config server-side
    │       ├── page.tsx                   # demo end-user page with gated scripts
    │       ├── globals.css
    │       ├── admin/
    │       │   ├── login/page.tsx         # admin sign-in
    │       │   └── consent-manager/page.tsx  # PROTECTED route (server-side RBAC)
    │       └── api/
    │           ├── consent/route.ts       # POST - record consent (public)
    │           ├── consent/region/route.ts# GET  - region resolution (public)
    │           └── admin/
    │               ├── login/route.ts     # POST - set ADMIN session cookie
    │               ├── logout/route.ts
    │               ├── logs/route.ts      # GET  - audit log (RBAC)
    │               ├── analytics/route.ts # GET  - chart data (RBAC)
    │               ├── export/csv/route.ts# GET  - audit CSV (RBAC)
    │               ├── export/report/route.ts # GET - printable report (RBAC)
    │               ├── scan/route.ts      # POST - run scanner (RBAC)
    │               └── config/route.ts    # GET/PUT - customization (RBAC)
```

---

## Architecture: two strictly separated environments

```
┌─────────────────────────── END-USER ENVIRONMENT ───────────────────────────┐
│  Browser                                                        Edge        │
│  ┌──────────────────────────────┐        ┌──────────────────────────────┐  │
│  │ useConsent() hook            │        │ middleware.ts                │  │
│  │  • region from sh_region     │◄───────│  • geo (Vercel/Cloudflare)   │  │
│  │  • GCM v2 default + update   │        │  • GDPR→opt-in, CCPA→opt-out │  │
│  │  • TCF 2.3 TC string         │        │  • sh_region (httpOnly too)  │  │
│  │  • ScriptManager auto-block  │        └──────────────┬───────────────┘  │
│  │  • localStorage persistence  │                       │ POST /api/consent│
│  └──────────────┬───────────────┘                       ▼                  │
│                 │                              ┌──────────────────┐        │
│  CookieBanner / PreferencesModal / Shield      │ consent log (JSONL│       │
│  (i18n × 35, config-driven theming)            │ + httpOnly cookie │      │
│                                                └──────────────────┘        │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────── ADMIN ENVIRONMENT ─────────────────────────────┐
│  /admin/consent-manager - server-side redirect unless role === 'ADMIN'     │
│  Every /api/admin/* route independently enforces RBAC (403 otherwise).     │
│  Customization Engine · Cookie Scanner · Policy Generators ·               │
│  Consent Logs (anonymized IP, geo, string, version) · Recharts analytics · │
│  CSV / PDF export                                                          │
└────────────────────────────────────────────────────────────────────────────┘
```

## Quickstart

```bash
cd consent-manager
npm install
cp .env.example .env.local        # set ADMIN_PASSWORD, ADMIN_SESSION_TOKEN
npm run dev                       # → http://localhost:3000
```

- **End-user demo:** http://localhost:3000 - the banner appears only when no
  consent is stored. The page shows two consent-gated scripts (declared as
  `type="text/plain"`) that stay blocked until you grant their category.
- **Admin:** http://localhost:3000/admin/consent-manager
  (default login `admin` / `change-me-in-production`, override via env).

## Compliance behaviour

| Region | Default posture | Banner behaviour |
|---|---|---|
| **GDPR** (EU-27 + EEA + UK) | Strict opt-in - all non-essential cookies **OFF** | Accept all · Reject non-essential · Manage |
| **CCPA** (US) | Opt-out - categories ON until refused | "Do Not Sell or Share My Personal Information" link + opt-out |
| Unregulated | Opt-out baseline | Same as CCPA |

- **Auto-blocking:** scripts carrying `data-consent-category` (or registered via
  the admin config: GTM, Facebook Pixel, …) are never executed before consent.
  They are captured at boot and injected only when their category becomes `true`.
- **Google Consent Mode v2:** `gtag('consent','default',…)` fires before any tag
  with the region's posture; `gtag('consent','update',…)` fires on every choice.
- **IAB TCF 2.3:** bit-packed TC string (core + vendor segments) generated for
  GDPR users with a round-trip self-test; CCPA users get no TC string.
- **Logging:** anonymized IP (truncation + HMAC fingerprint), timestamp,
  geolocation, consent string, state, version → exportable CSV / printable report.

## API reference

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | `/api/consent` | public | Record consent; sets HTTP-only `sh_consent` |
| GET | `/api/consent/region` | public | Region for the client hook |
| POST | `/api/admin/login` · `/logout` | - | Admin session (role ADMIN) |
| GET | `/api/admin/logs` | ADMIN | Audit log (page, page_size, region, accepted, from, to) |
| GET | `/api/admin/analytics?days=` | ADMIN | Opt-in rate series |
| GET | `/api/admin/export/csv` | ADMIN | Audit CSV download |
| GET | `/api/admin/export/report` | ADMIN | Printable compliance report |
| POST | `/api/admin/scan` | ADMIN | Automatic cookie/tracker scan `{url}` |
| GET/PUT | `/api/admin/config` | ADMIN | Banner customization (colors, fonts, 35-language texts) |

## Production swap notes

- **Auth:** replace the demo login with NextAuth / your IdP - keep the
  `isAdminSession()` / `isAdminRequest()` gates.
- **Storage:** swap `lib/server/store.ts` (JSONL) for Postgres/Redis.
- **Headless scan:** point `HEADLESS_SCANNER_URL` at a Puppeteer/Playwright
  worker for JS-executed cookie enumeration.
- **TCF:** the bundled encoder is wire-compatible and self-tested; you can swap
  in `@iabtcf/cmpapi` if you prefer the official library, and register a real
  CMP id with IAB Europe.
- **Legal:** generated policies are a starting point - have counsel review.

---

*Part of the ScholarHub Africa platform (repo root: Django app + this consent layer).*
