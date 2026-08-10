"""
Full-text search (System Design v1.0 §8).

Phase 1 — PostgreSQL full-text search via SearchVector/SearchRank with a
transparent fallback to `icontains` for local SQLite development, so the
same code runs everywhere. Swap the backend for Meilisearch in Phase 2
without touching the API.
"""
from django.db import connection
from django.db.models import Q


def search_scholarships(queryset, query_string):
    """Rank scholarships by relevance to `query_string` (or return unchanged)."""
    query_string = (query_string or '').strip()
    if not query_string:
        return queryset

    if connection.vendor == 'postgresql':
        from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector

        vector = (
            SearchVector('name', weight='A')
            + SearchVector('short_name', weight='A')
            + SearchVector('programme', weight='B')
            + SearchVector('university', weight='B')
            + SearchVector('notes', weight='C')
            + SearchVector('funding_detail', weight='D')
        )
        search_query = SearchQuery(query_string, config='english')
        return (
            queryset
            .annotate(rank=SearchRank(vector, search_query))
            .filter(rank__gte=0.001)
            .order_by('-rank', '-score')
        )

    # Fallback (SQLite / local dev): simple tokenised icontains.
    terms = query_string.split()
    combined = Q()
    for term in terms:
        combined &= (
            Q(name__icontains=term)
            | Q(short_name__icontains=term)
            | Q(programme__icontains=term)
            | Q(university__icontains=term)
            | Q(country__name__icontains=term)
            | Q(fields__name__icontains=term)
            | Q(notes__icontains=term)
        )
    return queryset.filter(combined).distinct().order_by('-score')
