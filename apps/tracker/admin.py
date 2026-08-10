from django.contrib import admin

from .models import ApplicantProfile, DocumentItem, TrackedApplication


@admin.register(ApplicantProfile)
class ApplicantProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'nationality', 'degree_field',
                    'gpa', 'documents_ready', 'documents_total']
    search_fields = ['full_name', 'email', 'nationality']
    list_filter = ['nationality', 'has_ielts', 'has_toefl']

    def documents_ready(self, obj):
        return obj.documents.filter(status='ready').count()

    def documents_total(self, obj):
        return obj.documents.count()

    documents_ready.short_description = 'Docs ready'


@admin.register(TrackedApplication)
class TrackedApplicationAdmin(admin.ModelAdmin):
    list_display = ['scholarship', 'profile', 'stage', 'priority',
                    'next_action_due', 'last_updated']
    list_filter = ['stage', 'priority', 'sop_status', 'refs_status']
    search_fields = ['scholarship__name', 'profile__email']


@admin.register(DocumentItem)
class DocumentItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'profile', 'status', 'due_date', 'updated_at']
    list_filter = ['status']
    search_fields = ['name', 'profile__email']
