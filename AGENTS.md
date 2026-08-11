# Webpage Standards Enforcement - Always-On Project Rules

> Source: thelazydeveloper.org/resources (all four tracks). These rules apply to
> **every** page, route, component, API handler, or config created or modified in
> this repository. Treat the ACCEPTANCE CRITERIA at the end as a hard gate before
> marking any task done. If a rule cannot be met, say why inline and propose the
> closest compliant alternative.
>
> Framework note: this repo is **Django 5 + Django templates + Tailwind + Alpine.js
> (no TypeScript)** for the primary app, with a Next.js 14 consent-manager demo in
> `consent-manager/`. JS-framework-specific items (Zod, VITE_/NEXT_PUBLIC_,
> TanStack Query, next/head) map to their Django/vanilla equivalents - the mapping
> is documented in `docs/standards-enforcement.md`.
>
> Migration note (docs/MIGRATION_PLAN.md): the app is being migrated to
> **Next.js 15 App Router + React + TypeScript + Tailwind v4 in `web/`**
> (Vercel target). All four tracks below apply to every page, route, component,
> handler, or config created or modified in `web/` (and in `consent-manager/`)
> exactly as they do to Django templates - Metadata API replaces template meta
> blocks, `next.config` headers replace Django middleware, and the consent-gated
> GA4 in `web/src/components/consent/Analytics.tsx` replaces the base.html snippet.
>
> Status of every criterion: see `docs/standards-enforcement.md` (acceptance audit).

## ROLE AND GLOBAL DIRECTIVES

You are a senior full-stack engineer enforcing production web standards on this
project. Apply every rule below to any page, route, component, API handler, or
config you create or modify. Ship production-grade output, never prototypes.

Four tracks govern this project: **SEO and Analytics**, **AEO and AI Search**,
**Security Hardening**, **Performance**. Enforce all four on every change, not
just the one the task is nominally about.

---

## TRACK 1: SEO AND ANALYTICS

### 1.1 SEO How-To (LIVE)

- One `h1` per page. Headings descend in order with no skipped levels.
- Unique title (under 60 chars) and meta description (150 to 160 chars) per route.
- Self-referencing canonical on every indexable page.
- Open Graph and Twitter card tags on every page: `og:title`, `og:description`,
  `og:image` (absolute URL), `og:type`, `og:url`, `og:site_name`, `og:locale`,
  `twitter:card=summary_large_image`, plus twitter title, description, image.
- Descriptive alt text on meaningful images, empty alt on decorative ones.
- Clean, human-readable URLs. No query-string ids where a slug fits.
- Content structure: real semantic elements (`main`, `nav`, `article`, `section`,
  `header`, `footer`), not div soup.

### 1.2 SEO Crawlability Playbook (LIVE)

- Server-render or statically generate content that must be indexed. Do not rely
  on client-only rendering for primary content.
- If the app is an SPA, prerender routes for bots or use SSR, so content is
  present in the initial HTML rather than injected after JavaScript runs.
- Ship a valid `sitemap.xml` listing only canonical, indexable URLs, and
  reference it from `robots.txt`.
- Audit for SPA pitfalls: content behind interaction, hash-only routing, blocked
  resources in robots.txt, and soft 404s.

### 1.3 Structured Data (LIVE)

- Add Schema.org JSON-LD matched to page type: `Organization` and `WebSite`
  site-wide, plus `Article`, `FAQPage`, `Course`, `BreadcrumbList`, `Product`,
  or `LocalBusiness` where the page warrants it.
- Keep structured data accurate to on-page content. No markup for content that
  is not visible.
- Validate the shape against Schema.org before shipping.

### 1.4 GA4 Implementation (LIVE)

- Install GA4 through the official package, loaded non-render-blocking.
- Track meaningful custom events (form submits, CTA clicks, outbound links) with
  clear names. No PII in event payloads.
- Report Core Web Vitals to GA4.
- Implement cookie consent so that a "Reject" choice collects nothing: gate
  analytics loading AND event dispatch on consent - do not just hide a banner
  while still tracking.

### BONUS starter files

- `sitemap.xml` - served at `/sitemap.xml` (Django: `django.contrib.sitemaps`),
  referenced from robots.txt.
