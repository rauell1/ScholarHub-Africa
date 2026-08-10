"""
Signals - seed the standard 24-item document checklist for every new
applicant profile (System Design v1.0 §6.5).
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import ApplicantProfile, DocumentItem

DEFAULT_DOCUMENTS = [
    'Passport (bio page) - valid 6+ months',
    'Passport-size photos (digital, white background)',
    "Bachelor's degree certificate (or letter of completion)",
    "Bachelor's degree transcript (official, sealed)",
    "Master's degree transcript (if applicable)",
    'CV / Résumé (max 2 pages)',
    'Statement of Purpose - first draft',
    'Statement of Purpose - final, signed',
    'Study plan / research proposal',
    'Motivation letter',
    'Recommendation letter 1 (academic)',
    'Recommendation letter 2 (academic)',
    'Recommendation letter 3 (professional)',
    'English proficiency - IELTS score report',
    'English proficiency - TOEFL score report',
    'English proficiency - medium-of-instruction exemption letter',
    'GRE score report (if required)',
    'GMAT score report (if required)',
    'Work experience certificates',
    'Internship certificates',
    'Publications / research papers',
    'Portfolio / project documentation',
    'Financial documents (bank statement / sponsor letter)',
    'University application forms & checklists',
]


@receiver(post_save, sender=ApplicantProfile)
def seed_document_checklist(sender, instance, created, **kwargs):
    if created and not instance.documents.exists():
        DocumentItem.objects.bulk_create([
            DocumentItem(profile=instance, name=name) for name in DEFAULT_DOCUMENTS
        ])
