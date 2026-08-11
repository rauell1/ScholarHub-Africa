from django.contrib import admin
from django.contrib.sitemaps.views import sitemap
from django.urls import include, path

from apps.scholarships.sitemaps import ScholarshipSitemap, StaticViewSitemap
from apps.scholarships.views_cron import cron_weekly_digest, cron_daily_crawl

sitemaps = {
    'scholarships': ScholarshipSitemap,
    'static': StaticViewSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('apps.scholarships.urls')),
    path('', include('apps.pages.urls')),
    path('tracker/', include('apps.tracker.urls')),
    path('accounts/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.scholarships.api_urls')),
    path('api/v1/tracker/', include('apps.tracker.api_urls')),
    path('api/cron/weekly-digest/', cron_weekly_digest, name='cron_weekly_digest'),
    path('api/cron/daily-crawl/', cron_daily_crawl, name='cron_daily_crawl'),
    path(
        'sitemap.xml',
        sitemap,
        {'sitemaps': sitemaps},
        name='django.contrib.sitemaps.views.sitemap',
    ),
]

handler404 = 'apps.pages.views.handler404'
handler500 = 'apps.pages.views.handler500'
