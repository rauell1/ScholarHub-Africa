"""Tests for the pages app (About, FAQ, Contact, Thank-you, Case study, Privacy, SEO)."""
import pytest


@pytest.fixture
def data(db):
    from apps.scholarships.models import Country, FieldOfStudy, Scholarship

    de = Country.objects.create(name='Germany', iso_code='DE', flag_emoji='🇩🇪', region='Europe')
    uk = Country.objects.create(name='United Kingdom', iso_code='UK', flag_emoji='🇬🇧', region='Europe')
    energy = FieldOfStudy.objects.create(name='Renewable Energy', icon='🌱')

    daad = Scholarship.objects.create(
        name='DAAD EPOS — Renewable Energy Management (REM)',
        short_name='DAAD EPOS REM', slug='daad-epos-rem',
        country=de, funding_type='full', eligibility_label='CE',
        score=93, status='open_now', deadline_date='2026-10-31',
        notes='Fully funded renewable energy master in Germany.',
        official_link='https://www.daad.de', is_verified=True, is_active=True,
    )
    daad.fields.set([energy])

    chevening = Scholarship.objects.create(
        name='Chevening Scholarships', short_name='Chevening', slug='chevening',
        country=uk, funding_type='full', eligibility_label='CE',
        score=95, status='opening_soon', deadline_date='2026-11-03',
        notes='UK government leadership scholarship.',
        official_link='https://www.chevening.org', is_verified=True, is_active=True,
    )
    chevening.fields.set([energy])
    return {'daad': daad, 'chevening': chevening}


def test_about_page(client):
    response = client.get('/about/')
    assert response.status_code == 200
    content = response.content.decode()
    assert 'About ScholarHub Africa' in content
    assert 'Roy Okola Otieno' in content
    assert 'img/team/' in content  # team photos rendered


def test_faq_page(client):
    response = client.get('/faq/')
    assert response.status_code == 200
    content = response.content.decode()
    assert 'Frequently asked questions' in content
    assert content.count('x-show="open ===') >= 5  # 5 accordion items


def test_contact_page_has_promise_and_map(client):
    response = client.get('/contact/')
    assert response.status_code == 200
    content = response.content.decode()
    assert 'within 24 hours' in content          # response-time promise
    assert 'google.com/maps' in content           # map embed
    assert 'Directions' in content


def test_contact_post_redirects_to_thank_you(client):
    response = client.post('/contact/', {
        'name': 'Achieng Otieno',
        'email': 'achieng@example.com',
        'subject': 'Question',
        'message': 'Hello there, this is a real question.',
    })
    assert response.status_code == 302
    assert '/thank-you/' in response['Location']
    assert 'Achieng%20Otieno' in response['Location']


def test_thank_you_page(client):
    response = client.get('/thank-you/?name=Joy')
    assert response.status_code == 200
    content = response.content.decode()
    assert 'Thank you, Joy' in content
    assert 'While you wait' in content


def test_case_study_sections(client):
    response = client.get('/case-studies/')
    assert response.status_code == 200
    content = response.content.decode()
    assert 'Client background' in content
    assert 'The challenge' in content
    assert 'The solution' in content
    assert 'The results' in content
    assert 'DAAD EPOS' in content


def test_privacy_page(client):
    response = client.get('/privacy/')
    assert response.status_code == 200
    content = response.content.decode()
    assert 'Privacy Policy' in content
    assert 'GDPR' in content


def test_robots_txt(client):
    response = client.get('/robots.txt')
    assert response.status_code == 200
    assert response['Content-Type'].startswith('text/plain')
    body = response.content.decode()
    assert 'User-agent: *' in body
    assert 'Disallow: /admin/' in body
    assert 'Disallow: /api/' in body
    assert 'Sitemap:' in body


def test_custom_404(client):
    response = client.get('/this-page-does-not-exist/')
    assert response.status_code == 404
    content = response.content.decode()
    assert 'Error 404' in content
    assert 'Back to homepage' in content


def test_404_passthrough_for_api_and_assets(client):
    """Branded 404 must not hijack API or static-asset 404 responses."""
    api = client.get('/api/v1/does-not-exist/')
    assert api.status_code == 404
    assert b'Error 404' not in api.content

    asset = client.get('/static/does-not-exist.css')
    assert asset.status_code == 404
    assert b'Error 404' not in asset.content


# ═══════════════════════════════════════════════════════════════════════
# Web standards enforcement (SEO / AEO / Security / Performance)
# ═══════════════════════════════════════════════════════════════════════

def test_canonical_on_indexable_pages(client, data):
    """Self-referencing canonical on every page (no query strings)."""
    for url in ['/', '/about/', '/scholarships/', '/scholarships/daad-epos-rem/',
                '/faq/', '/contact/', '/privacy/', '/case-studies/']:
        response = client.get(url)
        assert response.status_code == 200
        content = response.content.decode()
        expected = f'rel="canonical" href="http://testserver{url}"'
        assert expected in content, (url, expected)


