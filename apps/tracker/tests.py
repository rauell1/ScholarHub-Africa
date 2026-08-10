"""Tests for the application tracker (System Design v1.0 §6.5)."""
import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient

from apps.scholarships.models import Country, Scholarship

from .models import ApplicantProfile, DocumentItem, TrackedApplication

User = get_user_model()


@pytest.fixture
def user_and_scholarship(db):
    user = User.objects.create_user(
        username='roy', email='roy@scholarhub.local', password='pass-12345'
    )
    country = Country.objects.create(
        name='Germany', iso_code='DE', flag_emoji='🇩🇪', region='Europe'
    )
    scholarship = Scholarship.objects.create(
        name='DAAD EPOS - Renewable Energy Management (REM)',
        short_name='DAAD EPOS REM',
        slug='daad-epos-rem',
        country=country,
        funding_type='full',
        eligibility_label='CE',
        score=93,
        status='open_now',
        deadline_date='2026-10-31',
        is_active=True,
    )
    return user, scholarship


def test_checklist_seeded_for_new_profile(db):
    user = User.objects.create_user(username='a', password='pass-12345')
    profile = ApplicantProfile.objects.create(user=user, email='a@x.com')
    assert profile.documents.count() == 24  # the standard 24-item checklist


def test_completion_percentage(user_and_scholarship):
    user, scholarship = user_and_scholarship
    profile = ApplicantProfile.objects.create(user=user, email='roy@x.com')
    app = TrackedApplication.objects.create(
        profile=profile, scholarship=scholarship, stage='drafting',
        sop_status='done', refs_status='received', transcript_ready=True,
        moi_ready=True,
    )
    assert 70 <= app.completion_percentage <= 100


def test_tracker_add_update_remove(client, user_and_scholarship):
    user, scholarship = user_and_scholarship
    client.force_login(user)

    response = client.post(reverse('tracker:add', args=[scholarship.id]))
    assert response.status_code == 302
    profile = ApplicantProfile.objects.get(user=user)
    application = TrackedApplication.objects.get(profile=profile)

    response = client.post(reverse('tracker:update', args=[application.id]), {
        'stage': 'submitted', 'priority': 'target', 'sop_status': 'done',
        'refs_status': 'requested', 'transcript_ready': 'on', 'moi_ready': '',
        'next_action': 'Wait for decision', 'next_action_due': '2026-12-01',
        'notes': '',
    })
    assert response.status_code == 302
    application.refresh_from_db()
    assert application.stage == 'submitted'

    response = client.post(reverse('tracker:remove', args=[application.id]))
    assert response.status_code == 302
    assert not TrackedApplication.objects.filter(id=application.id).exists()


def test_tracker_requires_login(client):
    assert client.get(reverse('tracker:dashboard')).status_code == 302


def test_checklist_status_update(client, user_and_scholarship):
    user, _ = user_and_scholarship
    client.force_login(user)
    profile = ApplicantProfile.objects.create(user=user, email='roy@x.com')
    doc = DocumentItem.objects.filter(profile=profile).first()
    response = client.post(reverse('tracker:checklist'), {
        'document_id': doc.id, 'status': 'ready',
    })
    assert response.status_code == 302
    doc.refresh_from_db()
    assert doc.status == 'ready'


def test_tracker_api_auth_required(db):
    client = APIClient()
    assert client.get('/api/v1/tracker/applications/').status_code == 403


def test_tracker_api_crud(client, user_and_scholarship):
    user, scholarship = user_and_scholarship
    client.force_login(user)
    api = APIClient()
    api.force_authenticate(user=user)

    response = api.post('/api/v1/tracker/applications/', {
        'scholarship': scholarship.id, 'stage': 'planning', 'priority': 'reach',
    }, format='json')
    assert response.status_code == 201
    application_id = response.data['id']

    response = api.patch(f'/api/v1/tracker/applications/{application_id}/', {
        'stage': 'drafting',
    }, format='json')
    assert response.status_code == 200
    assert response.data['stage'] == 'drafting'
