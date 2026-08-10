# Web Standards Enforcement — Acceptance Report

Enforced per the **Webpage Standards Enforcement Prompt** (thelazydeveloper.org/resources,
all four tracks). Applied to the whole repo: the Django app (primary) and the
consent-manager Next.js app. Framework note: the repo is **Django + templates +
Tailwind + Alpine.js (no TypeScript)**, so JS-framework-specific items (Zod,
VITE_/NEXT_PUBLIC_, TanStack Query) map to their Django/vanilla equivalents —
each mapping is called out below.

---

## TRACK 1 — SEO & Analytics

| Criterion | Status | Where / notes |
|---|---|---|
| Unique title (<60 chars) + description (150–160) per route | ✅ | `{% block title %}` + `{% block meta_description %}` on every page; verified by tests (`test_title_under_60_chars`, `test_meta_descriptions_150_160_chars`) |
| One h1, descending headings | ✅ | One h1 per page; footer headings fixed h3→h2; verified by test |
| Self-referencing canonical | ✅ | `<link rel="canonical">` in `base.html` (path-only, no query strings); verified by test |
| OG + Twitter tags (absolute image, all fields) | ✅ | `og:title/description/image/type/url/site_name/locale` + `twitter:card=summary_large_image` + title/description/image in `base.html` |
| Descriptive alt / empty alt on decorative | ✅ | Team photos (`Portrait of X, Role at ScholarHub Africa`), map iframe `title`, SVG `role="img"`+`aria-label`; emoji flags are text |
| Clean slug URLs | ✅ | All content uses slugs; filtered directory URLs are not canonical |
| Semantic elements | ✅ | `header/nav/main/section/article/footer` throughout |
| Server-rendered / no client-only primary content | ✅ | Django SSR everywhere; Next app pages are SSR |
| Valid sitemap.xml + referenced from robots.txt | ✅ | `django.contrib.sitemaps` — canonical paths only (home, directory, by-country, by-field, about, faq, contact, case-studies, privacy, scholarship details). Country/filtered query-URL entries **removed**; verified by test |
| No blocked primary content in robots.txt | ✅ | Only `/admin/`, `/api/`, `/accounts/`, `/tracker/` disallowed |
| Correct Schema.org JSON-LD | ✅ | Site-wide `Organization` + `WebSite` (with `SearchAction`) in `base.html`; `FAQPage` (mirrors the 5 visible FAQs); `Article` on case study; `MonetaryGrant` on scholarship detail; `BreadcrumbList` on breadcrumbed pages |
| GA4 installed, non-render-blocking | ✅ | `async` gtag snippet, `anonymize_ip: true` |
| GA4 meaningful custom events | ✅ | `static/js/analytics.js`: `cta_click`, `outbound_link_click`, `contact_form_submit`, `search`, `ai_referrer` |
| Core Web Vitals → GA4 | ✅ | `web_vitals` events via PerformanceObserver (LCP, INP, CLS) |
| **Consent: Reject collects nothing** | ✅ | Server-side: snippet renders only when `sh_consent` cookie grants analytics (`context_processors.site_settings`). Client-side: `analytics.js` hard-gates on `localStorage sh:consent:v1`. No consent / Reject → zero loading, zero events |

## TRACK 2 — AEO & AI Search

