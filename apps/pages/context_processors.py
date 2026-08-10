"""
Site-wide context for marketing/SEO templates (exposed to every render).
Values come from settings/env so nothing sensitive is hard-coded.

Also computes `site.ga4_allowed`: GA4 loads ONLY when the visitor's consent
cookie (set by the Consent Manager, `sh_consent`) grants the analytics
category. No choice / Reject → False → the snippet is never rendered and no
analytics data is collected (GDPR strict opt-in).
"""
import json

from django.conf import settings


def _analytics_consented(request) -> bool:
    raw = request.COOKIES.get('sh_consent')
    if not raw:
        return False
    try:
        state = json.loads(raw)
    except (ValueError, TypeError):
        return False
    return bool(state.get('analytics'))


def site_settings(request):
    return {
        'site': {
            'name': 'ScholarHub Africa',
            'domain': settings.SITE_DOMAIN,
            'tagline': (
                "Fully-funded master's scholarships for African students - "
                'human-verified, scored for fit.'
            ),
            'email': settings.COMPANY_EMAIL,
            'phone': settings.COMPANY_PHONE,
            'address': settings.COMPANY_ADDRESS,
            'hours': 'Mon–Fri, 9:00–18:00 EAT',
            'ga4_measurement_id': getattr(settings, 'GA4_MEASUREMENT_ID', ''),
            'ga4_allowed': bool(
                getattr(settings, 'GA4_MEASUREMENT_ID', '')
            ) and _analytics_consented(request),
        },
    }
