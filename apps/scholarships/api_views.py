"""
API views (System Design v1.0 §7).

Base URL: /api/v1/
"""
from django.db.models import Count, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import ScholarshipFilter
from .models import Country, FieldOfStudy, Scholarship
from .search import search_scholarships
from .serializers import (
    CountrySerializer,
    FieldOfStudySerializer,
    ScholarshipDetailSerializer,
    ScholarshipListSerializer,
)


class ScholarshipViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/scholarships/ - filterable, searchable, paginated."""
    queryset = (
        Scholarship.objects
        .filter(is_active=True)
        .select_related('country')
        .prefetch_related('fields')
        .order_by('-score')
    )
    filterset_class = ScholarshipFilter
    ordering_fields = ['score', 'deadline_date', 'name']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ScholarshipDetailSerializer
        return ScholarshipListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('search') or self.request.query_params.get('q')
        if q:
            qs = search_scholarships(qs, q)
        return qs

    @action(detail=False)
    def open_now(self, request):
        qs = self.get_queryset().filter(status='open_now').order_by('deadline_date')
        page = self.paginate_queryset(qs)
        serializer = ScholarshipListSerializer(page or qs, many=True)
        return self.get_paginated_response(serializer.data) if page else Response(serializer.data)

    @action(detail=False)
    def top(self, request):
        qs = self.get_queryset()[:20]
        serializer = ScholarshipListSerializer(qs, many=True)
        return Response(serializer.data)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/countries/ - all countries + scholarship counts."""
    queryset = (
        Country.objects
        .annotate(scholarship_count=Count('scholarships', filter=Q(scholarships__is_active=True)))
        .filter(scholarship_count__gt=0)
    )
    serializer_class = CountrySerializer
    lookup_field = 'iso_code'


class FieldViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/fields/ - all fields of study."""
    queryset = FieldOfStudy.objects.annotate(
        scholarship_count=Count('scholarships')
    ).filter(scholarship_count__gt=0)
    serializer_class = FieldOfStudySerializer
    lookup_field = 'slug'


class SearchView(APIView):
    """GET /api/v1/search/?q=<query> - full-text search endpoint."""

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': []})
        qs = search_scholarships(
            Scholarship.objects.filter(is_active=True)
            .select_related('country')
            .prefetch_related('fields'),
            query,
        )[:10]
        return Response({'query': query, 'results': ScholarshipListSerializer(qs, many=True).data})
