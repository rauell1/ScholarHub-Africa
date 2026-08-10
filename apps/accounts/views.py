"""
Accounts (System Design v1.0 §1.4 — Phase 2 public).

Phase 1 uses Django's built-in auth for the single private user.
Phase 2 will add registration, Google OAuth and profile management.
"""
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render


@login_required
def profile(request):
    from apps.tracker.models import ApplicantProfile

    profile = ApplicantProfile.objects.filter(user=request.user).first()
    return render(request, 'accounts/profile.html', {
        'user': request.user,
        'profile': profile,
    })


@login_required
def demo_login_notice(request):
    messages.info(request, 'Phase 2 registration is coming — email + Google OAuth.')
    return render(request, 'accounts/profile.html', {'user': request.user})
