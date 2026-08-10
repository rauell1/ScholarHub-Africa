"""
Local development settings (System Design v1.0 §17).

Used automatically by `python manage.py runserver`.
"""
from .base import *  # noqa: F401,F403

DEBUG = True

# Allow the dev server to be reached from any host (incl. the preview proxy).
ALLOWED_HOSTS = ['*']

# Local SQLite by default; set DATABASE_URL to use a local/Neon PostgreSQL.
DATABASES = {
    'default': dj_database_url.config(  # noqa: F405
        default='sqlite:///db.sqlite3',
    )
}

# Emails print to the terminal instead of being sent.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
