import time
import requests
from bs4 import BeautifulSoup
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.scholarships.models import Scholarship, Country, FieldOfStudy

class BaseScraper:
    name = "base"
    
    def __init__(self, stdout, style):
        self.stdout = stdout
        self.style = style

    def scrape(self):
        raise NotImplementedError

    def save_scholarship(self, title, link, country_name="Unknown", field_name="General"):
        # Defaults
        country, _ = Country.objects.get_or_create(
            name=country_name,
            defaults={"iso_code": country_name[:2].upper(), "flag_emoji": "🌍"}
        )
        field, _ = FieldOfStudy.objects.get_or_create(
            name=field_name,
            defaults={"slug": field_name.lower().replace(" ", "-")}
        )
        
        scholarship, created = Scholarship.objects.get_or_create(
            official_link=link, # Use official_link as the unique constraint here to avoid exact duplicates
            defaults={
                'name': title[:300],
                'short_name': title[:100],
                'country': country,
                'funding_type': 'full',
                'status': 'open_now',
                'is_verified': False, # Needs human verification
                'score': 60
            }
        )
        
        if created:
            scholarship.fields.add(field)
            self.stdout.write(f"Added: {title[:50]}...")
            return True
        return False

class Scholars4DevScraper(BaseScraper):
    name = "scholars4dev"
    start_url = "https://www.scholars4dev.com/category/scholarships-for-africans/"

    def scrape(self):
        self.stdout.write(self.style.SUCCESS(f"Scraping {self.name} from {self.start_url}..."))
        count = 0
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(self.start_url, headers=headers, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            posts = soup.find_all('div', class_='post clearfix')
            if not posts:
                # Fallback if structure changed
                posts = soup.find_all('div', class_='post')
            for post in posts:
                title_tag = post.find('h2')
                if not title_tag:
                    continue
                a_tag = title_tag.find('a')
                if not a_tag:
                    continue
                    
                title = a_tag.text.strip()
                link = a_tag['href']
                
                # We could extract more info here (deadline, country), but for now we fallback to defaults
                # Scholars4Dev often lists the country in the excerpt, but it requires NLP.
                if self.save_scholarship(title, link, country_name="Various", field_name="General Studies"):
                    count += 1
            
            self.stdout.write(self.style.SUCCESS(f"Finished {self.name}. Added {count} new scholarships."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error scraping {self.name}: {e}"))


class Command(BaseCommand):
    help = 'Daily web crawler to fetch scholarship opportunities from various sites.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--site',
            type=str,
            default='all',
            help='Specific site adapter to run (e.g. scholars4dev, all)'
        )

    def handle(self, *args, **options):
        site = options['site']
        
        # Register adapters here
        adapters = [
            Scholars4DevScraper(self.stdout, self.style),
            # New site adapters can be added here easily
        ]
        
        self.stdout.write(self.style.SUCCESS("Starting daily scholarship crawler..."))
        
        for adapter in adapters:
            if site == 'all' or site == adapter.name:
                adapter.scrape()
                time.sleep(2) # Be polite to servers
                
        self.stdout.write(self.style.SUCCESS("Daily crawl complete."))
