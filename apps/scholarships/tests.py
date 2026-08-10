"""Tests: models, search, filters, views and API (System Design v1.0 §2)."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Country, FieldOfStudy, Scholarship
from .search import search_scholarships


@pytest.fixture
def data(db):
    de = Country.objects.create(
        name='Germany', iso_code='DE', flag_emoji='🇩🇪', region='Europe'
    )
    uk = Country.objects.create(
        name='United Kingdom', iso_code='UK', flag_emoji='🇬🇧', region='Europe'
    )
    energy = FieldOfStudy.objects.create(name='Renewable Energy', icon='🌱')
    water = FieldOfStudy.objects.create(name='Water & Sanitation', icon='💧')

    daad = Scholarship.objects.create(
        name='DAAD EPOS - Renewable Energy Management (REM)',
        short_name='DAAD EPOS REM',
        slug='daad-epos-rem',
        country=de,
        funding_type='full',
        eligibility_label='CE',
        score=93,
        status='open_now',
        deadline_date='2026-10-31',
        notes='Fully funded renewable energy master in Germany.',
        official_link='https://www.daad.de',
        is_verified=True,
        is_active=True,
    )
    daad.fields.set([energy, water])

    chevening = Scholarship.objects.create(
        name='Chevening Scholarships',
        short_name='Chevening',
        slug='chevening',
        country=uk,
        funding_type='full',
        eligibility_label='CE',
        score=95,
        status='opening_soon',
        deadline_date='2026-11-03',
        notes='UK government leadership scholarship.',
        official_link='https://www.chevening.org',
        is_verified=True,
        is_active=True,
    )
    chevening.fields.set([energy])
    return {'daad': daad, 'chevening': chevening, 'de': de, 'uk': uk}


def test_scholarship_str_and_labels(data):
    assert str(data['daad']) == 'DAAD EPOS REM'
    assert data['daad'].score_label == 'Outstanding'
    assert data['chevening'].score_label == 'Outstanding'
    assert data['daad'].get_absolute_url() == '/scholarships/daad-epos-rem/'


def test_search_by_name(data):
    qs = search_scholarships(Scholarship.objects.all(), 'DAAD')
    assert list(qs) == [data['daad']]


def test_search_by_country_name(data):
    qs = search_scholarships(Scholarship.objects.all(), 'germany')
    assert list(qs) == [data['daad']]


def test_search_by_field(data):
    qs = search_scholarships(Scholarship.objects.all(), 'water')
    assert list(qs) == [data['daad']]


def test_search_empty(data):
    qs = search_scholarships(Scholarship.objects.all(), '')
    assert qs.count() == 2


def test_home_200(client, data):
    response = client.get(reverse('scholarships:home'))
    assert response.status_code == 200
    assert b'ScholarHub' in response.content


def test_directory_filters(client, data):
    url = reverse('scholarships:directory')
    assert client.get(url).status_code == 200
    filtered = client.get(url, {'country': 'DE'})
    assert b'DAAD' in filtered.content
    assert b'Chevening' not in filtered.content

    scored = client.get(url, {'min_score': 94})
    assert b'Chevening' in scored.content
    assert b'DAAD' not in scored.content

    searched = client.get(url, {'q': 'leadership'})
    assert b'Chevening' in searched.content


def test_detail_200(client, data):
    response = client.get(data['daad'].get_absolute_url())
    assert response.status_code == 200
    assert b'Renewable Energy' in response.content
    assert b'application/ld+json' in response.content  # structured data


def test_by_country_and_field(client, data):
    assert client.get(reverse('scholarships:by_country')).status_code == 200
    assert client.get(reverse('scholarships:by_field')).status_code == 200


def test_change_log_created_on_update(data):
    assert data['daad'].change_logs.count() == 0
    data['daad'].score = 90
    data['daad'].save()
    assert data['daad'].change_logs.filter(field_changed='score').exists()


def test_api_list_and_search(data):
    client = APIClient()
    response = client.get('/api/v1/scholarships/')
    assert response.status_code == 200
    assert response.data['count'] == 2

    search = client.get('/api/v1/search/', {'q': 'germany'})
    assert search.status_code == 200
    assert len(search.json()['results']) == 1

    open_now = client.get('/api/v1/scholarships/open_now/')
    assert open_now.status_code == 200
    assert open_now.data['count'] == 1

    top = client.get('/api/v1/scholarships/top/')
    assert top.status_code == 200
    assert top.data[0]['short_name'] == 'Chevening'  # highest score first

    countries = client.get('/api/v1/countries/')
    assert countries.status_code == 200
    assert countries.data['count'] == 2


def test_sitemap(client, data):
    response = client.get('/sitemap.xml')
    assert response.status_code == 200
    assert b'daad-epos-rem' in response.content
