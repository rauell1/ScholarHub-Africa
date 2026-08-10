# ScholarHub Africa - SEO & UX Implementation Guide

Everything from the "UX & Interface" and "SEO & Technical" checklists, implemented
in the original framework (**Django 5 + Django templates + Tailwind + Alpine.js -
no TypeScript**).

---

## 1 · Custom 404 page
`templates/404.html` (wired via `handler404` in `scholarhub/urls.py`).

- Friendly "Oops - this page wandered off" headline + `Error 404` eyebrow
- Engaging illustration placeholder (inline SVG: a graduation cap lost in a magnifying glass)
- **Back to homepage** button + secondary CTA to the directory
- Search bar + popular-shortcut links (by country / by field / FAQ / contact) for recovery

## 2 · CTA above the fold
`templates/scholarships/home.html` hero:

- Compelling headline + subheadline
- Two prominent CTAs - **"Browse 45+ scholarships"** (teal, primary) and **"Explore by country"** (outline) - placed directly under the headline with reduced mobile padding, so they're visible without scrolling on both desktop and mobile.
- Search bar + example-search links underneath.

## 3 · Internal linking (review of homepage content)
Reviewed the homepage copy ("Open right now", "Browse by country", "Browse by field",
"How it works", stats strip). Five natural internal linking opportunities, all live:

1. **Hero headline → Directory** - the main CTA links to `/scholarships/`.
2. **"Open right now" section → status-filtered directory** - "View all" links to `/scholarships/?status=open_now` (already present, kept).
3. **Example-search links → filtered directory** - "Try DAAD / Germany / Water / Public Health" now link to real `?q=` and `?country=` results.
4. **"How it works" → Case study** - new link to `/case-studies/` ("See how one student landed DAAD EPOS").
5. **Detail pages → Related scholarships** - every scholarship page now links 3 related programmes sharing a field or country (`apps/scholarships/views.py#detail`), which also spreads link equity between deep pages.

## 4 · Thank You page
`templates/pages/thank_you.html` at `/thank-you/` - used after the contact form.