def test_single_h1_and_descending_headings(client, db):
    """One h1 per page; no skipped heading levels."""
    import re
    for url in ['/', '/about/', '/scholarships/', '/scholarships/daad-epos-rem/',
                '/faq/', '/contact/', '/case-studies/', '/privacy/']:
        content = client.get(url).content.decode()
        h1s = re.findall(r'<h1[\s>]', content)
        assert len(h1s) == 1, url
        # No h3 that isn't preceded by an h2 (rough check: no h3 on pages
        # whose only section headings are h1 → h3).
        if '<h3' in content and '<h2' not in content:
            raise AssertionError(f'{url}: h3 without h2')


def test_title_under_60_chars(client, db):
    for url in ['/', '/about/', '/faq/', '/contact/', '/privacy/', '/case-studies/',
                '/scholarships/', '/scholarships/daad-epos-rem/']:
        response = client.get(url)
        title = response.content.decode().split('<title>')[1].split('</title>')[0]
        assert len(title) <= 60, (url, title, len(title))


def test_meta_descriptions_150_160_chars(client, db):
    for url in ['/', '/about/', '/faq/', '/contact/', '/privacy/', '/scholarships/']:
        content = client.get(url).content.decode()
        match = __import__('re').search(r'name="description" content="([^"]+)"', content)
        assert match, url
        length = len(match.group(1))
        assert 150 <= length <= 160, (url, length)


def test_sitewide_structured_data(client, db):
    """Organization + WebSite with SearchAction JSON-LD on every page."""
    content = client.get('/').content.decode()
    assert '"@type": "Organization"' in content
    assert '"@type": "WebSite"' in content
    assert 'SearchAction' in content
    assert '/scholarships/?q={search_term_string}' in content


def test_faqpage_schema_matches_visible_faqs(client):
    content = client.get('/faq/').content.decode()
    assert '"@type": "FAQPage"' in content
    assert content.count('"@type": "Question"') == 5  # exactly the 5 visible FAQs


def test_article_schema_on_case_study(client):
    content = client.get('/case-studies/').content.decode()
    assert '"@type": "Article"' in content


def test_sitemap_lists_only_canonical_urls(client, data):
    content = client.get('/sitemap.xml').content.decode()
    # Marketing pages present
    for url in ['/about', '/faq', '/contact', '/case-studies/', '/privacy']:
        assert url in content
    # Scholarship detail present
    assert '/scholarships/daad-epos-rem/' in content
    # No query-string (filtered) URLs in the sitemap
    assert '?country=' not in content
    assert '?q=' not in content
    # Not listing admin/api
    assert '/admin/' not in content
    assert '/api/' not in content


def test_robots_txt_allows_ai_crawlers(client):
    body = client.get('/robots.txt').content.decode()
    for agent in ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended',
                  'anthropic-ai', 'ChatGPT-User']:
        assert f'User-agent: {agent}' in body
    assert 'Disallow: /admin/' in body
    assert 'Disallow: /api/' in body
    assert 'Crawl-delay: 1' in body
    assert 'Sitemap:' in body


def test_llms_txt(client):
    response = client.get('/llms.txt')
    assert response.status_code == 200
    assert response['Content-Type'].startswith('text/plain')
    body = response.content.decode()
    assert '# ScholarHub Africa' in body
    assert 'Key Pages' in body
    assert 'Key Facts' in body


def test_security_headers(client, db):
    response = client.get('/')
    assert response.headers.get('Content-Security-Policy', '').startswith("default-src 'self'")
    assert 'object-src' in response.headers['Content-Security-Policy']
    assert "frame-ancestors 'none'" in response.headers['Content-Security-Policy']
    assert 'Permissions-Policy' in response.headers
    assert 'geolocation=()' in response.headers['Permissions-Policy']
    assert response.headers.get('X-Content-Type-Options') == 'nosniff'
    assert response.headers.get('Referrer-Policy') == 'strict-origin-when-cross-origin'


def test_no_wildcard_cors(client, db):
    assert client.get('/').headers.get('Access-Control-Allow-Origin') is None


def test_contact_form_server_side_validation(client):
    """Django-side re-validation (the framework counterpart of Zod)."""
    response = client.post('/contact/', {
        'name': 'A',                    # too short
        'email': 'not-an-email',
        'message': 'short',
    })
    assert response.status_code == 422
    content = response.content.decode()
    assert 'Please fix the following' in content
    # Honeypot: a bot-filled hidden field is silently rejected
    response = client.post('/contact/', {
        'name': 'Achieng Otieno',
        'email': 'achieng@example.com',
        'message': 'A genuine question about the platform.',
        'website': 'http://spam.example.com',
    })
    assert response.status_code != 302


