"""
Production settings (System Design v1.0 §16).

Expects environment variables provided by the Railway dashboard / CI:
  DATABASE_URL  (Neon PostgreSQL)
  SECRET_KEY
  ALLOWED_HOSTS
  CLOUDFLARE_R2_*  (static asset hosting)
  RESEND_API_KEY
  REDIS_URL
"""
from .base import *  # noqa: F401,F403
from decouple import Csv, config

DEBUG = False

ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='scholarhub.africa,www.scholarhub.africa',
    cast=Csv(),
)

# ---------------------------------------------------------------------------
# Neon PostgreSQL (System Design v1.0 §16.4)
# ---------------------------------------------------------------------------
DATABASES = {
    'default': dj_database_url.parse(  # noqa: F405
        config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
        options={'sslmode': 'require'},
    )
}

# ---------------------------------------------------------------------------
# Security (Cloudflare in front terminates TLS — proxy sees https)
# ---------------------------------------------------------------------------
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# ---------------------------------------------------------------------------
# Cloudflare R2 — static/media assets served from the edge (System Design §3)
# ---------------------------------------------------------------------------
if config('CLOUDFLARE_R2_BUCKET', default=''):
    import django_storages  # noqa: F401

    AWS_ACCESS_KEY_ID = config('CLOUDFLARE_R2_ACCESS_KEY')
    AWS_SECRET_ACCESS_KEY = config('CLOUDFLARE_R2_SECRET_KEY')
    AWS_STORAGE_BUCKET_NAME = config('CLOUDFLARE_R2_BUCKET')
    AWS_S3_ENDPOINT_URL = config('CLOUDFLARE_R2_ENDPOINT')
    AWS_S3_CUSTOM_DOMAIN = config('CLOUDFLARE_R2_CUSTOM_DOMAIN', default='')
    AWS_DEFAULT_ACL = 'public-read'
    AWS_QUERYSTRING_AUTH = False

    STORAGES = {
        'default': {'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage'},
        'staticfiles': {'BACKEND': 'storages.backends.s3boto3.S3StaticStorage'},
    }
else:
    # Whitenoise serves compressed, hashed static files from the Django app.
    STORAGES = {
        'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
        'staticfiles': {
            'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage',
        },
    }
