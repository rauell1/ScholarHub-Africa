"""ASGI config for ScholarHub Africa."""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'scholarhub.settings.production')

application = get_asgi_application()