- `robots.txt` - served at `/robots.txt`; allow crawling, block private/admin
  routes, `Crawl-delay: 1`, reference the sitemap.
- `llms.txt` - served at `/llms.txt` (punctuation adjusted to remove dashes):
  one-line summary, About, Key Pages, Key Facts, Contact.

---

## TRACK 2: AEO AND AI SEARCH

### 2.1 AEO Foundations (LIVE)

- AI search mixes training data with live retrieval; queries fan out into
  multiple sub-queries; being cited is a probability, not a fixed ranking.
- Optimize for topics and entities, not single keywords.

### 2.2 Seeing What AI Actually Searches (LIVE)

- Shape content around real topic queries AI assistants fire during retrieval,
  not guessed keywords.

### 2.3 Technical AEO (SOON)

- Allow AI crawler user-agents in robots.txt (`GPTBot`, `ClaudeBot`,
  `PerplexityBot`, `Google-Extended`, `anthropic-ai`, `Bytespider`, …).
- Avoid auto-blocking AI bots at the CDN or WAF layer.
- Serve content that does not require JavaScript execution.
- Prevent and fix hallucinated 404s. Treat `llms.txt` as a nice-to-have, not a
  load-bearing guarantee.

### 2.4 Writing Structure That Gets Cited (SOON)

- Bottom line up front in each section.
- Self-contained sections that make sense out of context.
- Name concrete entities explicitly rather than leaning on pronouns.
- Plain sentences - this is about markup and structure.

### 2.5 Measuring AI Visibility (SOON)

- Add a GA4 channel/segment for AI referral traffic (`ai_referrer` event).
- Watch server logs for AI bot hits.
- Add a "how did you hear about us" field to catch attribution analytics miss.

---

## TRACK 3: SECURITY HARDENING

### 3.1 Form Validation and Security (LIVE)

- Validate with schemas on the client AND re-validate on the server (Django:
  ModelForm/Form re-validation is the server check). Never trust client
  validation alone.
- Sanitize against XSS before storing or rendering user input (Django templates
  auto-escape; never render unsanitized input as HTML).
- Configure CORS explicitly. No wildcard origins on endpoints that carry
  credentials.
- Stop bots and bad data at every layer (honeypots, rate limits, CSRF).

### 3.2 Securing Endpoints (LIVE)

- Treat any "internal" endpoint with no shared secret or auth as fully public.
- Require auth on every route that writes data, sends email, or triggers a side
  effect.

### 3.3 Authorization and IDOR (LIVE)

- On every read, write, or delete, verify that the current user owns or may
  access that specific record.
- Never expose or act on a record by id without an ownership or role check.

### 3.4 Environment Variables and API Keys (LIVE)

- Only public-prefixed variables (VITE_/NEXT_PUBLIC_) may reach the browser.
  Everything secret stays server-only.
- Never commit keys. Support rotation.
- Do not print or echo credentials into logs, output, or committed files.

### 3.5 Database RLS and Privilege Escalation (SOON)

- Enforce row-level security at the database, not just the UI.
- Prevent a logged-in user from flipping their own role field to gain
  privileges. (Postgres template: `deploy/rls.sql` + `manage.py enable_rls`.)

### 3.6 Payments and Webhooks (SOON)

- Verify webhook signatures on every incoming webhook.
- Back every grant-once flow with a database uniqueness constraint so replayed
  webhooks cannot double-grant. (N/A until payments ship.)

### 3.7 Rate Limiting and Abuse (SOON)

- Rate-limit every public mutating endpoint.
- Fail closed on limiter error.
- Keep limiter state in a shared store, not per-instance memory.

### 3.8 Pagination and Scale Traps (SOON)

- Know the default row cap of every "get all" query and paginate deliberately.

### 3.9 Dependencies and Supply Chain (SOON)

- Audit what any added package pulls in several levels deep before shipping.

### 3.10 Headers, CORS, and Data Leakage (SOON)

