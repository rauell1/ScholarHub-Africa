# ScholarHub Africa - Full System Design

**Version 1.0 | Author: Roy Okola Otieno | Date: 10 August 2026** *A modern scholarship discovery and tracking platform built for African students seeking international master's opportunities.*

## 1. Project Overview

### 1.1 Product Vision

ScholarHub Africa is a web platform where students - starting with Roy Okola Otieno, eventually any African student - can discover, filter, and track fully-funded international master's scholarship opportunities. Every record is human-verified against official sources, scored for profile fit, and kept up to date.

### 1.2 Design Principles

- **Mobile-first**: Majority of users in Kenya and across Africa are on mobile devices.
- **Speed over flash**: Pages load under 1.5s on 4G. Server-rendered HTML by default; JavaScript only where it genuinely improves UX.
- **Data trustworthiness**: Every scholarship entry shows its verification date and official source link. No stale data.
- **Progressive**: Start as Roy's private dashboard. Flip a feature flag to open registration to the public.

### 1.3 Core Features (Phase 1 - Private)

| Feature | Description |
|---|---|
| Scholarship directory | Browse 40+ verified opportunities with full details |
| Search | Full-text search across name, country, field, programme |
| Filters | Country, field, funding type, eligibility, deadline window, score |
| Country grouping | Explore scholarships grouped by destination country |
| Deadline countdown | Live countdown timers on all active opportunities |
| Score badge | 0-100 profile fit score displayed on every card |
| Detail page | Full scholarship page with all data fields, notes, and official link |
| Application tracker | Track application stage for each scholarship |
| Document checklist | Track readiness of all 24 required documents |
| Admin panel | Django Admin for Roy to add/edit/close scholarships without writing code |
| Weekly email digest | Automated Monday briefing with new deadlines and updates |

### 1.4 Extended Features (Phase 2 - Public)

- User registration and login (email + Google OAuth)
- Personalised profile: degree field, nationality, GPA, experience years
- AI-powered match score per user (using profile data vs. scholarship criteria)
- Bookmark / save scholarships
- Public shortlist sharing (generate shareable link)
- Scholarship submission by community members (admin-moderated)
- Email alerts for new scholarships matching user profile

## 2. Technology Stack

### 2.1 Stack Decision Matrix

| Layer | Technology | Why |
|---|---|---|
| **Backend framework** | Django 5.x (Python 3.12) | Batteries-included: ORM, admin, auth, migrations, forms. Django Admin = free scholarship management UI. |
| **REST API** | Django REST Framework (DRF) | Clean serializers, browsable API, easy to extend for Phase 2 |
| **Template rendering** | Django Templates (server-side HTML) | No JS bundle overhead. Pages render fully on the server. Great for SEO. |
| **Styling** | Tailwind CSS v3 | Utility-first, mobile-first, no unused CSS in production (PurgeCSS built in) |
| **Interactivity** | Alpine.js v3 | Lightweight (15kB). Handles search dropdowns, filters, modals, tab switches without a JS framework |
| **Rich UI components** | SvelteKit (compiled to web components) | Used *only* where Alpine.js is insufficient - e.g. an interactive search-and-filter panel with live results |
| **Database** | Neon PostgreSQL (serverless) | Scales to zero when not in use (cost-effective at start). Full PostgreSQL - pg_trgm for full-text search, JSONB for flexible metadata |
| **ORM** | Django ORM | Works natively with PostgreSQL. Migrations built in. |
| **Hosting - App server** | Railway.app | Python/Django-native. One-command deploy from GitHub. Free tier generous. Pairs perfectly with Neon. |
| **Hosting - CDN/DNS/Proxy** | Cloudflare | Sits in front of Railway. Free CDN, DDoS protection, caching, custom domain, SSL. Also hosts static assets via Cloudflare R2. |
| **Static files** | Cloudflare R2 (S3-compatible) | CSS, JS bundles, images served from the CDN edge - never hits Django. |
| **Email** | Resend (or SendGrid free tier) | Transactional emails: weekly digest, deadline alerts, account confirmations |
| **Task queue** | Celery + Redis (Railway add-on) | Async tasks: weekly email digest, score recalculation, data verification checks |
| **Environment config** | python-decouple + Railway env vars | No secrets in code. `.env` for local, Railway dashboard for production. |
| **Testing** | pytest-django | Unit tests for models, API endpoints, and scoring logic |
| **CI/CD** | GitHub Actions → Railway deploy | Push to `main` → tests run → auto-deploy to production |

