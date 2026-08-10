"""
Sitemaps (SEO Track 1.2) — auto-generated via django.contrib.sitemaps.

Lists ONLY canonical, indexable URLs:
  • home, directory, by-country, by-field
  • marketing pages (about, faq, contact, case studies, privacy)
  • every active scholarship detail page
Query-string variants (filtered directory URLs) are deliberately excluded —
they are not canonical.
"""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from .models import Scholarship


class ScholarshipSitemap(Sitemap):
    changefreq = 'weekly'
    priority = 0.8

    def items(self):
        return Scholarship.objects.filter(is_active=True)

    def lastmod(self, obj):
        return obj.updated_at


class StaticViewSitemap(Sitemap):
    priority = 1.0
    changefreq = 'daily'

    def items(self):
        return [
            'scholarships:home',
            'scholarships:directory',
            'scholarships:by_country',
            'scholarships:by_field',
            'pages:about',
            'pages:faq',
            'pages:contact',
            'pages:case_studies',
            'pages:privacy',
        ]

    def location(self, item):
        return reverse(item)