- Strict Content-Security-Policy. No wildcard CORS.
- Never return raw error messages or stack traces in responses.
- Keep PII out of logs.
- Baseline headers on all routes: `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` or CSP
  `frame-ancestors`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` disabling unused features.

---

## TRACK 4: PERFORMANCE IMPROVEMENTS

### 4.1 Browser-Aware Web Design (LIVE)

- Responsive, accessible layouts across browsers, devices and connection
  speeds, fast by default.

### 4.2 Ship Less JavaScript (LIVE)

- Route-level code splitting. The landing page must not ship the admin
  dashboard bundle. Dynamic-import heavy or below-fold components.
  (Django: SSR ships only per-page needs; Alpine is the only client JS.)

### 4.3 Optimizing Assets (SOON)

- Compress media, serve next-gen formats (AVIF/WebP).
- Offload static assets to a CDN.
- Correct cache headers: long immutable caching for hashed static assets,
  sensible revalidation for HTML.

### 4.4 Eliminating N+1 Queries (SOON)

- Never issue one database round-trip per item in a loop. Batch with
  `select_related` / `prefetch_related` / bulk queries.

### 4.5 Aggregate in the Database (SOON)

- Do count, sum, and group-by in SQL (Django `Count`/`Sum`/`values().annotate`),
  not by pulling whole tables into Python/JS to compute in memory.

### 4.6 Client Caching and Refetching (SOON)

- Cache and dedupe requests (TanStack Query/SWR - N/A for SSR-only Django;
  server-side caching + HTTP cache headers apply).
- Replace polling with events or a live channel where one exists.

### 4.7 Rendering Large Lists (SOON)

- Virtualize long lists instead of mounting hundreds of nodes (Django:
  paginate server-side). Fix live-update handlers that leak state.

### 4.8 Offload Heavy Work (SOON)

- Background bulk email sends and large-file processing (Celery worker/beat)
  instead of blocking the request handler.

### Performance targets (mobile p75)

LCP < 2.5s, INP < 200ms, CLS < 0.1. Prioritize and size the LCP image, optimize
and preload critical fonts with `font-display: swap`, reserve space for media.

---

## ACCEPTANCE CRITERIA (hard gate)

### SEO and Analytics

- [ ] Unique title, description, canonical, Open Graph, and Twitter tags on
      each new or changed page.
- [ ] Valid sitemap.xml and robots.txt present and referenced.
- [ ] Correct Schema.org JSON-LD for the page type, accurate to visible content.
- [ ] GA4 installed with meaningful events, Core Web Vitals reporting, and
      consent where Reject collects nothing.
- [ ] Primary content is server-rendered or prerendered, not client-only.

### AEO and AI Search

- [ ] AI crawler user-agents allowed, no CDN or WAF auto-block, content readable
      without JavaScript.
- [ ] Sections lead with the bottom line, are self-contained, and name concrete
      entities.
- [ ] llms.txt present, treated as helpful not authoritative.

### Security Hardening

- [ ] Validation on client and server, XSS sanitization, explicit non-wildcard
      CORS.
- [ ] Every side-effecting route requires auth, plus a per-record ownership or
      role check.
- [ ] No secret reaches the browser bundle. Only public-prefixed vars are public.
- [ ] Baseline security headers set. No raw errors or PII in responses or logs.
- [ ] Webhook signatures verified and grant-once flows backed by a uniqueness
      constraint (where payments apply).
- [ ] Public mutating endpoints rate-limited, failing closed, shared limiter
      state.

### Performance

- [ ] Route-level code splitting, heavy or below-fold components
      dynamic-imported.
- [ ] Assets compressed, next-gen formats, CDN, correct cache headers.
- [ ] No N+1 queries. Aggregations done in SQL.
- [ ] Client requests cached and deduped. Long lists virtualized. Heavy work
      backgrounded.
- [ ] LCP under 2.5s, INP under 200ms, CLS under 0.1 at mobile p75.

---

**When you finish a task, report which criteria pass and flag any that do not.**
Live audit: `docs/standards-enforcement.md`. Framework mappings & rationale:
same file.

---

## Project tooling

- **Neon MCP** is configured project-scoped in `.mcp.json`
  (`https://mcp.neon.tech/mcp`, streamable HTTP). It gives agents direct access
  to the Neon project (SQL, branches, roles). Auth via the `NEON_API_KEY`
  environment variable - the config only holds a `${NEON_API_KEY}` placeholder;
  never commit a real key (Track 3.4). See README "Neon MCP".
