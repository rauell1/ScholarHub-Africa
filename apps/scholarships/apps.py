from django.apps import AppConfig


class ScholarshipsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.scholarships'
    verbose_name = 'Scholarships'

    def ready(self):
        from . import signals  # noqa: F401  (registers change-log signal)
