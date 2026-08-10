"""
Django Admin configuration (System Design v1.0 §14).

A feature-rich management UI so scholarships can be added/edited without
writing code. Includes colour-coded badges, field grouping, bulk actions
and a change-history trail.
"""
from django.contrib import admin
from django.utils.html import format_html

from .models import ChangeLog, Country, FieldOfStudy, Scholarship

SCORE_COLOURS = {
    'outstanding': '#1A4F2A',  # 90-100  dark forest
    'excellent': '#1A7A4A',    # 85-89
    'strong': '#27AE60',       # 80-84  forest
    'good': '#F39C12',         # 74-79  amber
    'achievable': '#2980B9',   # 60-73  sky
    'stretch': '#C0392B',      # <60    crimson
}

ELIG_COLOURS = {
    'CE': '#27AE60',  # forest
    'LE': '#1ABC9C',  # teal
    'PE': '#F39C12',  # amber
    'NE': '#C0392B',  # crimson
}


def _badge(colour, text):
    return format_html(
        '<span style="background:{};color:white;padding:2px 8px;'
        'border-radius:4px;font-weight:bold">{}</span>',
        colour,
        text,
    )


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = [
        'short_name', 'country', 'score_badge', 'eligibility_badge',
        'status', 'deadline_date', 'is_verified', 'is_active', 'is_featured',
    ]
    list_filter = [
        'status', 'eligibility_label', 'funding_type',
        'country__region', 'is_verified', 'is_featured', 'is_active',
    ]
    search_fields = ['name', 'short_name', 'programme', 'university', 'country__name']
    ordering = ['-score', 'deadline_date']
    list_editable = ['is_verified', 'is_active', 'is_featured']
    list_per_page = 25
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['fields']
    prepopulated_fields = {'slug': ('short_name', 'name')}

    fieldsets = (
        ('Identity', {
            'fields': ('name', 'short_name', 'slug', 'programme', 'university', 'country')
        }),
        ('Funding', {
            'fields': ('funding_type', 'funding_detail', 'application_fee', 'currency')
        }),
        ('Eligibility', {
            'fields': (
                'eligibility_label', 'english_requirement', 'age_min', 'age_max',
                'experience_years_min', 'gpa_minimum', 'nationality_notes',
                'mba_impact', 'mba_notes',
            )
        }),
        ('Scoring & Fields', {
            'fields': ('score', 'competitiveness', 'fields')
        }),
        ('Deadline & Status', {
            'fields': ('deadline_date', 'deadline_notes', 'status', 'cycle_year')
        }),
        ('Content', {
            'fields': ('notes', 'action_required', 'official_link')
        }),
        ('Publication', {
            'fields': (
                'is_verified', 'verified_at', 'verified_source',
                'is_featured', 'is_active',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    actions = [
        'mark_verified',
        'mark_active',
        'mark_featured',
        'set_status_open_now',
        'recalculate_status',
    ]

    @admin.display(description='Score')
    def score_badge(self, obj):
        s = obj.score
        if s >= 90:
            colour = SCORE_COLOURS['outstanding']
        elif s >= 85:
            colour = SCORE_COLOURS['excellent']
        elif s >= 80:
            colour = SCORE_COLOURS['strong']
        elif s >= 74:
            colour = SCORE_COLOURS['good']
        elif s >= 60:
            colour = SCORE_COLOURS['achievable']
        else:
            colour = SCORE_COLOURS['stretch']
        return _badge(colour, str(obj.score))

    @admin.display(description='Elig.')
    def eligibility_badge(self, obj):
        return _badge(ELIG_COLOURS.get(obj.eligibility_label, '#888'), obj.eligibility_label)

    @admin.action(description='Mark selected as verified (now)')
    def mark_verified(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(is_verified=True, verified_at=timezone.now())
        self.message_user(request, f'{updated} scholarship(s) marked verified.')

    @admin.action(description='Mark selected as active')
    def mark_active(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} scholarship(s) marked active.')

    @admin.action(description='Feature selected')
    def mark_featured(self, request, queryset):
        updated = queryset.update(is_featured=True)
        self.message_user(request, f'{updated} scholarship(s) featured.')

    @admin.action(description='Set status to Open Now')
    def set_status_open_now(self, request, queryset):
        updated = queryset.update(status='open_now')
        self.message_user(request, f'{updated} scholarship(s) set to Open Now.')

    @admin.action(description='Recalculate status from deadline date')
    def recalculate_status(self, request, queryset):
        from django.utils import timezone
        today = timezone.localdate()
        updated = 0
        for obj in queryset:
            if obj.deadline_date:
                if obj.deadline_date < today:
                    obj.status = 'closed'
                elif obj.deadline_date <= today.replace(month=today.month + 2) \
                        or (obj.deadline_date - today).days <= 60:
                    obj.status = 'open_now'
                obj.save(update_fields=['status', 'updated_at'])
                updated += 1
        self.message_user(request, f'Recalculated status for {updated} scholarship(s).')


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name', 'iso_code', 'flag_emoji', 'region', 'scholarship_count']
    list_filter = ['region']
    search_fields = ['name', 'iso_code']

    def scholarship_count(self, obj):
        return obj.scholarships.count()

    scholarship_count.short_description = '# Scholarships'


@admin.register(FieldOfStudy)
class FieldOfStudyAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'icon', 'scholarship_count']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

    def scholarship_count(self, obj):
        return obj.scholarships.count()

    scholarship_count.short_description = '# Scholarships'


@admin.register(ChangeLog)
class ChangeLogAdmin(admin.ModelAdmin):
    list_display = ['scholarship', 'field_changed', 'change_type', 'changed_by', 'changed_at']
    list_filter = ['change_type', 'field_changed', 'changed_by']
    search_fields = ['scholarship__name', 'field_changed', 'new_value']
    date_hierarchy = 'changed_at'
    readonly_fields = ['scholarship', 'change_type', 'field_changed', 'old_value',
                       'new_value', 'source', 'changed_at', 'changed_by']

    def has_add_permission(self, request):
        return False
