from rest_framework import serializers

from .models import ApplicantProfile, DocumentItem, TrackedApplication


class ApplicantProfileSerializer(serializers.ModelSerializer):
    documents_progress = serializers.IntegerField(read_only=True)

    class Meta:
        model = ApplicantProfile
        fields = [
            'id', 'full_name', 'email', 'nationality', 'degree_field',
            'graduation_year', 'gpa', 'experience_years', 'has_ielts',
            'ielts_score', 'has_toefl', 'toefl_score', 'documents_progress',
        ]
        read_only_fields = ['email']


class TrackedApplicationSerializer(serializers.ModelSerializer):
    scholarship_slug = serializers.CharField(source='scholarship.slug', read_only=True)
    scholarship_name = serializers.CharField(source='scholarship.name', read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = TrackedApplication
        fields = [
            'id', 'scholarship', 'scholarship_slug', 'scholarship_name',
            'stage', 'priority', 'notes', 'next_action', 'next_action_due',
            'sop_status', 'refs_status', 'transcript_ready', 'moi_ready',
            'completion_percentage', 'last_updated',
        ]
        read_only_fields = ['profile']


class DocumentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentItem
        fields = ['id', 'name', 'status', 'notes', 'due_date', 'updated_at']
