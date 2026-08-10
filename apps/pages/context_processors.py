"""
Site-wide context for marketing/SEO templates (exposed to every render).
Values come from settings/env so nothing sensitive is hard-coded.
"""
from django.conf import settings


def site_settings(request):
    return {
        'site': {
            'name': 'ScholarHub Africa',
            'domain': settings.SITE_DOMAIN,
            'tagline': (
                "Fully-funded master's scholarships for African students — "
                'human-verified, scored for fit.'
            ),
            'email': settings.COMPANY_EMAIL,
            'phone': settings.COMPANY_PHONE,
            'address': settings.COMPANY_ADDRESS,
            'hours': 'Mon–Fri, 9:00–18:00 EAT',
            'ga4_measurement_id': getattr(settings, 'GA4_MEASUREMENT_ID', ''),
        },
    }
