"""
Sitemaps (System Design v1.0 §19) — auto-generated via django.contrib.sitemaps.
"""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Country, Scholarship
class ScholarshipSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Scholarship.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at


class CountrySitemap(Sitemap):
    changefreq = 'monthly'
    priority = 0.6

    def items(self):
        return Country.objects.all()


class StaticViewSitemap(Sitemap):
    priority = 1.0
    changefreq = 'daily'

    def items(self):
        return ['scholarships:home', 'scholarships:directory',
                'scholarships:by_country', 'scholarships:by_field']

    def location(self, item):
        return reverse(item)