**Note on Cloudflare hosting:** Cloudflare Pages/Workers does not yet run full Django applications natively. The recommended architecture is Django on Railway (a Python-native PaaS) with Cloudflare as the CDN, DNS, and proxy layer in front of it. This gives you Cloudflare's global edge network, caching, and DDoS protection while running Django on proper Python infrastructure. You retain the Cloudflare brand on your domain.

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS (Browser / Mobile)                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (CDN + DNS + Proxy)                │
│  • Global edge caching (static assets, HTML pages)               │
│  • DDoS protection                                               │
│  • SSL termination                                               │
│  • Custom domain: scholarhub.africa (example)                    │
│  • R2 bucket: CSS, JS, images served at edge                     │
└───────────────┬──────────────────────────────┬──────────────────┘
                │ Dynamic requests              │ Static assets
                │ (cache miss)                  │ (served directly)
                ▼                              (no Django hit)
┌─────────────────────────────┐
│    RAILWAY.APP - App Server  │
│  ┌─────────────────────────┐│
│  │  Django 5.x (Gunicorn)  ││
│  │  + Django REST Framework││
│  │  + Celery worker        ││
│  │  + Redis (task queue)   ││
│  └──────────┬──────────────┘│
└─────────────┼───────────────┘
              │ psycopg3 (async-ready)
              ▼
┌─────────────────────────────┐
│    NEON POSTGRESQL           │
│  • Serverless, scales to 0  │
│  • pg_trgm (full-text)      │
│  • JSONB (flexible fields)  │
│  • Connection pooling (PgBouncer built-in) │
└─────────────────────────────┘
              │
              ▼
┌─────────────────────────────┐
│    RESEND (Email)            │
│  • Weekly Monday digest      │
│  • Deadline alerts           │
│  • Account emails (Phase 2)  │
└─────────────────────────────┘
```

## 4. Database Schema

```sql
-- ═══════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════

CREATE TABLE countries (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    iso_code    CHAR(2) NOT NULL UNIQUE,
    flag_emoji  VARCHAR(10),
    region      VARCHAR(50)  -- 'Europe', 'Asia', 'Africa', 'Americas', 'Oceania'
);

CREATE TABLE fields_of_study (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50)  -- e.g. 'solar-panel', 'water-drop', 'cpu-chip' (Heroicons names)
);

CREATE TABLE scholarships (
    id                  SERIAL PRIMARY KEY,
    slug                VARCHAR(200) NOT NULL UNIQUE,  -- URL-safe identifier

    -- Core identity
    name                VARCHAR(300) NOT NULL,
    short_name          VARCHAR(100),                  -- e.g. "DAAD EPOS – REM"
    programme           VARCHAR(300),
    university          VARCHAR(300),
    country_id          INTEGER REFERENCES countries(id),

    -- Funding details
    funding_type        VARCHAR(20) CHECK (funding_type IN ('full', 'partial', 'tuition_only', 'living_only')),
    funding_detail      TEXT,                           -- Free text: "€1,400/mo + tuition + flights"
    application_fee     NUMERIC(8,2) DEFAULT 0,
    currency            CHAR(3) DEFAULT 'USD',

    -- Eligibility
    eligibility_label   VARCHAR(2) CHECK (eligibility_label IN ('CE','LE','PE','NE')),
    english_requirement TEXT,
    age_min             INTEGER,
    age_max             INTEGER,
    experience_years_min NUMERIC(3,1),
    gpa_minimum         NUMERIC(4,2),
    nationality_notes   TEXT,
    mba_impact          VARCHAR(20) CHECK (mba_impact IN ('none','risk','disqualifies','check','unknown')),
    mba_notes           TEXT,

    -- Scoring
    score               SMALLINT CHECK (score BETWEEN 0 AND 100),
    competitiveness     VARCHAR(50),

    -- Fields (many-to-many via junction table)
    -- see scholarship_fields table

    -- Deadlines and status
    deadline_date       DATE,
    deadline_notes      TEXT,                           -- "~31 Oct 2026 (verify at daad.de)"
    status              VARCHAR(30) CHECK (status IN (
                            'open_now', 'opening_soon', 'upcoming',
                            'not_yet_open', 'closed', 'ineligible', 'unknown'
                        )),
    cycle_year          SMALLINT,                       -- e.g. 2027

    -- Content
    notes               TEXT,
    action_required     TEXT,
    official_link       VARCHAR(500),

    -- Metadata
    is_verified         BOOLEAN DEFAULT FALSE,
    verified_at         TIMESTAMP WITH TIME ZONE,
    verified_source     TEXT,
    is_featured         BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Full-text search vector (auto-updated via trigger)
    search_vector       TSVECTOR
);

