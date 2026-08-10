"""
Celery application for ScholarHub Africa.

Used for async tasks: weekly email digest, score recalculation,
data verification checks (System Design v1.0 §15).
"""
import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'scholarhub.settings.local')

app = Celery('scholarhub')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
