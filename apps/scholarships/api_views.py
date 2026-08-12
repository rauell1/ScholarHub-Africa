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


class CSVUploadView(APIView):
    """POST /api/v1/scholarships/upload_csv/ - Admin CSV upload endpoint."""

    def post(self, request):
        from decouple import config
        from openai import OpenAI
        import json
        import pandas as pd
        import io
        from .models import Country, FieldOfStudy, Scholarship

        if 'file' not in request.FILES:
            return Response({'error': 'No file uploaded'}, status=400)
            
        file_obj = request.FILES['file']
        
        try:
            # Read CSV content
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)
                
            csv_text = df.to_csv(index=False)
            
            # Use NVIDIA NIM to parse the structured content
            nvidia_api_key = config('NVIDIA_API_KEY', default='')
            if not nvidia_api_key:
                return Response({'error': 'NVIDIA_API_KEY is missing from environment.'}, status=500)

            client = OpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=nvidia_api_key
            )
            
            # Truncate text if too large (approx limit)
            csv_text = csv_text[:20000]

            completion = client.chat.completions.create(
                model="meta/llama-3.3-70b-instruct",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a data extraction assistant. You will be provided a CSV of scholarships. Return a valid JSON array of objects. Each object must have: name, short_name, country_name, funding_type (full, partial, tuition_only), eligibility_label (CE, LE, PE, NE), english_requirement, deadline_date (YYYY-MM-DD or null), score (integer)."
                    },
                    {
                        "role": "user",
                        "content": f"Extract scholarships from this CSV data:\\n\\n{csv_text}"
                    }
                ],
                temperature=0.1,
                max_tokens=4096
            )

            result_text = completion.choices[0].message.content
            # Clean up potential markdown formatting from LLM
            if result_text.startswith("```json"):
                result_text = result_text.strip("```json").strip("```").strip()
                
            try:
                data = json.loads(result_text)
                if not isinstance(data, list):
                    data = [data]
            except json.JSONDecodeError:
                return Response({'error': 'Failed to parse AI output', 'raw': result_text}, status=500)

            created_count = 0
            for item in data:
                if not item.get('name'): continue
                
                country, _ = Country.objects.get_or_create(
                    name=item.get('country_name', 'Various'), 
                    defaults={"iso_code": item.get('country_name', 'Various')[:2].upper(), "flag_emoji": "🌍"}
                )
                
                deadline_str = item.get('deadline_date')
                deadline_date = None
                if deadline_str:
                    try:
                        from datetime import datetime
                        deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d").date()
                    except:
                        pass
                
                scholarship, created = Scholarship.objects.get_or_create(
                    name=item.get('name')[:300],
                    defaults={
                        'short_name': item.get('short_name', '')[:100],
                        'country': country,
                        'funding_type': item.get('funding_type', 'full')[:20],
                        'eligibility_label': item.get('eligibility_label', 'PE')[:2],
                        'english_requirement': item.get('english_requirement', ''),
                        'deadline_date': deadline_date,
                        'score': item.get('score', 70),
                        'status': 'open_now',
                        'is_verified': True,
                        'verified_source': 'Admin CSV Upload'
                    }
                )
                if created:
                    created_count += 1

            return Response({'status': 'success', 'created': created_count})
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