CREATE TABLE scholarship_fields (
    scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
    field_id       INTEGER REFERENCES fields_of_study(id) ON DELETE CASCADE,
    PRIMARY KEY (scholarship_id, field_id)
);

-- Full-text search index
CREATE INDEX scholarships_search_idx ON scholarships USING GIN(search_vector);
CREATE INDEX scholarships_country_idx ON scholarships(country_id);
CREATE INDEX scholarships_status_idx  ON scholarships(status);
CREATE INDEX scholarships_score_idx   ON scholarships(score DESC);
CREATE INDEX scholarships_deadline_idx ON scholarships(deadline_date);

-- Auto-update search vector trigger
CREATE OR REPLACE FUNCTION update_scholarship_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.short_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.programme, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.university, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.funding_detail, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scholarship_search_vector_update
    BEFORE INSERT OR UPDATE ON scholarships
    FOR EACH ROW EXECUTE FUNCTION update_scholarship_search_vector();

-- ═══════════════════════════════════════════════════════
-- APPLICATION TRACKING (Private / Phase 1)
-- ═══════════════════════════════════════════════════════

CREATE TABLE applicant_profiles (
    id                  SERIAL PRIMARY KEY,
    email               VARCHAR(254) NOT NULL UNIQUE,
    full_name           VARCHAR(200),
    nationality         VARCHAR(100),
    degree_field        VARCHAR(200),
    graduation_year     SMALLINT,
    gpa                 NUMERIC(4,2),
    experience_years    NUMERIC(3,1),
    has_ielts           BOOLEAN DEFAULT FALSE,
    ielts_score         NUMERIC(3,1),
    has_toefl           BOOLEAN DEFAULT FALSE,
    toefl_score         SMALLINT,
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tracked_applications (
    id              SERIAL PRIMARY KEY,
    profile_id      INTEGER REFERENCES applicant_profiles(id) ON DELETE CASCADE,
    scholarship_id  INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
    stage           VARCHAR(30) CHECK (stage IN (
                        'researching', 'planning', 'drafting', 'submitted',
                        'interview', 'awarded', 'rejected', 'withdrawn'
                    )) DEFAULT 'researching',
    priority        VARCHAR(10) CHECK (priority IN ('reach','target','safe','backup')),
    notes           TEXT,
    next_action     TEXT,
    next_action_due DATE,
    sop_status      VARCHAR(20) CHECK (sop_status IN ('not_started','drafting','done')),
    refs_status     VARCHAR(20) CHECK (refs_status IN ('not_started','requested','received')),
    transcript_ready BOOLEAN DEFAULT FALSE,
    moi_ready       BOOLEAN DEFAULT FALSE,
    last_updated    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, scholarship_id)
);

