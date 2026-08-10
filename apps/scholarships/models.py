"""
Core data models - mirror the database schema in System Design v1.0 §4.

Country, FieldOfStudy, Scholarship (with M2M fields) and ChangeLog.
"""
from django.db import models
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify


class Country(models.Model):
    REGION_CHOICES = [
        ('Europe', 'Europe'),
        ('Asia', 'Asia'),
        ('Africa', 'Africa'),
        ('Americas', 'Americas'),
        ('Oceania', 'Oceania'),
        ('Multi', 'Multi-country'),
    ]

    name = models.CharField(max_length=100, unique=True)
    iso_code = models.CharField('ISO code', max_length=2, unique=True)
    flag_emoji = models.CharField(max_length=10, blank=True)
    region = models.CharField(max_length=50, choices=REGION_CHOICES, default='Europe')

    class Meta:
        verbose_name_plural = 'countries'
        ordering = ['name']

    def __str__(self):
        return f'{self.flag_emoji} {self.name}'

    def get_absolute_url(self):
        return reverse('scholarships:directory') + f'?country={self.iso_code}'


class FieldOfStudy(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text='Emoji icon, e.g. 🌱')

    class Meta:
        verbose_name_plural = 'fields of study'
        ordering = ['name']

    def __str__(self):
        return f'{self.icon} {self.name}'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Scholarship(models.Model):
    """A human-verified scholarship opportunity."""

    FUNDING_CHOICES = [
        ('full', 'Full'),
        ('partial', 'Partial'),
        ('tuition_only', 'Tuition Only'),
        ('living_only', 'Living Only'),
    ]
    ELIG_CHOICES = [
        ('CE', 'Confirmed Eligible'),
        ('LE', 'Likely Eligible'),
        ('PE', 'Pending Clarification'),
        ('NE', 'Not Eligible'),
    ]
    STATUS_CHOICES = [
        ('open_now', 'Open Now'),
        ('opening_soon', 'Opening Soon'),
        ('upcoming', 'Upcoming'),
        ('not_yet_open', 'Not Yet Open'),
        ('closed', 'Closed'),
        ('ineligible', 'Ineligible'),
        ('unknown', 'Unknown'),
    ]
    MBA_CHOICES = [
        ('none', 'No impact'),
        ('risk', 'Risk'),
        ('disqualifies', 'Disqualifies'),
        ('check', 'Check'),
        ('unknown', 'Unknown'),
    ]

    # Core identity
    slug = models.SlugField(max_length=200, unique=True)
    name = models.CharField(max_length=300)
    short_name = models.CharField(max_length=100, blank=True)
    programme = models.CharField(max_length=300, blank=True)
    university = models.CharField(max_length=300, blank=True)
    country = models.ForeignKey(
        Country, on_delete=models.PROTECT, related_name='scholarships'
    )

    # Funding
    funding_type = models.CharField(max_length=20, choices=FUNDING_CHOICES)
    funding_detail = models.TextField(blank=True)
    application_fee = models.DecimalField(
        max_digits=8, decimal_places=2, default=0
    )
    currency = models.CharField(max_length=3, default='USD')

    # Eligibility
    eligibility_label = models.CharField(max_length=2, choices=ELIG_CHOICES, default='PE')
    english_requirement = models.TextField(blank=True)
    age_min = models.PositiveSmallIntegerField(null=True, blank=True)
    age_max = models.PositiveSmallIntegerField(null=True, blank=True)
    experience_years_min = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True
    )
    gpa_minimum = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    nationality_notes = models.TextField(blank=True)
    mba_impact = models.CharField(max_length=20, choices=MBA_CHOICES, default='none')
    mba_notes = models.TextField(blank=True)

    # Scoring
    score = models.PositiveSmallIntegerField(default=0)
    competitiveness = models.CharField(max_length=50, blank=True)

    # Fields (M2M via scholarship_fields junction)
    fields = models.ManyToManyField(FieldOfStudy, related_name='scholarships', blank=True)

    # Deadlines & status
    deadline_date = models.DateField(null=True, blank=True)
    deadline_notes = models.TextField(blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='unknown')
    cycle_year = models.PositiveSmallIntegerField(null=True, blank=True)

    # Content
    notes = models.TextField(blank=True)
    action_required = models.TextField(blank=True)
    official_link = models.URLField(max_length=500, blank=True)

    # Metadata
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    verified_source = models.TextField(blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-score', 'deadline_date']
        indexes = [
            models.Index(fields=['country'], name='scholarship_country_idx'),
            models.Index(fields=['status'], name='scholarship_status_idx'),
            models.Index(fields=['-score'], name='scholarship_score_idx'),
            models.Index(fields=['deadline_date'], name='scholarship_deadline_idx'),
        ]

    def __str__(self):
        return self.short_name or self.name

    def get_absolute_url(self):
        return reverse('scholarships:detail', args=[self.slug])

    # -- Derived properties -------------------------------------------------
    @property
    def days_until_deadline(self):
        """Whole days from today (EAT) until deadline; None if unset/past."""
        if not self.deadline_date:
            return None
        delta = (self.deadline_date - timezone.localdate()).days
        return max(delta, 0)

    @property
    def deadline_state(self):
        """Human-friendly urgency bucket used by the countdown component."""
        if not self.deadline_date:
            return 'none'
        delta = (self.deadline_date - timezone.localdate()).days
        if delta < 0:
            return 'closed'
        if delta <= 7:
            return 'urgent'
        if delta <= 30:
            return 'soon'
        return 'normal'

    @property
    def score_label(self):
        """Label per the score badge table (System Design v1.0 §11)."""
        s = self.score
        if s >= 90:
            return 'Outstanding'
        if s >= 85:
            return 'Excellent'
        if s >= 80:
            return 'Very Strong'
        if s >= 74:
            return 'Good'
        if s >= 60:
            return 'Achievable'
        return 'Stretch'

    def save(self, *args, **kwargs):
        if not self.slug:
            base = self.short_name or self.name
            self.slug = slugify(base)[:190]
        if self.is_verified and not self.verified_at:
            self.verified_at = timezone.now()
        super().save(*args, **kwargs)


class ChangeLog(models.Model):
    """Audit trail of edits made to scholarships (System Design v1.0 §4)."""

    scholarship = models.ForeignKey(
        Scholarship,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='change_logs',
    )
    change_type = models.CharField(max_length=50, default='update')
    field_changed = models.CharField(max_length=100, blank=True)
    old_value = models.TextField(blank=True)
    new_value = models.TextField(blank=True)
    source = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    changed_by = models.CharField(max_length=100, default='system')

    class Meta:
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.scholarship} - {self.field_changed or self.change_type}'
