"""
Weekly email digest (System Design v1.0 §15).

Runs every Monday 05:00 UTC (08:00 EAT) via Celery beat. When RESEND_API_KEY
is set, emails are sent through Resend; otherwise they fall back to Django's
email backend (console backend in local development).
"""
from datetime import timedelta

from celery import shared_task
from decouple import config
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from .models import Scholarship

DIGEST_LOOKAHEAD_DAYS = 60


def build_digest_context():
    """Collect the scholarships featured in the Monday briefing."""
    now = timezone.localdate()
    soon = now + timedelta(days=DIGEST_LOOKAHEAD_DAYS)
    last_week = now - timedelta(days=7)

    urgent = (
        Scholarship.objects
        .filter(
            is_active=True,
            deadline_date__gte=now,
            deadline_date__lte=soon,
            status__in=['open_now', 'opening_soon'],
        )
        .select_related('country')
        .order_by('deadline_date')[:10]
    )

    new_this_week = (
        Scholarship.objects
        .filter(
            is_active=True,
            updated_at__date__gte=last_week,
            status='open_now',
        )
        .select_related('country')
        .order_by('-score')[:5]
    )

    return {
        'generated_on': now,
        'urgent': urgent,
        'new_this_week': new_this_week,
        'lookahead_days': DIGEST_LOOKAHEAD_DAYS,
    }


def render_digest_email(context):
    return render_to_string('emails/weekly_digest.html', context)


def send_digest_emails():
    """Send the digest to every address in DIGEST_EMAILS (comma-separated)."""
    context = build_digest_context()
    subject = f"📚 Scholarship Digest - Week of {context['generated_on'].strftime('%d %b %Y')}"
    html_body = render_digest_email(context)

    recipients = settings.DIGEST_EMAILS or config('DIGEST_EMAILS', default='royokola3@gmail.com')

    resend_key = settings.RESEND_API_KEY
    if resend_key:
        import resend

        resend.api_key = resend_key
        for address in recipients:
            resend.Emails.send({
                'from': settings.DEFAULT_FROM_EMAIL,
                'to': [address],
                'subject': subject,
                'html': html_body,
            })
    else:
        send_mail(
            subject=subject,
            message='This digest is HTML - open it in an HTML-capable client.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=list(recipients),
            html_message=html_body,
        )
    return subject, len(recipients)


@shared_task
def send_weekly_digest():
    """Celery task - scheduled in CELERY_BEAT_SCHEDULE (settings/base.py)."""
    subject, count = send_digest_emails()
    return f'Sent "{subject}" to {count} recipient(s)'

@shared_task
def daily_crawl_scholarships():
    """Run the daily web crawler to fetch new scholarships."""
    from django.core.management import call_command
    call_command('crawl_scholarships')
    return 'Daily crawl completed.'