CREATE TABLE document_items (
    id          SERIAL PRIMARY KEY,
    profile_id  INTEGER REFERENCES applicant_profiles(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    status      VARCHAR(20) CHECK (status IN ('ready','in_progress','not_started','not_needed')),
    notes       TEXT,
    due_date    DATE,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- CHANGELOG
-- ═══════════════════════════════════════════════════════

CREATE TABLE change_log (
    id              SERIAL PRIMARY KEY,
    scholarship_id  INTEGER REFERENCES scholarships(id) ON DELETE SET NULL,
    change_type     VARCHAR(50),
    field_changed   VARCHAR(100),
    old_value       TEXT,
    new_value       TEXT,
    source          TEXT,
    changed_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by      VARCHAR(100) DEFAULT 'system'
);
```

## 5. Django App Structure

```
scholarhub/                         # Django project root
├── manage.py
├── requirements.txt
├── .env                            # Local secrets (gitignored)
├── Procfile                        # Railway/Gunicorn: web: gunicorn scholarhub.wsgi
│
├── scholarhub/                     # Main project package
│   ├── settings/
│   │   ├── base.py                 # Shared settings
│   │   ├── local.py                # Dev overrides
│   │   └── production.py           # Prod: Cloudflare R2, Neon, email
│   ├── urls.py                     # Root URL conf
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── scholarships/               # Core app
│   │   ├── models.py               # Scholarship, Country, FieldOfStudy, ChangeLog
│   │   ├── admin.py                # Django Admin config (feature-rich)
│   │   ├── views.py                # Directory, detail, search, filter views
│   │   ├── urls.py
│   │   ├── serializers.py          # DRF serializers for API endpoints
│   │   ├── api_views.py            # DRF ViewSets (/api/v1/scholarships/)
│   │   ├── filters.py              # django-filter FilterSet
│   │   ├── search.py               # Full-text search helpers (pg_trgm)
│   │   ├── templatetags/
│   │   │   └── scholarship_tags.py # Custom template tags: deadline_badge, score_colour
│   │   └── management/
│   │       └── commands/
│   │           ├── import_scholarships.py   # One-time import from Excel data
│   │           └── send_weekly_digest.py    # Celery task trigger
│   │
│   ├── tracker/                    # Application tracking
│   │   ├── models.py               # TrackedApplication, DocumentItem, ApplicantProfile
│   │   ├── admin.py
│   │   ├── views.py                # Tracker dashboard, checklist
│   │   └── urls.py
│   │
│   └── accounts/                   # Auth (Phase 2 public)
│       ├── models.py               # Extended user profile
│       ├── views.py                # Login, register, profile
│       └── urls.py
│
├── templates/
│   ├── base.html                   # Base layout: nav, footer, Alpine.js, Tailwind
│   ├── components/
│   │   ├── scholarship_card.html   # Reusable card component
│   │   ├── filter_sidebar.html     # Alpine.js-powered filter panel
│   │   ├── deadline_badge.html     # Colour-coded deadline chip
│   │   ├── score_badge.html        # Score circle (0-100)
│   │   ├── search_bar.html         # Search input with suggestions
│   │   └── flag_chip.html          # Country flag + name chip
│   ├── scholarships/
│   │   ├── directory.html          # Main listing page
│   │   ├── detail.html             # Individual scholarship page
│   │   ├── by_country.html         # Grouped by destination country
│   │   └── by_field.html           # Grouped by field of study
│   └── tracker/
│       ├── dashboard.html          # My applications overview
│       └── checklist.html          # Document readiness tracker
│
├── static/
│   ├── css/
│   │   └── main.css                # Tailwind directives → compiled output
│   ├── js/
│   │   ├── alpine.min.js           # Alpine.js (self-hosted or CDN)
│   │   └── countdown.js            # Deadline countdown logic
│   └── svelte/                     # Compiled SvelteKit components (if used)
│       └── SearchPanel.js          # Advanced search component (compiled)
│
└── tailwind.config.js
```

## 6. Key Pages and UI Design

### 6.1 Homepage (`/`)

- **Hero section**: Bold headline + search bar (full-width, prominent)
- **Stats strip**: "40 scholarships | 24 countries | Up to 100% funded"
- **Open Now cards**: Horizontal scroll of 3-5 currently open scholarships with countdown timers
- **Browse by Country**: Flag grid (click to filter)
- **Browse by Field**: Icon grid (Renewable Energy, Water, EV Technology, etc.)
- **How it works**: 3-step explainer (Search → Filter → Track)

### 6.2 Scholarship Directory (`/scholarships/`)

```
┌─────────────────────────────────────────────────────┐
│  [Search bar - full width]                           │
├──────────────┬──────────────────────────────────────┤
│ FILTER PANEL │ SCHOLARSHIP CARDS GRID               │
│ (Alpine.js   │                                      │
│  collapsible │  [Card] [Card] [Card]                │
│  on mobile)  │  [Card] [Card] [Card]                │
│              │                                      │
│ ▸ Country    │  Sort: Score ▾  | 40 results         │
│ ▸ Field      │                                      │
│ ▸ Funding    │                                      │
│ ▸ Eligibility│                                      │
│ ▸ Deadline   │                                      │
│ ▸ Min Score  │                                      │
└──────────────┴──────────────────────────────────────┘
```

**Scholarship Card anatomy:**

```
┌─────────────────────────────────────────┐
│ 🇩🇪 Germany          [CE] [Score: 93]   │
│                                         │
│ DAAD EPOS – Renewable Energy Management │
│ TH Köln, Cologne                        │
│                                         │
│ 💰 Fully Funded  ·  EUR 992/mo + tuition│
│ 🗓 Deadline: 31 Oct 2026  [82 days]     │
│ ⚡ Renewable Energy · Solar · Management│
│                                         │
│              [View Details →]           │
└─────────────────────────────────────────┘
```

### 6.3 Scholarship Detail Page (`/scholarships/<slug>/`)

- Full-width hero with country flag, score badge, eligibility label
- Two-column layout (desktop): Left = all scholarship details | Right = sticky action panel
- Action panel: "Add to Tracker" button, bookmark, official link CTA
- Sections: Overview → Funding → Eligibility → Requirements → Notes & Actions → Change History

### 6.4 By Country (`/scholarships/country/`)

- World map (SVG, clickable) + card grid below grouped by region
- Each country: flag, name, scholarship count badge
- Click → filter directory to that country

### 6.5 Application Tracker (`/tracker/`)

- Kanban-style columns: Planning → Drafting → Submitted → Decision
- Each card: scholarship name, deadline countdown, completion %, next action
- Document Checklist: 24-item progress bar with status icons

## 7. API Design (DRF)

```
Base URL: /api/v1/

GET  /api/v1/scholarships/              # List (paginated, filterable, searchable)
GET  /api/v1/scholarships/<id>/         # Single scholarship detail
GET  /api/v1/scholarships/open-now/     # Active deadlines only
GET  /api/v1/scholarships/top/          # Top 20 by score
GET  /api/v1/countries/                 # All countries + scholarship count
GET  /api/v1/fields/                    # All fields of study
GET  /api/v1/search/?q=<query>          # Full-text search endpoint

# Tracker (auth required - Phase 1: single admin user)
GET  /api/v1/tracker/applications/
POST /api/v1/tracker/applications/
PUT  /api/v1/tracker/applications/<id>/
GET  /api/v1/tracker/documents/
PUT  /api/v1/tracker/documents/<id>/

# Query params for /scholarships/
?country=DE&field=energy&funding=full&eligibility=CE
&status=open_now&min_score=80&deadline_before=2027-01-01
&search=DAAD&ordering=-score&page=1&page_size=12
```

## 8. Search Implementation

### Phase 1 - PostgreSQL Full-Text Search

```python
# apps/scholarships/search.py

from django.db.models import Q
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

def search_scholarships(queryset, query_string):
    if not query_string:
        return queryset
    
    search_query = SearchQuery(query_string, config='english')
    
    return (
        queryset
        .filter(search_vector=search_query)
        .annotate(rank=SearchRank('search_vector', search_query))
        .order_by('-rank', '-score')
    )
```

### Phase 2 - Meilisearch (if full-text proves insufficient)

Meilisearch is a Rust-based search engine with typo-tolerance and instant results. Drop-in replacement - swap the search backend without changing the API. Host on Railway alongside Django.

## 9. Filtering with django-filter

```python
# apps/scholarships/filters.py

import django_filters
from .models import Scholarship

class ScholarshipFilter(django_filters.FilterSet):
    country     = django_filters.CharFilter(field_name='country__iso_code', lookup_expr='iexact')
    field       = django_filters.CharFilter(field_name='fields__slug', lookup_expr='iexact')
    funding     = django_filters.ChoiceFilter(field_name='funding_type', choices=Scholarship.FUNDING_CHOICES)
    eligibility = django_filters.ChoiceFilter(field_name='eligibility_label', choices=Scholarship.ELIG_CHOICES)
    status      = django_filters.ChoiceFilter(field_name='status', choices=Scholarship.STATUS_CHOICES)
    min_score   = django_filters.NumberFilter(field_name='score', lookup_expr='gte')
    deadline_before = django_filters.DateFilter(field_name='deadline_date', lookup_expr='lte')
    deadline_after  = django_filters.DateFilter(field_name='deadline_date', lookup_expr='gte')

    class Meta:
        model  = Scholarship
        fields = ['country', 'field', 'funding', 'eligibility', 'status', 'min_score']
```

## 10. Alpine.js Filter Panel (Frontend)

```html
<!-- templates/components/filter_sidebar.html -->
<div x-data="filterPanel()" class="filter-sidebar">

  <!-- Mobile toggle -->
  <button @click="open = !open" class="md:hidden w-full btn-outline">
    <span x-text="open ? 'Hide Filters' : 'Show Filters'"></span>
    <span x-text="activeCount > 0 ? (`${activeCount} active`) : ''"></span>
  </button>

  <div :class="open ? 'block' : 'hidden md:block'">

    <!-- Country filter -->
    <div class="filter-group">
      <h3>Destination Country</h3>
      <template x-for="country in countries" :key="country.iso_code">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" :value="country.iso_code"
                 x-model="selected.countries"
                 @change="applyFilters()">
          <span x-text="country.flag_emoji + ' ' + country.name"></span>
          <span class="badge" x-text="country.count"></span>
        </label>
      </template>
    </div>

    <!-- Score slider -->
    <div class="filter-group">
      <h3>Minimum Score: <span x-text="selected.minScore"></span></h3>
      <input type="range" min="0" max="100" step="5"
             x-model="selected.minScore"
             @input="applyFilters()" class="w-full accent-teal-500">
    </div>

    <!-- Status -->
    <div class="filter-group">
      <h3>Status</h3>
      <label><input type="checkbox" value="open_now" x-model="selected.statuses" @change="applyFilters()"> Open Now</label>
      <label><input type="checkbox" value="opening_soon" x-model="selected.statuses" @change="applyFilters()"> Opening Soon</label>
      <label><input type="checkbox" value="upcoming" x-model="selected.statuses" @change="applyFilters()"> Upcoming</label>
    </div>

    <button @click="clearAll()" class="btn-ghost text-sm" x-show="activeCount > 0">
      Clear all filters
    </button>
  </div>
</div>

<script>
function filterPanel() {
  return {
    open: false,
    selected: { countries: [], fields: [], statuses: [], minScore: 0, funding: [] },
    get activeCount() {
      return this.selected.countries.length + this.selected.fields.length +
             this.selected.statuses.length + (this.selected.minScore > 0 ? 1 : 0);
    },
    applyFilters() {
      const params = new URLSearchParams();
      this.selected.countries.forEach(c => params.append('country', c));
      this.selected.fields.forEach(f => params.append('field', f));
      this.selected.statuses.forEach(s => params.append('status', s));
      if (this.selected.minScore > 0) params.set('min_score', this.selected.minScore);
      window.location.search = params.toString();
    },
    clearAll() {
      this.selected = { countries: [], fields: [], statuses: [], minScore: 0, funding: [] };
      this.applyFilters();
    }
  }
}
</script>
```

## 11. Tailwind Design Tokens

```js
// tailwind.config.js
module.exports = {
  content: ['./templates/**/*.html', './static/**/*.js'],
  theme: {
    extend: {
      colors: {
        navy:   { DEFAULT: '#1F3864', light: '#2E4A7A' },
        teal:   { DEFAULT: '#1ABC9C', light: '#A3E8DA' },
        forest: { DEFAULT: '#27AE60', light: '#D5F5E3' },
        amber:  { DEFAULT: '#F39C12', light: '#FEF9E7' },
        crimson:{ DEFAULT: '#C0392B', light: '#FADBD8' },
        sky:    { DEFAULT: '#2980B9', light: '#D6EAF8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
  ],
}
```

**Score badge colours:**

| Score | Background | Label |
|---|---|---|
| 90–100 | `#1A4F2A` (dark forest) | Outstanding |
| 85–89 | `#1A7A4A` | Excellent |
| 80–84 | `#27AE60` (forest) | Very Strong |
| 74–79 | `#F39C12` (amber) | Good |
| 60–73 | `#2980B9` (sky) | Achievable |
| < 60 | `#C0392B` (crimson) | Stretch |

**Eligibility badge colours:**

| Code | Label | Colour |
|---|---|---|
| CE | Confirmed Eligible | Forest green |
| LE | Likely Eligible | Teal |
| PE | Pending Clarification | Amber |
| NE | Not Eligible | Crimson |

## 12. SvelteKit Component (Advanced Search Panel)

Used only where Alpine.js is too limited - e.g. a typeahead search with real-time API results. Compiled as a standalone web component and embedded in a Django template.

```svelte
<!-- SearchPanel.svelte - compiled to SearchPanel.js + SearchPanel.css -->
<script>
  import { onMount } from 'svelte';

  let query = '';
  let results = [];
  let loading = false;
  let debounceTimer;

  async function search(q) {
    if (!q || q.length < 2) { results = []; return; }
    loading = true;
    const res = await fetch(`/api/v1/search/?q=${encodeURIComponent(q)}`);
    results = await res.json();
    loading = false;
  }

  function onInput(e) {
    query = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(query), 300);
  }
</script>

<div class="search-panel">
  <input
    type="search"
    placeholder="Search scholarships, universities, countries..."
    on:input={onInput}
    class="search-input"
  />

  {#if loading}
    <div class="loading-spinner">Searching...</div>
  {:else if results.length > 0}
    <ul class="results-list">
      {#each results as r}
        <li>
          <a href="/scholarships/{r.slug}/">
            <span class="r-name">{r.name}</span>
            <span class="r-meta">{r.country} · Score {r.score}</span>
          </a>
        </li>
      {/each}
    </ul>
  {:else if query.length > 1}
    <p class="no-results">No scholarships found for "{query}"</p>
  {/if}
</div>
```

Embed in Django template:

```html
<!-- In base.html -->
<script src="{% static 'svelte/SearchPanel.js' %}"></script>
<search-panel></search-panel>
```

## 13. Deadline Countdown Component

```js
// static/js/countdown.js
document.querySelectorAll('[data-deadline]').forEach(el => {
  const deadline = new Date(el.dataset.deadline);

  function update() {
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) {
      el.textContent = 'CLOSED';
      el.classList.add('text-crimson-600', 'font-bold');
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);

    if (days <= 7) {
      el.textContent = `${days}d ${hours}h remaining`;
      el.classList.add('text-red-600', 'font-bold', 'animate-pulse');
    } else if (days <= 30) {
      el.textContent = `${days} days`;
      el.classList.add('text-amber-600', 'font-semibold');
    } else {
      el.textContent = `${days} days`;
      el.classList.add('text-forest-600');
    }
  }

  update();
  setInterval(update, 60000); // refresh every minute
});
```

```html
<!-- Usage in template -->
<span data-deadline="{{ scholarship.deadline_date|date:'c' }}"
      class="deadline-badge">
  Loading...
</span>
```

## 14. Django Admin Configuration

```python
# apps/scholarships/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import Scholarship, Country, FieldOfStudy, ChangeLog

@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display  = ['short_name', 'country', 'score_badge', 'eligibility_badge',
                     'status', 'deadline_date', 'is_verified', 'is_active']
    list_filter   = ['status', 'eligibility_label', 'funding_type',
                     'country__region', 'is_verified', 'is_featured', 'is_active']
    search_fields = ['name', 'short_name', 'programme', 'university']
    ordering      = ['-score', 'deadline_date']
    list_editable = ['is_verified', 'is_active', 'is_featured']
    readonly_fields = ['created_at', 'updated_at', 'search_vector']
    filter_horizontal = ['fields']

    fieldsets = (
        ('Identity', {
            'fields': ('name', 'short_name', 'slug', 'programme', 'university', 'country')
        }),
        ('Funding', {
            'fields': ('funding_type', 'funding_detail', 'application_fee', 'currency')
        }),
        ('Eligibility', {
            'fields': ('eligibility_label', 'english_requirement', 'age_min', 'age_max',
                       'experience_years_min', 'gpa_minimum', 'nationality_notes',
                       'mba_impact', 'mba_notes')
        }),
        ('Scoring & Fields', {
            'fields': ('score', 'competitiveness', 'fields')
        }),
        ('Deadline & Status', {
            'fields': ('deadline_date', 'deadline_notes', 'status', 'cycle_year')
        }),
        ('Content', {
            'fields': ('notes', 'action_required', 'official_link')
        }),
        ('Publication', {
            'fields': ('is_verified', 'verified_at', 'verified_source',
                       'is_featured', 'is_active')
        }),
    )

    def score_badge(self, obj):
        color = ('#1A4F2A' if obj.score >= 90 else '#27AE60' if obj.score >= 80
                 else '#F39C12' if obj.score >= 74 else '#C0392B')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;'
            'border-radius:4px;font-weight:bold">{}</span>', color, obj.score
        )
    score_badge.short_description = 'Score'

    def eligibility_badge(self, obj):
        colours = {'CE':'#27AE60','LE':'#1ABC9C','PE':'#F39C12','NE':'#C0392B'}
        c = colours.get(obj.eligibility_label, '#888')
        return format_html(
            '<span style="background:{};color:white;padding:2px 6px;'
            'border-radius:4px;font-weight:bold">{}</span>', c, obj.eligibility_label
        )
    eligibility_badge.short_description = 'Elig.'
```

## 15. Weekly Email Digest (Celery Task)

```python
# apps/scholarships/tasks.py

from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Scholarship
import resend  # pip install resend

@shared_task
def send_weekly_digest():
    """Runs every Monday at 08:00 EAT via Celery beat."""

    now = timezone.now().date()
    soon = now + timedelta(days=60)

    # Scholarships closing within 60 days
    urgent = Scholarship.objects.filter(
        is_active=True,
        deadline_date__gte=now,
        deadline_date__lte=soon,
        status__in=['open_now', 'opening_soon']
    ).order_by('deadline_date')[:10]

    # Newly opened since last Monday
    last_week = now - timedelta(days=7)
    new_this_week = Scholarship.objects.filter(
        is_active=True,
        updated_at__date__gte=last_week,
        status='open_now'
    ).order_by('-score')[:5]

    # Build HTML email
    html_body = render_digest_email(urgent, new_this_week, generated_on=now)

    resend.Emails.send({
        "from": "ScholarHub <digest@scholarhub.africa>",
        "to": ["royokola3@gmail.com"],
        "subject": f"📚 Scholarship Digest - Week of {now.strftime('%d %b %Y')}",
        "html": html_body,
    })
```

```python
# Schedule in celery beat (settings/base.py):
# CELERY_BEAT_SCHEDULE = {
#     'weekly-digest': {
#         'task': 'apps.scholarships.tasks.send_weekly_digest',
#         'schedule': crontab(hour=5, minute=0, day_of_week=1),  # 05:00 UTC = 08:00 EAT
#     },
# }
```

## 16. Deployment Configuration

### 16.1 Railway (`railway.toml`)

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate"

[deploy]
startCommand = "gunicorn scholarhub.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[[services]]
name = "web"

[[services]]
name = "worker"
startCommand = "celery -A scholarhub worker --loglevel=info"

[[services]]
name = "beat"
startCommand = "celery -A scholarhub beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler"
```

### 16.2 Environment Variables (Railway Dashboard)

```
DATABASE_URL=postgresql://...@ep-....neon.tech/scholarhub?sslmode=require
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(50))">
DEBUG=False
ALLOWED_HOSTS=scholarhub.africa,www.scholarhub.africa,<railway-domain>.railway.app
CLOUDFLARE_R2_BUCKET=scholarhub-static
CLOUDFLARE_R2_ACCESS_KEY=<from Cloudflare R2 dashboard>
CLOUDFLARE_R2_SECRET_KEY=<from Cloudflare R2 dashboard>
CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
RESEND_API_KEY=<from resend.com>
REDIS_URL=redis://:...@...railway.app:6379
```

### 16.3 Cloudflare Setup

1. Add your domain to Cloudflare (update nameservers at your registrar)
2. Create a CNAME record: `@ → <railway-domain>.railway.app` (proxy ON - orange cloud)
3. Create CNAME: `www → scholarhub.africa`
4. Set SSL mode to **Full (Strict)**
5. Create a **Cache Rule**: cache `*.css`, `*.js`, `*.png`, `*.jpg`, `*.svg` for 30 days
6. Create a **Page Rule**: bypass cache for `/admin/*`, `/api/*`, `/tracker/*`
7. Enable **Automatic HTTPS Rewrites**
8. Optional: Enable **Bot Fight Mode**

### 16.4 Neon PostgreSQL Connection

```python
# settings/production.py
import dj_database_url

DATABASES = {
    'default': dj_database_url.parse(
        env('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
        options={'sslmode': 'require'}
    )
}
```

## 17. Development Setup (Local)

```bash
# 1. Clone and create virtual environment
git clone https://github.com/royokola/scholarhub-africa
cd scholarhub-africa
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
npm install  # for Tailwind CSS compilation

# 3. Environment
cp .env.example .env
# Edit .env: add your local Neon DB URL (or local PostgreSQL)

# 4. Database
python manage.py migrate
python manage.py createsuperuser  # admin@scholarhub.local

# 5. Import scholarship data from Excel
python manage.py import_scholarships --file Roy_Okola_Scholarship_Database_Cycle1_v2.xlsx

# 6. Run Tailwind watcher (separate terminal)
npx tailwindcss -i ./static/css/main.css -o ./static/css/output.css --watch

# 7. Run Django dev server
python manage.py runserver

# 8. Open http://localhost:8000 (site) and http://localhost:8000/admin (admin)
```

```txt
requirements.txt

Django==5.0.7
djangorestframework==3.15.2
django-filter==24.2
psycopg[binary]==3.2.1
dj-database-url==2.2.0
python-decouple==3.8
gunicorn==22.0.0
whitenoise==6.7.0
django-cors-headers==4.4.0
celery==5.4.0
redis==5.0.8
django-celery-beat==2.6.0
resend==2.3.0
django-storages[s3]==1.14.3   # for Cloudflare R2 (S3-compatible)
boto3==1.35.0
Pillow==10.4.0
django-extensions==3.2.3
openpyxl==3.1.5               # for import command
```

## 18. Phase Roadmap

| Phase | Features | Timeline |
|---|---|---|
| **Phase 0** | Data import, admin panel working, database seeded from Excel | Week 1 |
| **Phase 1** | Public directory, search, filters, country grouping, detail pages, countdown timers | Week 2-3 |
| **Phase 1.5** | Application tracker, document checklist, weekly email digest | Week 3-4 |
| **Phase 2** | User registration, personalised match scores, bookmarks, email alerts | Month 2-3 |
| **Phase 3** | Community submissions, moderation queue, mobile app (Flutter or PWA) | Month 4-6 |

## 19. SEO and Performance Targets

- **Server-rendered HTML** by default → search engines index full content immediately
- **Lighthouse score target**: ≥ 90 performance, ≥ 95 accessibility, ≥ 90 SEO
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **Structured data**: `ScholarshipOffer` JSON-LD on each detail page
- **Sitemap**: Auto-generated via `django.contrib.sitemaps`
- **Open Graph tags**: Each scholarship detail page → shareable on WhatsApp/Twitter

---

*End of System Design v1.0 - ScholarHub Africa*
*Stack: Django 5 · Tailwind CSS · Alpine.js · SvelteKit (components) · Neon PostgreSQL · Railway · Cloudflare*
