"""
DRF serializers (System Design v1.0 §7).
"""
from rest_framework import serializers

from .models import Country, FieldOfStudy, Scholarship


class CountrySerializer(serializers.ModelSerializer):
    scholarship_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Country
        fields = ['iso_code', 'name', 'flag_emoji', 'region', 'scholarship_count']


class FieldOfStudySerializer(serializers.ModelSerializer):
    scholarship_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = FieldOfStudy
        fields = ['slug', 'name', 'icon', 'scholarship_count']


class ScholarshipListSerializer(serializers.ModelSerializer):
    country = serializers.SerializerMethodField()
    fields = serializers.SerializerMethodField(method_name='get_field_slugs')
    country_name = serializers.CharField(source='country.name', read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)

    class Meta:
        model = Scholarship
        fields = [
            'id', 'slug', 'name', 'short_name', 'programme', 'university',
            'country', 'country_name', 'fields', 'funding_type',
            'funding_detail', 'score', 'status', 'deadline_date',
            'days_until_deadline', 'official_link',
        ]

    def get_country(self, obj):
        return {
            'iso_code': obj.country.iso_code,
            'name': obj.country.name,
            'flag_emoji': obj.country.flag_emoji,
        }

    def get_field_slugs(self, obj):
        return [f.slug for f in obj.fields.all()]


class ScholarshipDetailSerializer(ScholarshipListSerializer):
    class Meta(ScholarshipListSerializer.Meta):
        fields = ScholarshipListSerializer.Meta.fields + [
            'eligibility_label', 'english_requirement', 'age_min', 'age_max',
            'experience_years_min', 'gpa_minimum', 'nationality_notes',
            'mba_impact', 'mba_notes', 'competitiveness', 'deadline_notes',
            'cycle_year', 'notes', 'action_required', 'is_verified',
            'verified_at', 'verified_source', 'application_fee', 'currency',
        ]
