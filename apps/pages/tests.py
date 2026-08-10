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
        'message': 'Hello!',
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
