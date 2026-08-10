"""
Tracker views (System Design v1.0 §6.5) - private, login required.

Dashboard (kanban-style stage columns) and the 24-item document checklist.
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from apps.scholarships.models import Scholarship

from .forms import TrackedApplicationForm
from .models import ApplicantProfile, DocumentItem, TrackedApplication

COLUMNS = [
    ('planning', 'Planning'),
    ('drafting', 'Drafting'),
    ('submitted', 'Submitted'),
    ('decision', 'Decision'),
]

DECISION_STAGES = ['interview', 'awarded', 'rejected', 'withdrawn']


def get_or_create_profile(user):
    profile, created = ApplicantProfile.objects.get_or_create(
        user=user,
        defaults={
            'email': user.email or f'{user.username}@scholarhub.local',
            'full_name': user.get_full_name() or user.username,
        },
    )
    return profile, created


@login_required
def dashboard(request):
    profile, created = get_or_create_profile(request.user)
    if created:
        messages.info(request, 'Welcome! Your profile and 24-item document checklist were created.')

    apps_qs = TrackedApplication.objects.filter(profile=profile).select_related(
        'scholarship', 'scholarship__country'
    )
    columns = []
    for key, label in COLUMNS:
        if key == 'decision':
            items = apps_qs.filter(stage__in=DECISION_STAGES)
        else:
            items = apps_qs.filter(stage=key)
        columns.append({'key': key, 'label': label, 'applications': items})

    open_count = apps_qs.exclude(stage__in=['awarded', 'rejected', 'withdrawn']).count()
    return render(request, 'tracker/dashboard.html', {
        'profile': profile,
        'columns': columns,
        'open_count': open_count,
        'total_count': apps_qs.count(),
        'created': created,
    })


@login_required
@require_POST
def add_application(request, scholarship_id):
    profile, _ = get_or_create_profile(request.user)
    scholarship = get_object_or_404(Scholarship, id=scholarship_id)
    obj, created = TrackedApplication.objects.get_or_create(
        profile=profile, scholarship=scholarship,
        defaults={'stage': 'planning', 'priority': 'target'},
    )
    if created:
        messages.success(request, f'Added “{scholarship}” to your tracker.')
    else:
        messages.info(request, f'“{scholarship}” is already in your tracker.')
    return redirect('tracker:dashboard')


@login_required
@require_POST
def update_application(request, application_id):
    application = get_object_or_404(
        TrackedApplication, id=application_id, profile__user=request.user
    )
    form = TrackedApplicationForm(request.POST, instance=application)
    if form.is_valid():
        form.save()
        messages.success(request, 'Application updated.')
    else:
        messages.error(request, 'Could not update - please check the form.')
    return redirect('tracker:dashboard')


@login_required
@require_POST
def remove_application(request, application_id):
    application = get_object_or_404(
        TrackedApplication, id=application_id, profile__user=request.user
    )
    application.delete()
    messages.success(request, 'Application removed from tracker.')
    return redirect('tracker:dashboard')


@login_required
def checklist(request):
    profile, created = get_or_create_profile(request.user)
    documents = profile.documents.all()

    if request.method == 'POST':
        doc_id = request.POST.get('document_id')
        status = request.POST.get('status')
        if doc_id and status in dict(DocumentItem.STATUS_CHOICES):
            DocumentItem.objects.filter(profile=profile, id=doc_id).update(status=status)
            messages.success(request, 'Checklist updated.')
        return redirect('tracker:checklist')

    counts = {
        'ready': documents.filter(status='ready').count(),
        'in_progress': documents.filter(status='in_progress').count(),
        'not_started': documents.filter(status='not_started').count(),
        'not_needed': documents.filter(status='not_needed').count(),
    }
    return render(request, 'tracker/checklist.html', {
        'profile': profile,
        'documents': documents,
        'counts': counts,
    })
