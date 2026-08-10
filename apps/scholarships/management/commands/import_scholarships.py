"""
One-time import of scholarship data from Excel (Phase 0).

    python manage.py import_scholarships --file Roy_Okola_Scholarship_Database_Cycle1_v2.xlsx

Expected sheet columns (first row = headers; matches System Design v1.0 §4):
  name, short_name, programme, university, country (ISO code, e.g. DE),
  funding_type (full|partial|tuition_only|living_only), funding_detail,
  application_fee, currency, eligibility_label (CE|LE|PE|NE),
  english_requirement, age_min, age_max, experience_years_min, gpa_minimum,
  nationality_notes, mba_impact, mba_notes, score, competitiveness,
  fields (comma-separated slugs), deadline_date (YYYY-MM-DD), deadline_notes,
  status, cycle_year, notes, action_required, official_link,
  is_verified, verified_source, is_featured

Rows are upserted by slug (generated from short_name or name).
"""
from django.core.management.base import BaseCommand, CommandError
from django.utils.text import slugify

from apps.scholarships.models import Country, FieldOfStudy, Scholarship

M2M_KEYS = {'fields'}


class Command(BaseCommand):
    help = 'Import scholarships from an Excel file (upsert by slug).'

    def add_arguments(self, parser):
        parser.add_argument('--file', required=True, help='Path to the .xlsx file')
        parser.add_argument(
            '--sheet', default=None,
            help='Sheet name to read (defaults to the first sheet)',
        )

    def handle(self, *args, **options):
        path = options['file']
        try:
            import openpyxl
        except ImportError:
            raise CommandError('openpyxl is required: pip install openpyxl')

        self.stdout.write(f'Reading {path}…')
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        ws = wb[options['sheet']] if options['sheet'] else wb.active

        rows = ws.iter_rows(values_only=True)
        try:
            headers = [str(h).strip() if h else '' for h in next(rows)]
        except StopIteration:
            raise CommandError('The sheet is empty.')

        created = updated = skipped = 0
        for row_number, row in enumerate(rows, start=2):
            if row is None or not any(row):
                continue
            data = dict(zip(headers, row))
            try:
                obj, was_created = self._upsert(data)
            except (KeyError, ValueError, Country.DoesNotExist,
                    FieldOfStudy.DoesNotExist) as exc:
                self.stderr.write(f'  Row {row_number}: skipped ({exc})')
                skipped += 1
                continue
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done — created: {created}, updated: {updated}, skipped: {skipped}.'
        ))

    def _upsert(self, data):
        from django.utils.dateparse import parse_date, parse_datetime

        country_iso = (data.get('country') or '').strip().upper()
        country = Country.objects.get(iso_code=country_iso)

        slug_base = data.get('short_name') or data.get('name')
        slug = slugify(str(slug_base))[:190]

        defaults = {}
        for key, value in data.items():
            if key in M2M_KEYS or key == 'country' or not value:
                continue
            if key == 'deadline_date':
                defaults[key] = parse_date(str(value)) if value else None
            elif key == 'verified_at':
                defaults[key] = parse_datetime(str(value)) if value else None
            else:
                defaults[key] = value

        # Coerce booleans / numerics passed through as strings from Excel
        for key in ('is_verified', 'is_featured'):
            if key in defaults:
                defaults[key] = str(defaults[key]).strip().lower() in ('1', 'true', 'yes', 'y')
        for key in ('score', 'age_min', 'age_max', 'cycle_year', 'application_fee'):
            if key in defaults and defaults[key] != '':
                try:
                    defaults[key] = int(defaults[key])
                except (TypeError, ValueError):
                    pass
        for key in ('experience_years_min', 'gpa_minimum'):
            if key in defaults and defaults[key] != '':
                try:
                    defaults[key] = float(defaults[key])
                except (TypeError, ValueError):
                    pass

        defaults['country'] = country

        field_slugs = [s.strip() for s in str(data.get('fields', '')).split(',') if s.strip()]
        field_objs = list(FieldOfStudy.objects.filter(slug__in=field_slugs))
        if field_slugs and len(field_objs) != len(field_slugs):
            missing = set(field_slugs) - {f.slug for f in field_objs}
            raise FieldOfStudy.DoesNotExist(
                f'unknown field slug(s): {", ".join(sorted(missing))}'
            )

        obj, created = Scholarship.objects.update_or_create(slug=slug, defaults=defaults)
        obj.fields.set(field_objs)
        return obj, created
