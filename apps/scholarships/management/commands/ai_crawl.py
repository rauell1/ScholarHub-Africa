import json
import requests
from bs4 import BeautifulSoup
from decouple import config
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import List, Optional

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.scholarships.models import Scholarship, Country, FieldOfStudy

# Pydantic schema for structured output from LLM
class ScholarshipExtraction(BaseModel):
    name: str = Field(description="Full name of the scholarship")
    short_name: str = Field(description="A brief name (max 100 chars)")
    programme: str = Field(description="Degree level, e.g., Master's, PhD", default="")
    university: str = Field(description="Name of the university", default="")
    country_name: str = Field(description="Destination country name", default="Various")
    fields_of_study: List[str] = Field(description="List of fields of study or 'General Studies'", default=["General Studies"])
    funding_type: str = Field(description="Must be one of: full, partial, tuition_only, living_only", default="full")
    funding_detail: str = Field(description="Details on what the funding covers", default="")
    eligibility_label: str = Field(description="Must be one of: CE (Confirmed Eligible), LE (Likely Eligible), PE (Pending), NE (Not Eligible). Default PE.", default="PE")
    english_requirement: str = Field(description="IELTS, TOEFL, or MOI requirements", default="")
    nationality_notes: str = Field(description="Specific countries eligible (e.g., Sub-Saharan Africa)", default="")
    age_max: Optional[int] = Field(description="Maximum age limit if any", default=None)
    experience_years_min: Optional[float] = Field(description="Minimum years of work experience required", default=None)
    gpa_minimum: Optional[float] = Field(description="Minimum GPA or grade required", default=None)
    mba_impact: str = Field(description="Impact of prior MBA. Must be one of: none, risk, disqualifies, check, unknown. Default unknown.", default="unknown")
    deadline_date: Optional[str] = Field(description="Deadline date in YYYY-MM-DD format if found, otherwise null", default=None)
    score: int = Field(description="Competitiveness score out of 100 (e.g., 75)", default=70)


class Command(BaseCommand):
    help = 'AI-powered web crawler to fetch and intelligently structure scholarship opportunities.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            default='https://www.scholars4dev.com/category/scholarships-for-africans/',
            help='URL to scrape links from'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=5,
            help='Maximum number of links to process'
        )

    def handle(self, *args, **options):
        url = options['url']
        limit = options['limit']
        nvidia_api_key = config('NVIDIA_API_KEY', default='')

        if not nvidia_api_key:
            self.stdout.write(self.style.ERROR("NVIDIA_API_KEY is not set in .env! Please set it to use the AI crawler."))
            return

        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=nvidia_api_key
        )

        self.stdout.write(self.style.SUCCESS(f'Scraping links from {url}...'))
        
        try:
            headers = {'User-Agent': 'Mozilla/5.0'}
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # This is specific to scholars4dev. Adjust for other sites.
            posts = soup.find_all('div', class_='post clearfix')
            links = []
            for post in posts:
                a_tag = post.find('h2').find('a') if post.find('h2') else None
                if a_tag and a_tag.get('href'):
                    links.append(a_tag['href'])

            links = links[:limit]
            self.stdout.write(f"Found {len(links)} scholarships to process via NVIDIA AI.")

            for link in links:
                self.process_scholarship(link, client)
                
            self.stdout.write(self.style.SUCCESS(f'AI Crawl completed.'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to scrape index: {str(e)}'))

    def process_scholarship(self, link, client):
        self.stdout.write(f"Processing: {link}")
        
        # Check if we already have it
        if Scholarship.objects.filter(official_link=link).exists():
            self.stdout.write(" -> Already exists. Skipping.")
            return

        try:
            # Fetch article content
            response = requests.get(link, headers={'User-Agent': 'Mozilla/5.0'}, timeout=15)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Heuristic for scholars4dev entry content
            content_div = soup.find('div', class_='entry')
            text_content = content_div.get_text(separator=' ', strip=True) if content_div else soup.get_text(separator=' ', strip=True)
            
            # Truncate to avoid context window limits (~4k tokens is usually safe)
            text_content = text_content[:15000] 
            
            # Prompt the model
            completion = client.chat.completions.create(
                model="meta/llama-3.3-70b-instruct",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a data extraction assistant. Extract scholarship details from the provided text and output ONLY valid JSON matching the schema."
                    },
                    {
                        "role": "user",
                        "content": f"Extract the scholarship details from the following text:\n\n{text_content}"
                    }
                ],
                temperature=0.1,
                top_p=0.9,
                max_tokens=2048,
                # Simple JSON output mode for llama-3.1-70b-instruct
                extra_body={
                    "response_format": {
                        "type": "json_schema",
                        "json_schema": {
                            "name": "scholarship",
                            "schema": ScholarshipExtraction.model_json_schema()
                        }
                    }
                }
            )

            result_text = completion.choices[0].message.content
            data = json.loads(result_text)
            
            # Ensure choices match Django models
            funding_type = data.get('funding_type', 'full')
            if funding_type not in ['full', 'partial', 'tuition_only', 'living_only']:
                funding_type = 'full'
                
            eligibility_label = data.get('eligibility_label', 'PE')
            if eligibility_label not in ['CE', 'LE', 'PE', 'NE']:
                eligibility_label = 'PE'
                
            mba_impact = data.get('mba_impact', 'unknown')
            if mba_impact not in ['none', 'risk', 'disqualifies', 'check', 'unknown']:
                mba_impact = 'unknown'
                
            # Create Country & Fields
            country, _ = Country.objects.get_or_create(
                name=data.get('country_name', 'Various'), 
                defaults={"iso_code": data.get('country_name', 'Various')[:2].upper(), "flag_emoji": "🌍"}
            )
            
            # Parse Date gracefully
            deadline_str = data.get('deadline_date')
            deadline_date = None
            if deadline_str:
                try:
                    from datetime import datetime
                    deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d").date()
                except:
                    pass

            # Create Scholarship
            scholarship = Scholarship.objects.create(
                name=data.get('name', 'Unknown Scholarship')[:300],
                short_name=data.get('short_name', '')[:100],
                programme=data.get('programme', '')[:300],
                university=data.get('university', '')[:300],
                official_link=link,
                country=country,
                funding_type=funding_type,
                funding_detail=data.get('funding_detail', ''),
                eligibility_label=eligibility_label,
                english_requirement=data.get('english_requirement', ''),
                nationality_notes=data.get('nationality_notes', ''),
                age_max=data.get('age_max'),
                experience_years_min=data.get('experience_years_min'),
                gpa_minimum=data.get('gpa_minimum'),
                mba_impact=mba_impact,
                deadline_date=deadline_date,
                status='open_now',
                score=data.get('score', 70),
                is_verified=False, # Needs human verification due to AI
                verified_source='NVIDIA AI Crawl'
            )
            
            for field_name in data.get('fields_of_study', ['General']):
                field, _ = FieldOfStudy.objects.get_or_create(
                    name=field_name,
                    defaults={"slug": field_name.lower().replace(" ", "-")[:100]}
                )
                scholarship.fields.add(field)

            self.stdout.write(self.style.SUCCESS(f" -> Successfully saved: {scholarship.name}"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f" -> Failed to process {link}: {str(e)}"))
