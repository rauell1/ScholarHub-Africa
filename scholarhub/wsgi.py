"""WSGI config for ScholarHub Africa."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'scholarhub.settings.production')

application = get_wsgi_application()