def test_contact_rate_limited(client):
    """Public mutation is rate-limited and fails closed (Security 3.7)."""
    import json
    from django.core.cache import cache
    cache.clear()
    last = None
    for _ in range(12):  # limit is 10/min
        last = client.post('/contact/', {
            'name': 'Achieng Otieno',
            'email': 'achieng@example.com',
            'message': 'A genuine question about the platform.',
        })
    assert last.status_code == 429
    assert json.loads(last.content)['detail']


def test_ga4_consent_gating(client, db):
    """GA4 loads only when the consent cookie grants analytics."""
    from django.test import override_settings

    with override_settings(GA4_MEASUREMENT_ID='G-TEST123'):
        # No consent cookie → snippet NOT rendered
        content = client.get('/').content.decode()
        assert 'gtag/js?id=G-TEST123' not in content

        # Consent cookie grants analytics → snippet rendered
        client.cookies['sh_consent'] = '{"necessary":true,"analytics":true,"marketing":false,"preferences":false}'
        content = client.get('/').content.decode()
        assert 'gtag/js?id=G-TEST123' in content

        # Reject (analytics false) → nothing rendered
        client.cookies['sh_consent'] = '{"necessary":true,"analytics":false,"marketing":false,"preferences":false}'
        content = client.get('/').content.decode()
        assert 'gtag/js?id=G-TEST123' not in content


def test_analytics_js_gates_on_consent():
    """The client-side event layer must refuse to run without consent."""
    from pathlib import Path
    js = (Path(__file__).parent.parent.parent / 'static' / 'js' / 'analytics.js').read_text()
    assert 'analyticsAllowed' in js
    assert "state.categories.analytics" in js
    assert 'web_vitals' in js
    assert 'cta_click' in js
    assert 'ai_referrer' in js


def test_no_nplus1_in_home_and_related(client, data, django_assert_max_num_queries):
    """Home + related-scholarship renders must not query per card (Perf 4.4)."""
    with django_assert_max_num_queries(12):
        client.get('/')
    with django_assert_max_num_queries(12):
        client.get('/scholarships/daad-epos-rem/')


def test_private_pages_noindex(client, db):
    content = client.get('/accounts/login/').content.decode()
    assert 'noindex, nofollow' in content


def test_detail_meta_description_capped(client, data):
    """Detail-page meta description must not exceed 160 chars (1.1)."""
    import re
    response = client.get(data['daad'].get_absolute_url())
    content = response.content.decode()
    match = re.search(r'name="description" content="([^"]+)"', content)
    assert match
    assert len(match.group(1)) <= 160


def test_contact_hear_about_field(client, db):
    """AEO 2.5 — 'how did you hear about us' attribution field."""
    content = client.get('/contact/').content.decode()
    assert 'hear_about' in content
    assert 'AI assistant' in content

    response = client.post('/contact/', {
        'name': 'Achieng Otieno',
        'email': 'achieng@example.com',
        'message': 'A genuine question about the platform.',
        'hear_about': 'ai_assistant',
    })
    assert response.status_code == 302  # accepted with the new optional field


def test_enable_rls_noop_on_sqlite(db, capsys):
    """RLS command is a safe no-op on the local SQLite database (3.5)."""
    from django.core.management import call_command
    call_command('enable_rls')
    out = capsys.readouterr().out
    assert 'not PostgreSQL' in out


def test_unique_page_titles(client):
    """Every page appends its name to the app name (SEO checklist #11)."""
    cases = [
        ('/about/', 'About us — ScholarHub Africa'),
        ('/faq/', 'FAQ — ScholarHub Africa'),
        ('/contact/', 'Contact us — ScholarHub Africa'),
        ('/privacy/', 'Privacy Policy — ScholarHub Africa'),
        ('/case-studies/', '— ScholarHub Africa'),
    ]
    for url, expected in cases:
        response = client.get(url)
        assert response.status_code == 200
        title = response.content.decode().split('<title>')[1].split('</title>')[0]
        assert title.endswith('— ScholarHub Africa'), title
        if expected != '— ScholarHub Africa':
            assert title == expected, title


def test_home_has_social_and_schema_meta(client, db):
    response = client.get('/')
    content = response.content.decode()
    assert 'property="og:image"' in content
    assert 'name="twitter:card"' in content
    assert 'summary_large_image' in content
    assert 'application/ld+json' in content          # LocalBusiness/Organization schema
    assert 'BreadcrumbList' not in content           # (homepage has no breadcrumbs)
    assert 'sticky-cta' in content                   # sticky mobile CTA present


def test_detail_page_has_breadcrumbs_and_related(client, data):
    """Detail pages: breadcrumbs + related scholarships (internal linking)."""
    response = client.get(data['daad'].get_absolute_url())
    content = response.content.decode()
    assert 'aria-label="Breadcrumb"' in content
    assert 'BreadcrumbList' in content
    assert 'You might also consider' in content
    assert 'Chevening' in content  # related link rendered (same field)
