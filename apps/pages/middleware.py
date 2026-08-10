"""
Middleware — branded 404 page in every environment.

Django only invokes `handler404` when DEBUG=False (in DEBUG it shows the
technical 404 debug page). This middleware renders the custom 404 template
even in development/preview, so the branded page is always what users see.

Pass-through rules (never hijack):
  • /api/*          → JSON APIs must return their own 404s
  • /admin/*        → Django Admin has its own error handling
  • paths with a file extension (missing .css/.js/.png …) → plain 404
"""
import re

from django.shortcuts import render

FILE_PATH_RE = re.compile(r'\.[a-zA-Z0-9]{2,5}$')


class Branded404Middleware:
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
