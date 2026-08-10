"""
Reusable template tags for the pages app (breadcrumbs + helpers).
"""
from django import template
from django.utils.html import escape

register = template.Library()


@register.inclusion_tag('components/breadcrumbs.html', takes_context=True)
def breadcrumbs(context, items, current=None):
    """
    Render a semantic breadcrumb trail with BreadcrumbList JSON-LD.

    Usage: {% load pages_tags %}
           {% breadcrumbs items=breadcrumbs_items current=page_title %}
    `items`   - list of (label, url) tuples; url may be '' or None for plain text.
    `current` - label of the current page (rendered as the last, non-linked crumb).
    """
    crumbs = []
    for index, (label, url) in enumerate(list(items or []), start=1):
        crumbs.append({'position': index, 'name': str(label), 'url': (url or '')})
    if current:
        crumbs.append({'position': len(crumbs) + 1, 'name': str(current), 'url': ''})
    return {
        'crumbs': crumbs,
        'current': current,
        'request': context.get('request'),
    }


@register.filter
def crumb_name(item):
    return escape(item['name'])
