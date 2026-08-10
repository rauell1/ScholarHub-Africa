"""
django-filter FilterSet (System Design v1.0 §9).

Query params: ?country=DE&field=energy&funding=full&eligibility=CE
              &status=open_now&min_score=80&deadline_before=2027-01-01
"""
import django_filters

from .models import Scholarship


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Matches any of a comma-separated list of values, e.g. ?country=DE,FR."""


class ScholarshipFilter(django_filters.FilterSet):
    country = CharInFilter(field_name='country__iso_code')
    field = CharInFilter(field_name='fields__slug')
    funding = django_filters.ChoiceFilter(
        field_name='funding_type', choices=Scholarship.FUNDING_CHOICES
    )
    eligibility = django_filters.ChoiceFilter(
        field_name='eligibility_label', choices=Scholarship.ELIG_CHOICES
    )
    status = CharInFilter(field_name='status')
    min_score = django_filters.NumberFilter(field_name='score', lookup_expr='gte')
    max_score = django_filters.NumberFilter(field_name='score', lookup_expr='lte')
    deadline_before = django_filters.DateFilter(field_name='deadline_date', lookup_expr='lte')
    deadline_after = django_filters.DateFilter(field_name='deadline_date', lookup_expr='gte')
    deadline_in_next = django_filters.NumberFilter(method='filter_deadline_in_next')
    is_open = django_filters.BooleanFilter(method='filter_is_open')

    class Meta:
        model = Scholarship
        fields = [
            'country', 'field', 'funding', 'eligibility', 'status',
            'min_score', 'max_score', 'deadline_before', 'deadline_after',
        ]

    def filter_deadline_in_next(self, queryset, name, value):
        from datetime import timedelta
        from django.utils import timezone
        if value is None:
            return queryset
        today = timezone.localdate()
        return queryset.filter(
            deadline_date__gte=today,
            deadline_date__lte=today + timedelta(days=value),
        )

    def filter_is_open(self, queryset, name, value):
        from datetime import timedelta
        from django.utils import timezone
        today = timezone.localdate()
        if value:
            return queryset.filter(
                deadline_date__gte=today,
                deadline_date__lte=today + timedelta(days=365),
                status__in=['open_now', 'opening_soon', 'upcoming', 'not_yet_open'],
            )
        return queryset
