"""
Seed the database with demo data (Phase 0).

    python manage.py seed_demo

Creates countries, fields of study, ~35 verified scholarships, a demo
admin user ("roy") with an applicant profile, tracked applications and
the 24-item document checklist. Idempotent - safe to re-run.
"""
from datetime import date

from decouple import config
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.dateparse import parse_datetime

from apps.scholarships.data import seed_data
from apps.scholarships.models import Country, FieldOfStudy, Scholarship
from apps.tracker.models import ApplicantProfile, DocumentItem, TrackedApplication

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with demo countries, fields, scholarships and a demo user.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding countries…')
        countries = {}
        for name, iso, flag, region in seed_data.COUNTRIES:
            obj, _ = Country.objects.get_or_create(
                iso_code=iso,
                defaults={'name': name, 'flag_emoji': flag, 'region': region},
            )
            countries[iso] = obj

        self.stdout.write('Seeding fields of study…')
        fields = {}
        for name, slug, icon in seed_data.FIELDS:
            obj, _ = FieldOfStudy.objects.get_or_create(
                slug=slug, defaults={'name': name, 'icon': icon},
            )
            fields[slug] = obj

        self.stdout.write('Seeding scholarships…')
        created_count = 0
        for data in seed_data.SCHOLARSHIPS:
            slug = self._make_slug(data)
            defaults, scholarship_fields = self._defaults(data, countries, fields)
            obj, created = Scholarship.objects.update_or_create(
                slug=slug, defaults=defaults,
            )
            obj.fields.set(scholarship_fields)
            if created:
                created_count += 1

        total = Scholarship.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f'Seeded {total} scholarships ({created_count} new).'
        ))

        self._seed_user()

    # -- helpers ------------------------------------------------------------
    def _make_slug(self, data):
        from django.utils.text import slugify
        base = data['short_name'] or data['name']
        return slugify(base)[:190]

    def _defaults(self, data, countries, fields):
        """Split seed data into model-field defaults and M2M field objects."""
        from django.utils.dateparse import parse_date

        allowed = {
            'name', 'short_name', 'programme', 'university', 'country',
            'funding_type', 'funding_detail', 'application_fee', 'currency',
            'eligibility_label', 'english_requirement', 'age_min', 'age_max',
            'experience_years_min', 'gpa_minimum', 'nationality_notes',
            'mba_impact', 'mba_notes', 'score', 'competitiveness',
            'deadline_date', 'deadline_notes', 'status', 'cycle_year',
            'notes', 'action_required', 'official_link', 'is_verified',
            'verified_source', 'verified_at', 'is_featured',
        }
        defaults = {
            key: value for key, value in data.items() if key in allowed
        }
        defaults['country'] = countries[data['country']]
        if data.get('verified_at'):
            defaults['verified_at'] = parse_datetime(data['verified_at'])
        if isinstance(defaults.get('deadline_date'), str):
            defaults['deadline_date'] = parse_date(defaults['deadline_date'])
        scholarship_fields = [fields[f] for f in data['fields']]
        return defaults, scholarship_fields

    def _seed_user(self):
        password = config('DEMO_PASSWORD', default='change-me-roy-2026')

        user, created = User.objects.get_or_create(
            username='roy',
            defaults={
                'email': 'royokola3@gmail.com',
                'first_name': 'Roy',
                'last_name': 'Okola Otieno',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'Created demo superuser "roy" (password: {password}). '
                f'Change it after first login!'
            ))

        profile, _ = ApplicantProfile.objects.get_or_create(
            user=user,
            defaults={
                'email': user.email,
                'full_name': user.get_full_name(),
                'nationality': 'Kenyan',
                'degree_field': 'Renewable Energy / Water',
                'graduation_year': 2019,
                'gpa': 3.6,
                'experience_years': 4.0,
                'has_ielts': True,
                'ielts_score': 7.0,
            },
        )

        # A handful of tracked applications at different stages
        demo_apps = [
            ('daad-epos-rem', 'drafting', 'target', 'drafting', 'requested',
             'Finish SOP draft 2 and send to referee 1', date(2026, 8, 25)),
            ('chevening', 'planning', 'reach', 'not_started', 'not_started',
             'Start Chevening portal application', date(2026, 9, 1)),
            ('rhodes-kenya', 'planning', 'reach', 'not_started', 'not_started',
             'Request official transcripts from university', date(2026, 8, 15)),
            ('commonwealth-shared', 'researching', 'safe', 'not_started', 'not_started',
             'Shortlist eligible universities', date(2026, 9, 30)),
            ('mcf-edinburgh', 'drafting', 'target', 'drafting', 'not_started',
             'Ask lecturer for recommendation letter', date(2026, 9, 15)),
        ]
        for slug, stage, priority, sop, refs, action, due in demo_apps:
            scholarship = Scholarship.objects.filter(slug__startswith=slug).first()
            if scholarship:
                TrackedApplication.objects.update_or_create(
                    profile=profile,
                    scholarship=scholarship,
                    defaults={
                        'stage': stage, 'priority': priority,
                        'sop_status': sop, 'refs_status': refs,
                        'next_action': action, 'next_action_due': due,
                    },
                )

        # Mark a few checklist items as in progress / ready
        DocumentItem.objects.filter(profile=profile, name__icontains='Passport (bio').update(
            status='ready')
        DocumentItem.objects.filter(profile=profile, name__icontains="Bachelor's degree transcript").update(
            status='in_progress', notes='Ordered from university - 2 weeks')
        DocumentItem.objects.filter(profile=profile, name__icontains='CV / Résumé').update(
            status='in_progress')
        DocumentItem.objects.filter(profile=profile, name__icontains='IELTS score').update(
            status='ready')

        self.stdout.write(self.style.SUCCESS(
            f'Demo user "roy" ready - tracker has {profile.applications.count()} '
            f'applications and {profile.documents.count()} checklist items.'
        ))
