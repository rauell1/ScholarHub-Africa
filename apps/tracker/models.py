"""
Application tracking models (System Design v1.0 §4, §6.5).

ApplicantProfile - Roy's (later any user's) profile.
TrackedApplication - one row per scholarship being applied to.
DocumentItem - the 24-item document readiness checklist.
"""
from django.conf import settings
from django.db import models


class ApplicantProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='applicant_profile',
    )
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    degree_field = models.CharField(max_length=200, blank=True)
    graduation_year = models.PositiveSmallIntegerField(null=True, blank=True)
    gpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    experience_years = models.DecimalField(
        max_digits=3, decimal_places=1, null=True, blank=True
    )
    has_ielts = models.BooleanField(default=False)
    ielts_score = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    has_toefl = models.BooleanField(default=False)
    toefl_score = models.PositiveSmallIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name or self.email

    # -- Document checklist helpers ----------------------------------------
    @property
    def documents_ready(self):
        return self.documents.filter(status='ready').count()

    @property
    def documents_total(self):
        return self.documents.count()

    @property
    def documents_progress(self):
        total = self.documents_total
        if not total:
            return 0
        return round(100 * self.documents_ready / total)


class TrackedApplication(models.Model):
    STAGE_CHOICES = [
        ('researching', 'Researching'),
        ('planning', 'Planning'),
        ('drafting', 'Drafting'),
        ('submitted', 'Submitted'),
        ('interview', 'Interview'),
        ('awarded', 'Awarded'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    PRIORITY_CHOICES = [
        ('reach', 'Reach'),
        ('target', 'Target'),
        ('safe', 'Safe'),
        ('backup', 'Backup'),
    ]
    SOP_CHOICES = [('not_started', 'Not Started'), ('drafting', 'Drafting'), ('done', 'Done')]
    REFS_CHOICES = [
        ('not_started', 'Not Started'), ('requested', 'Requested'), ('received', 'Received')
    ]

    profile = models.ForeignKey(
        ApplicantProfile, on_delete=models.CASCADE, related_name='applications'
    )
    scholarship = models.ForeignKey(
        'scholarships.Scholarship', on_delete=models.CASCADE, related_name='tracked_by'
    )
    stage = models.CharField(max_length=30, choices=STAGE_CHOICES, default='researching')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='target')
    notes = models.TextField(blank=True)
    next_action = models.TextField(blank=True)
    next_action_due = models.DateField(null=True, blank=True)
    sop_status = models.CharField(max_length=20, choices=SOP_CHOICES, default='not_started')
    refs_status = models.CharField(max_length=20, choices=REFS_CHOICES, default='not_started')
    transcript_ready = models.BooleanField(default=False)
    moi_ready = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('profile', 'scholarship')
        ordering = ['-last_updated']

    def __str__(self):
        return f'{self.profile} → {self.scholarship}'

    @property
    def completion_percentage(self):
        """Rough readiness estimate shown on tracker cards."""
        stage_weights = {
            'researching': 10, 'planning': 25, 'drafting': 50,
            'submitted': 75, 'interview': 90, 'awarded': 100,
            'rejected': 100, 'withdrawn': 100,
        }
        pct = stage_weights.get(self.stage, 10)
        if self.sop_status == 'done':
            pct += 10
        elif self.sop_status == 'drafting':
            pct += 5
        if self.refs_status == 'received':
            pct += 10
        elif self.refs_status == 'requested':
            pct += 5
        if self.transcript_ready:
            pct += 3
        if self.moi_ready:
            pct += 2
        return min(pct, 100)


class DocumentItem(models.Model):
    STATUS_CHOICES = [
        ('ready', 'Ready'),
        ('in_progress', 'In Progress'),
        ('not_started', 'Not Started'),
        ('not_needed', 'Not Needed'),
    ]

    profile = models.ForeignKey(
        ApplicantProfile, on_delete=models.CASCADE, related_name='documents'
    )
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    notes = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f'{self.name} ({self.status})'
