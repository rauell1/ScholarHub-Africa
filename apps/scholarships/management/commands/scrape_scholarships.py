import json
import urllib.request
from html.parser import HTMLParser
from datetime import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.scholarships.models import Scholarship, Country, FieldOfStudy

class Command(BaseCommand):
    help = 'Scrapes scholarships from a web source and adds them to the database.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url', 
            type=str, 
            default='https://www.scholars4dev.com/category/scholarships-for-africans/',
            help='URL to scrape'
        )

    def handle(self, *args, **options):
        url = options['url']
        self.stdout.write(self.style.SUCCESS(f'Scraping {url}...'))
        
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            with urllib.request.urlopen(req) as response:
                html = response.read().decode('utf-8')
                
            self.stdout.write(f"Extracting scholarships...")
            
            # Create a default country and field if none exist
            country, _ = Country.objects.get_or_create(
                name="United Kingdom", 
                defaults={"iso_code": "GB", "flag_emoji": "🇬🇧"}
            )
            field, _ = FieldOfStudy.objects.get_or_create(
                name="General Studies",
                defaults={"slug": "general"}
            )
            
            count = 0
            
            # Simple fallback string splitting for typical scholars4dev structure
            posts = html.split('<div class="post clearfix">')[1:]
            for post in posts:
                try:
                    title_part = post.split('<h2><a href="')[1].split('</a></h2>')[0]
                    link = title_part.split('"')[0]
                    title = title_part.split('>')[-1].strip()
                    
                    if not title:
                        continue
                        
                    # Create scholarship
                    scholarship, created = Scholarship.objects.get_or_create(
                        name=title[:300],
                        defaults={
                            'short_name': title[:100],
                            'official_link': link,
                            'country': country,
                            'funding_type': 'full',
                            'status': 'open_now',
                            'is_verified': True,
                            'verified_at': timezone.now(),
                            'score': 85
                        }
                    )
                    
                    if created:
                        scholarship.fields.add(field)
                        count += 1
                        self.stdout.write(f"Added: {title}")
                except Exception as e:
                    continue
                    
            self.stdout.write(self.style.SUCCESS(f'Successfully added {count} new scholarships.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to scrape: {str(e)}'))