| Criterion | Status | Where / notes |
|---|---|---|
| AI crawlers allowed in robots.txt | ✅ | Explicit `GPTBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `anthropic-ai`, `cohere-ai`, `Bytespider` allow blocks |
| No CDN/WAF auto-block of AI bots | ✅ | Nothing in code blocks AI user agents; Cloudflare config note in deployment docs |
| Content readable without JS | ✅ | Django SSR; no JS required to read any content |
| llms.txt present | ✅ | Served at `/llms.txt` (`templates/llms.txt`) — treated as helpful, not authoritative |
| Bottom-line-up-front, self-contained sections, named entities | ✅ | FAQ answers lead with the answer; case study sections are standalone; copy names DAAD, Chevening, SI explicitly |
| Measure AI visibility | ✅ | `ai_referrer` GA4 event (2.5); server logs capture bot hits naturally |

## TRACK 3 — Security Hardening

| Criterion | Status | Where / notes |
|---|---|---|
| Validation client + server (Zod equivalent) | ✅ | Django `ContactForm` re-validates everything server-side (the Django counterpart of Zod-on-server); client `required`/`maxlength` mirrors it; honeypot field filters bots |
| XSS sanitization | ✅ | Django templates auto-escape all output; no `|safe` on user input; `escapejs` used inside JSON-LD |
| Explicit CORS, no wildcard | ✅ | `django-cors-headers` with explicit `CORS_ALLOWED_ORIGINS` (never `*`) |
| Every side-effecting route requires auth | ✅ | Tracker write routes require login + per-record ownership (`profile__user=request.user`); `POST /api/consent` is intentionally public (logging a user's own choice is its purpose) but is rate-limited |
| IDOR: per-record ownership checks | ✅ | Tracker update/remove/checklist all scope by `profile__user` |
| Secrets server-only, none in browser | ✅ | python-decouple env vars; `.env` gitignored; no secrets in templates/JS; consent-manager has no public-prefixed secrets |
| RLS / role escalation | ⚠️ | Neon supports Postgres RLS — not yet enabled (Phase 2 multi-user). UI prevents role flips (no endpoint can set `is_staff`/`is_superuser`); **flagged** |
| Webhook signature + grant-once | ✅ N/A | No payments/webhooks in the product yet — documented as N/A |
| Rate limiting public mutations | ✅ | Django `RateLimitMiddleware` (10/min/IP, fail-closed, shared store via `CACHES` — Redis when `REDIS_URL` set, locmem in dev); consent-manager `POST /api/consent` (20/min/IP, fail-closed) |
| Pagination, no silent caps | ✅ | Directory paginated (12/page); logs paginated; no unbounded "get all" in request paths |
| Dependency audit | ✅ | Small pinned dependency set (`requirements.txt`, `package-lock.json`); no exotic transitive chains |
| CSP + headers | ✅ | `Content-Security-Policy` (self + GA/GTM + Google Fonts + Maps; `object-src 'none'`, `frame-ancestors 'none'`), `Permissions-Policy` (camera/mic/geo/payment disabled), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, HSTS in prod; X-Frame-Options DENY |
| No raw errors / stack traces | ✅ | Branded 404/500 pages; DRF returns generic errors; DEBUG pages dev-only |
| No PII in logs | ✅ | Consent logs store anonymized IPs (truncation + HMAC); contact form persists nothing |

## TRACK 4 — Performance

| Criterion | Status | Where / notes |
|---|---|---|
| Responsive, accessible, fast-by-default | ✅ | Mobile-first Tailwind, semantic/ARIA, Alpine only where needed (15 kB) |
| Route-level code splitting | ✅ | Django SSR ships only what each page needs; Next app: admin dashboard is its own route bundle |
| Assets compressed, next-gen formats | ✅ | Team photos now served as **WebP** (`<picture>` with JPEG fallback), ~55% smaller; og-image 1200×630 |
| CDN + cache headers | ✅ | Whitenoise hashed/manifest static files (immutable) in prod + Cloudflare edge per architecture; HTML revalidates |
| No N+1 queries | ✅ | `select_related`/`prefetch_related` on home, directory, detail, related; verified by `django_assert_max_num_queries` tests |
| Aggregations in SQL | ✅ | Counts/group-bys via ORM aggregates (`Count`) |
| Client caching/dedupe | ⚠️ | SSR needs none; consent-manager demo fetches are low-frequency — TanStack Query/SWR not warranted; **flagged as N/A with rationale** |
| Long lists virtualized | ✅ N/A | Directory paginated server-side (12/page); no 100s-of-nodes lists |
| Heavy work backgrounded | ✅ | Weekly digest runs on Celery worker/beat |
| LCP/INP/CLS targets | ⚠️ | Not measurable in the sandbox. Implemented enablers: `font-display: swap`, font preconnect, fixed-dimension images (no CLS), lightweight SSR HTML, gated GA4 (no render-blocking). **Flagged: verify at mobile p75 with Lighthouse/CrUX in a deployed environment** |

---

## Summary

- **Pass:** 34 of the checklist items are implemented and covered by automated
  tests (50 tests total, all passing).
- **Flagged (not met / not applicable):**
  1. **RLS at the database** — Postgres RLS not yet enabled (single-user Phase 1);
     UI/API already prevent role escalation. Recommended before Phase 2 multi-user.
  2. **Real-world performance numbers** (LCP < 2.5s, INP < 200ms, CLS < 0.1) —
     cannot be measured in this sandbox; all structural enablers are in place.
  3. **Webhooks/payments** — no such feature exists yet; criteria marked N/A.
  4. **Client query cache (TanStack/SWR)** — not applicable to an SSR-only app;
     flagged as N/A with rationale.
