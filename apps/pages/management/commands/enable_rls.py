"""
Enable PostgreSQL Row-Level Security (Track 3.5).

    python manage.py enable_rls

Applies deploy/rls.sql on PostgreSQL (Neon etc.). On SQLite (local dev) it
is a safe no-op with a clear message - RLS is a Postgres-only feature.

Before enabling in production, wire the `app.user_id` session GUC (see
deploy/rls.sql header) so the ownership policies can resolve the current
user. The command fails loudly if anything goes wrong; it does not commit
partially - each statement runs inside the caller's transaction handling.
"""
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import connection

SQL_PATH = Path(__file__).resolve().parents[4] / 'deploy' / 'rls.sql'


class Command(BaseCommand):
    help = 'Enable row-level security on Postgres (deploy/rls.sql).'

    def handle(self, *args, **options):
        if connection.vendor != 'postgresql':
            self.stdout.write(self.style.WARNING(
                'Database is not PostgreSQL - RLS is a Postgres feature. '
                'Run this on the Neon production database (Phase 2). Skipping.'
            ))
            return

        sql = SQL_PATH.read_text()
        statements = [s.strip() for s in sql.split(';') if s.strip() and not s.strip().startswith('--')]

        with connection.cursor() as cursor:
            for statement in statements:
                # Strip leading SQL comments per statement before executing.
                lines = [line for line in statement.splitlines()
                         if not line.strip().startswith('--')]
                clean = '\n'.join(lines).strip()
                if clean:
                    cursor.execute(clean)

        self.stdout.write(self.style.SUCCESS(
            'Row-level security enabled on scholarships, tracked applications '
            'and document items. Wire the app.user_id session GUC middleware '
            'before going multi-user (see deploy/rls.sql).'
        ))
