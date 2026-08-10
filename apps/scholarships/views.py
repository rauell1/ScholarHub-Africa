"""
Public views (System Design v1.0 §6).

Homepage, directory (search + filters), detail, by-country and by-field pages.
All server-rendered HTML for speed and SEO.
"""
from django.core.paginator import Paginator
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, render
from django.urls import reverse
from django.views.decorators.http import require_GET

from .filters import ScholarshipFilter
from .models import Country, FieldOfStudy, Scholarship
from .search import search_scholarships

DIRECTORY_PAGE_SIZE = 12

ORDERING_CHOICES = {
    'score': '-score',
    '-score': '-score',
    'deadline': 'deadline_date',
    '-deadline': '-deadline_date',
    'name': 'name',
    '-name': '-name',
    'updated': '-updated_at',
}


def _visible_scholarships():
    return Scholarship.objects.filter(is_active=True)


def home(request):
    countries = (
        Country.objects
        .annotate(count=Count('scholarships', filter=Q(scholarships__is_active=True)))
        .filter(count__gt=0)
        .order_by('name')
    )
    fields = FieldOfStudy.objects.annotate(count=Count('scholarships')).filter(count__gt=0)
    # Batch related lookups - no per-card queries (Performance 4.4)
    open_now = (
        _visible_scholarships()
        .filter(status='open_now')
        .select_related('country')
        .prefetch_related('fields')
        .order_by('deadline_date')[:6]
    )
    featured = (
        _visible_scholarships()
        .filter(is_featured=True)
        .select_related('country')
        .prefetch_related('fields')
        .order_by('-score')[:4]
    )

    # Aggregations in SQL (Performance 4.5)
    stats = {
        'scholarships': _visible_scholarships().count(),
        'countries': countries.count(),
        'open_now': _visible_scholarships().filter(status='open_now').count(),
        'verified': _visible_scholarships().filter(is_verified=True).count(),
    }
    return render(request, 'scholarships/home.html', {
        'countries': countries,
        'fields': fields,
        'open_now': open_now,
        'featured': featured,
        'stats': stats,
    })


@require_GET
def directory(request):
    """Filterable, searchable listing of all active scholarships."""
    qs = _visible_scholarships().select_related('country').prefetch_related('fields')

    query = request.GET.get('q', '').strip()
    if query:
        qs = search_scholarships(qs, query)

    filterset = ScholarshipFilter(request.GET, queryset=qs)
    qs = filterset.qs.distinct()

    ordering = ORDERING_CHOICES.get(request.GET.get('ordering', ''), '-score')
    qs = qs.order_by(ordering)

    paginator = Paginator(qs, DIRECTORY_PAGE_SIZE)
    page_obj = paginator.get_page(request.GET.get('page'))

    def _page_url(number):
        params = request.GET.copy()
        params['page'] = str(number)
        return f'?{params.urlencode()}'

    page_urls = {
        'prev': _page_url(page_obj.previous_page_number) if page_obj.has_previous() else None,
        'next': _page_url(page_obj.next_page_number) if page_obj.has_next() else None,
    }

    filter_data = {
        'countries': [
            {'iso_code': c.iso_code, 'name': c.name, 'flag_emoji': c.flag_emoji,
             'count': c.count}
            for c in Country.objects.annotate(count=Count('scholarships')).filter(count__gt=0)
        ],
        'fields': [
            {'slug': f.slug, 'name': f.name, 'icon': f.icon, 'count': f.count}
            for f in FieldOfStudy.objects.annotate(count=Count('scholarships')).filter(count__gt=0)
        ],
    }

    label = query or 'Directory'
    if query:
        label = f'Search: {query}'
    return render(request, 'scholarships/directory.html', {
        'page_obj': page_obj,
        'filter': filterset,
        'filter_data': filter_data,
        'query': query,
        'ordering': request.GET.get('ordering', 'score'),
        'total_count': paginator.count,
        'page_urls': page_urls,
        'breadcrumbs_items': [('Home', reverse('scholarships:home'))],
        'breadcrumbs_current': label,
    })


def detail(request, slug):
    qs = Scholarship.objects.select_related('country').prefetch_related(
        'fields', 'change_logs'
    )
    if not (request.user.is_authenticated and request.user.is_staff):
        qs = qs.filter(is_active=True)
    scholarship = get_object_or_404(qs, slug=slug)

    # Internal linking (UX checklist #3): related scholarships sharing a
    # field of study or destination country with this one.
    # select_related + prefetch_related avoid N+1 on the card renders.
    related = (
        Scholarship.objects
        .filter(is_active=True)
        .filter(Q(fields__in=scholarship.fields.all()) | Q(country=scholarship.country))
        .exclude(pk=scholarship.pk)
        .select_related('country')
        .prefetch_related('fields')
        .distinct()
        .order_by('-score')[:3]
    )
    return render(request, 'scholarships/detail.html', {
        'scholarship': scholarship,
        'change_logs': scholarship.change_logs.all()[:12],
        'related': related,
        'breadcrumbs_items': [
            ('Home', reverse('scholarships:home')),
            ('Scholarships', reverse('scholarships:directory')),
        ],
        'breadcrumbs_current': scholarship.short_name or scholarship.name,
    })


def by_country(request):
    """Group scholarships by destination country (System Design v1.0 §6.4)."""
    rows = (
        _visible_scholarships()
        .values('country_id', 'country__name', 'country__flag_emoji',
                'country__region', 'country__iso_code')
        .annotate(count=Count('id'))
        .order_by('country__region', 'country__name')
    )
    grouped = {}
    for row in rows:
        grouped.setdefault(row['country__region'], []).append({
            'name': row['country__name'],
            'flag_emoji': row['country__flag_emoji'],
            'iso_code': row['country__iso_code'],
            'count': row['count'],
        })

    region_order = ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania']
    ordered = [(r, grouped[r]) for r in region_order if r in grouped]
    for region, items in grouped.items():
        if region not in region_order:
            ordered.append((region, items))

    return render(request, 'scholarships/by_country.html', {'regions': ordered})


def by_field(request):
    """Group scholarships by field of study."""
    rows = (
        _visible_scholarships()
        .values('fields__slug', 'fields__name', 'fields__icon')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    items = [
        {'slug': r['fields__slug'], 'name': r['fields__name'],
         'icon': r['fields__icon'] or '📘', 'count': r['count']}
        for r in rows if r['fields__slug']
    ]
    return render(request, 'scholarships/by_field.html', {'fields': items})
