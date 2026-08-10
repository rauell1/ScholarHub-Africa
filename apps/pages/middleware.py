"""
Security & abuse middleware (Track 3: Security Hardening).

  • SecurityHeadersMiddleware - CSP, Permissions-Policy, Referrer-Policy,
    nosniff on every response (baseline headers, 3.10). No raw errors or
    stack traces are ever returned (Django's DEBUG pages are dev-only; the
    500 handler renders a generic branded page).
  • RateLimitMiddleware - every public mutating POST is rate-limited per IP
    using the Django cache (a shared store in production: Redis/Memcached).
    Fails CLOSED: if the limiter itself errors, the request is rejected with
    429 rather than letting abuse through unthrottled.
"""
import re

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse, HttpResponseForbidden
from django.shortcuts import render

FILE_PATH_RE = re.compile(r'\.[a-zA-Z0-9]{2,5}$')

# Public mutating routes (authenticated tracker updates are session-owned
# and already protected by auth + ownership checks, so they are not throttled).
RATE_LIMITED_POST_PREFIXES = ('/contact', '/accounts/login')
RATE_LIMIT_MAX = 10          # requests per window
RATE_LIMIT_WINDOW = 60       # seconds
RATE_LIMIT_KEY = 'rl:{ip}:{path}'


class Branded404Middleware:
    """Branded 404 in every environment (see module docstring in earlier revision)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if response.status_code == 404:
            path = request.path
            if path.startswith('/api/') or path.startswith('/admin/'):
                return response
            if FILE_PATH_RE.search(path):
                return response
            return render(request, '404.html', status=404)
        return response


class SecurityHeadersMiddleware:
    """Baseline security headers on all routes (Security 3.10)."""

    CSP = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com data:; "
        "img-src 'self' data: https://www.google-analytics.com; "
        "connect-src 'self' https://www.google-analytics.com https://analytics.google.com; "
        "frame-src https://www.google.com https://www.google.com/maps; "
        "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    )
    PERMISSIONS_POLICY = (
        'camera=(), microphone=(), geolocation=(), payment=(), usb=(), '
        'interest-cohort=(), battery=(), gyroscope=(), accelerometer=()'
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Content-Security-Policy'] = self.CSP
        response['Permissions-Policy'] = self.PERMISSIONS_POLICY
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response['X-Content-Type-Options'] = 'nosniff'
        if getattr(settings, 'SECURE_SSL_REDIRECT', False) or not settings.DEBUG:
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response


class RateLimitMiddleware:
    """
    Rate-limit public mutating endpoints (Security 3.7).

    Fail closed: if the cache backend raises, we return 429 rather than
    letting the request through unthrottled. State lives in the shared
    Django cache (Redis/Memcached in production), not per-instance memory.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def _client_ip(self, request):
        forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

    def __call__(self, request):
        if request.method == 'POST' and request.path.startswith(RATE_LIMITED_POST_PREFIXES):
            ip = self._client_ip(request)
            key = RATE_LIMIT_KEY.format(ip=ip, path=request.path)
            try:
                hits = cache.get(key, 0)
                if hits >= RATE_LIMIT_MAX:
                    return JsonResponse(
                        {'detail': 'Too many requests. Please try again in a minute.'},
                        status=429,
                    )
                cache.set(key, hits + 1, RATE_LIMIT_WINDOW)
            except Exception:
                # Fail closed - limiter error must not mean "no limiter".
                return JsonResponse(
                    {'detail': 'Service busy. Please try again shortly.'},
                    status=429,
                )
        return self.get_response(request)
