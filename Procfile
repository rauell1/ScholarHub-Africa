web: gunicorn scholarhub.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120
worker: celery -A scholarhub worker --loglevel=info
beat: celery -A scholarhub beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
