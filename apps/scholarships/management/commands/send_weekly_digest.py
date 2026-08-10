"""
Trigger the weekly digest on demand (System Design v1.0 §15).

    python manage.py send_weekly_digest            # run synchronously
    python manage.py send_weekly_digest --async    # dispatch to Celery

In production the digest is scheduled automatically by Celery beat every
Monday 05:00 UTC (08:00 EAT).
"""
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Send the weekly Monday scholarship digest.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--async', action='store_true',
            help='Dispatch to Celery instead of sending synchronously.',
        )

    def handle(self, *args, **options):
        from apps.scholarships.tasks import send_digest_emails, send_weekly_digest

        if options['async']:
            task = send_weekly_digest.delay()
            self.stdout.write(self.style.SUCCESS(
                f'Dispatched digest task {task.id} to Celery.'
            ))
            return

        subject, count = send_digest_emails()
        self.stdout.write(self.style.SUCCESS(
            f'Sent "{subject}" to {count} recipient(s).'
        ))
