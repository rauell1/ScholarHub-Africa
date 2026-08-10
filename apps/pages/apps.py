from django.apps import AppConfig


class PagesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pages'
    verbose_name = 'Pages (About, FAQ, Contact, Legal, SEO)'