- Confirmation message (personalised with the submitter's name)
- "While you wait" next-steps card with links back to the directory, by-field, by-country and FAQ
- Buttons back to scholarships / homepage

## 5 · Breadcrumbs (reusable)
- Template tag: `{% load pages_tags %}{% breadcrumbs items=... current=... %}` in `apps/pages/templatetags/pages_tags.py`
- Component: `templates/components/breadcrumbs.html` - semantic `<nav aria-label="Breadcrumb">` + **BreadcrumbList JSON-LD**
- Used on: directory, scholarship detail, about, FAQ, contact, thank-you, case study, privacy

## 6 · Sticky mobile CTA
- Component: `templates/components/sticky_cta.html` (fixed bottom bar: "Find my scholarship" + country shortcut)
- CSS in `static/css/main.css`: fixed to viewport bottom, `z-index: 40`, hidden ≥768px, safe-area padding, and `body.has-sticky-cta { padding-bottom: 76px }` so content is never covered
- Enabled on home, directory and about via `{% block body_class %}has-sticky-cta{% endblock %}`

## 7 · About Us / team grid
`templates/pages/about.html` at `/about/` - story + stats + 4-column team grid with
photo, name, job title and bio. Placeholder headshots live in `static/img/team/`
(swap with real photos; see alt-text section below).

## 8 · Case study template
`templates/pages/case_study.html` at `/case-studies/` - structured, reusable template
driven by a `study` dict: **Client Background → The Challenge → The Solution →
Quantifiable Results** (stats grid) + pull-quote + next-steps CTA. Demo study:
DAAD EPOS landing (14 tracked → 3 submitted → 2 interviews → 1 offer).

## 9 · FAQ accordion (5 questions)
`templates/pages/faq.html` at `/faq/` - Alpine.js accordion, first item open,
`aria-expanded` states. Covers: free?, verification, who can use, what the score
means, how the tracker helps.

## 10 · Response time promise
`templates/pages/contact.html` - green "We'll get back to you within 24 hours" box
(Mon–Fri, 9:00–18:00 EAT) directly above the contact form.

## 11 · Maps + directions
`templates/pages/contact.html` - Google Maps embed iframe (`q=Westlands, Nairobi&output=embed`,
no API key needed, `loading="lazy"`, `title` + `referrerpolicy` set) + text directions
by car, matatu/bus, and walking.

## 12 · Testimonials
`templates/components/testimonials.html` - 3 review cards with star ratings,
placeholder review text, reviewer name/location, and initials-avatar photo
placeholders. Included on the homepage.

## 13 · robots.txt
`templates/robots.txt` served at `/robots.txt` (view in `apps/pages/views.py`):

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /accounts/
Disallow: /tracker/
Sitemap: https://<host>/sitemap.xml
```

## 14 · Unique page titles (dynamic structure)
`templates/base.html`:

```html
<title>{% block title %}ScholarHub Africa{% endblock %}</title>
```

Every page overrides the block with **"Page name - ScholarHub Africa"**, e.g.
`About us - ScholarHub Africa`, `Search: DAAD - Scholarships - ScholarHub Africa`,
`DAAD EPOS - Renewable Energy Management (REM) - ScholarHub Africa` (detail pages).

## 15 · Meta descriptions - 3 variations (homepage, all < 160 chars)

1. `Discover fully-funded master's scholarships for African students - 45+ human-verified opportunities across 23 countries, scored for fit.` *(136 - live on the homepage)*
2. `Search, filter and track verified international scholarships. Live deadlines, official links, and a personal tracker built for African students.` *(144)*
3. `Find your fully-funded master's abroad. Human-verified deadlines, 0–100 fit scores, and live countdowns across 23 countries - start your search today.` *(150)*

Swap by editing `{% block meta_description %}` in `templates/scholarships/home.html`.

## 16 · Social share tags (OG + Twitter Card)
`templates/base.html` `{% block og_tags %}` - `og:site_name/title/description/type/url/image`
(1200×630 `static/img/og-image.png`, generated via `python manage.py generate_og_image`)
plus `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
`twitter:image`. Detail pages override title/description for shareable WhatsApp/Twitter cards.

## 17 · Alt text on images
Applied in templates; guidance + examples:

- **Team headshots** (`pages/about.html`): `"Portrait of {Name}, {Role} at ScholarHub Africa"` - e.g. `"Portrait of Amara Njoroge, Head of Research & Verification at ScholarHub Africa"`.
- **OG/social image**: decorative/branded - used via `og:image`, so `alt` not applicable; if shown inline use `"ScholarHub Africa social share banner"`.
- **404 illustration** (`templates/404.html`): inline SVG with `role="img"` + `aria-label="Illustration of a lost graduation cap searching with a magnifying glass"` - accessible without cluttering SEO text.
- **Map iframe** (`contact.html`): `title="Map showing ScholarHub Africa office in Westlands, Nairobi, Kenya"`.
- **Emoji flags** (cards): decorative text, not `img` - no alt needed.
- Rule of thumb: describe *content and function* in ≤125 chars, include the brand where it's a branded asset, never stuff keywords.

## 18 · LocalBusiness / Organization schema
Homepage JSON-LD (`templates/scholarships/home.html`): `Organization` with `name`,
`url`, `logo`, `email`, `telephone`, `address` (PostalAddress), `openingHours`
(`Mo-Fr 09:00-18:00`), `sameAs`. Values flow from the `site` context processor
(`apps/pages/context_processors.py`) → settings/env, so placeholders are replaced
without touching templates.

## 19 · Privacy Policy
`templates/pages/privacy.html` at `/privacy/` - boilerplate covering emails, names
and usage analytics: what we collect, legal bases (GDPR), sharing, retention,
user rights, cookies, children, changes. Linked in the footer.

## 20 · Google Analytics 4 (GA4)
Snippet in `templates/base.html` `<head>`, rendered **only** when
`GA4_MEASUREMENT_ID` is set in the environment:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
</script>
```

Placement rules:
- Put both `<script>` blocks as high as possible in `<head>` - before any other
  scripts and before CSS that blocks rendering - so no events are lost.
- `anonymize_ip: true` is recommended for GDPR-friendliness.
- Consent-first: if you enable the cookie banner, move the GA4 config behind
  `gtag('consent', 'default', { analytics_storage: 'denied', ... })` and call
  `gtag('consent', 'update', ...)` on user choice (see the repo's
  `consent-manager/` implementation for the full pattern).
