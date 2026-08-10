"""
ScholarHub Africa — shared settings.

Settings are split across three modules (System Design v1.0 §5):
  base.py       — everything shared between environments
  local.py      — local development overrides
  production.py — production overrides (Neon, Cloudflare R2, email, security)
"""
from datetime import timedelta  # noqa: F401  (used by CELERY_BEAT_SCHEDULE)
from pathlib import Path

import dj_database_url
from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------
SECRET_KEY = config('SECRET_KEY', default='dev-insecure-secret-key-change-me')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=Csv(),
)

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',

    # Third party
    'rest_framework',
    'django_filters',
    'django_extensions',
    'django_celery_beat',

    # Local apps
    'apps.scholarships',
    'apps.tracker',
    'apps.accounts',
    'apps.pages',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.pages.middleware.Branded404Middleware',
]

ROOT_URLCONF = 'scholarhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'apps.pages.context_processors.site_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'scholarhub.wsgi.application'
ASGI_APPLICATION = 'scholarhub.asgi.application'

# ---------------------------------------------------------------------------
# Database — local defaults to SQLite; production uses Neon PostgreSQL
# (System Design v1.0 §4, §16.4)
# ---------------------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LOGIN_URL = 'accounts:login'
LOGIN_REDIRECT_URL = 'scholarships:home'
LOGOUT_REDIRECT_URL = 'scholarships:home'

# ---------------------------------------------------------------------------
# Internationalisation
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'en-gb'
TIME_ZONE = 'Africa/Nairobi'  # EAT
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static files (System Design v1.0 §5)
# ---------------------------------------------------------------------------
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {
        'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# Django REST Framework (System Design v1.0 §7)
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
}

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:8000,http://127.0.0.1:8000',
    cast=Csv(),
)

# ---------------------------------------------------------------------------
# Celery (System Design v1.0 §15)
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

from celery.schedules import crontab  # noqa: E402

CELERY_BEAT_SCHEDULE = {
    'weekly-digest': {
        'task': 'apps.scholarships.tasks.send_weekly_digest',
        # 05:00 UTC Monday = 08:00 EAT Monday
        'schedule': crontab(hour=5, minute=0, day_of_week=1),
    },
}

# ---------------------------------------------------------------------------
# Email (System Design v1.0 §15)
# ---------------------------------------------------------------------------
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)
DEFAULT_FROM_EMAIL = config(
    'DEFAULT_FROM_EMAIL',
    default='ScholarHub Africa <digest@scholarhub.africa>',
)

# Resend API key — used directly by the weekly digest task (never commit it)
RESEND_API_KEY = config('RESEND_API_KEY', default='')
DIGEST_EMAILS = config('DIGEST_EMAILS', default='royokola3@gmail.com', cast=Csv())

# ---------------------------------------------------------------------------
# Marketing / SEO (System Design v1.0 §19)
# ---------------------------------------------------------------------------
# Google Analytics 4 measurement ID — empty locally, set in production.
# The snippet renders in <head> only when this is configured.
GA4_MEASUREMENT_ID = config('GA4_MEASUREMENT_ID', default='')

# Site identity used by the SEO/marketing context processor.
SITE_DOMAIN = config('SITE_DOMAIN', default='scholarhub.africa')
COMPANY_PHONE = config('COMPANY_PHONE', default='+254 700 123 456')
COMPANY_ADDRESS = config('COMPANY_ADDRESS', default='Westlands, Nairobi, Kenya')
COMPANY_EMAIL = config('COMPANY_EMAIL', default='hello@scholarhub.africa')
