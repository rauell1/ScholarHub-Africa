"""
Marketing / static pages (Django — original framework, no TypeScript):

  /about/        About Us with team grid
  /faq/          5-question accordion
  /contact/      Contact form + response-time promise + map & directions
  /thank-you/    Post-submission confirmation page
  /case-studies/ Reusable case study template (Client → Challenge → Solution → Results)
  /privacy/      Privacy Policy
  /robots.txt    robots.txt (disallow /admin/ + /api/)
  404            Custom friendly error page (handler404)
"""
from urllib.parse import quote

from django.http import HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse

from .forms import ContactForm


# ── Static pages ────────────────────────────────────────────────────────────

def about(request):
    team = [
        {
            'name': 'Roy Okola Otieno',
            'role': 'Founder & CEO',
            'photo': 'img/team/roy.jpg',
            'photo_webp': 'img/team/roy.webp',
            'bio': (
                'Started ScholarHub Africa to solve his own search problem — '
                'hundreds of spreadsheets, missed deadlines, zero clarity. Now '
                'he builds the tool every African student needs.'
            ),
            'alt': 'Portrait of Roy Okola Otieno, Founder & CEO of ScholarHub Africa',
        },
        {
            'name': 'Amara Njoroge',
            'role': 'Head of Research & Verification',
            'photo': 'img/team/amara.jpg',
            'photo_webp': 'img/team/amara.webp',
            'bio': (
                'Leads the human-verification desk. Every deadline, funding '
                'figure and eligibility rule on the platform is checked against '
                'the official source before it goes live.'
            ),
            'alt': 'Portrait of Amara Njoroge, Head of Research & Verification at ScholarHub Africa',
        },
        {
            'name': 'Daniel Ochieng',
            'role': 'Partnerships Lead',
            'photo': 'img/team/daniel.jpg',
            'photo_webp': 'img/team/daniel.webp',
            'bio': (
                'Builds relationships with universities and scholarship bodies '
                'across Europe and Africa so the directory keeps growing with '
                'first-hand data.'
            ),
            'alt': 'Portrait of Daniel Ochieng, Partnerships Lead at ScholarHub Africa',
        },
        {
            'name': 'Wanjiru Kamau',
            'role': 'Product & Community',
            'photo': 'img/team/wanjiru.jpg',
            'photo_webp': 'img/team/wanjiru.webp',
            'bio': (
                'Turns student feedback into shipped features and runs the '
                'Phase 2 community programme for applicants across the continent.'
            ),
            'alt': 'Portrait of Wanjiru Kamau, Product & Community at ScholarHub Africa',
        },
    ]
    return render(request, 'pages/about.html', {
        'team': team,
        'breadcrumbs_items': [('Home', '/')],
        'breadcrumbs_current': 'About us',
    })


def faq(request):
    faqs = [
        {
            'question': 'Is ScholarHub Africa free to use?',
            'answer': (
                'Yes. Every scholarship listing, filter, score and tracking tool '
                'is completely free. We believe verified scholarship information '
                'should never be paywalled — especially for students who need it most.'
            ),
        },
        {
            'question': 'How do you verify that scholarships are real and current?',
            'answer': (
                'Every entry is human-checked against its official source before '
                'publication. Each scholarship card shows its verification date and '
                'a link to the official website, and deadlines are re-checked weekly '
                'so you never act on stale data.'
            ),
        },
        {
            'question': 'Who can use ScholarHub Africa?',
            'answer': (
                'Phase 1 is a private dashboard, but the directory is being opened '
                'to any African student looking for fully-funded international '
                "master's opportunities. Nationality notes on each listing tell you "
                'exactly who is eligible — Kenya and most African countries are '
                'covered by the major programmes.'
            ),
        },
        {
            'question': 'What does the 0–100 score mean?',
            'answer': (
                'The score estimates how strong a fit a scholarship is for your '
                'profile: the higher the score, the better your chances of being '
                'shortlisted. It factors in your field, experience, age limits, '
                'English requirements and competition level. Use it to prioritise '
                'where to spend your application effort.'
            ),
        },
        {
            'question': 'How does the application tracker help me?',
            'answer': (
                'Add any scholarship to your tracker with one click, then move it '
                'through stages — planning, drafting, submitted, decision. The '
                'built-in 24-item document checklist and the Monday email digest '
                'keep your documents ready and your deadlines in front of you.'
            ),
        },
    ]
    return render(request, 'pages/faq.html', {
        'faqs': faqs,
        'breadcrumbs_items': [('Home', '/')],
        'breadcrumbs_current': 'FAQ',
    })


def privacy(request):
    return render(request, 'pages/privacy.html', {
        'breadcrumbs_items': [('Home', '/')],
        'breadcrumbs_current': 'Privacy Policy',
    })


# ── Case study (structured template) ────────────────────────────────────────

def case_studies(request):
    """Reusable case-study template: Client Background → Challenge → Solution → Results."""
    study = {
        'slug': 'daad-epos-rem',
        'title': 'From 45 listings to one offer: how Roy landed the DAAD EPOS scholarship',
        'eyebrow': 'Case study · Application tracking',
        'summary': (
            'A renewable-energy professional with four years of experience and a '
            'history of missed deadlines used ScholarHub Africa to go from scattered '
            'notes to a fully funded MSc offer in Germany.'
        ),
        'client_background': [
            'Roy Okola Otieno, a Kenyan engineer with a BSc in Mechanical Engineering '
            'and 4 years of experience in the renewable energy sector.',
            'Goal: a fully funded international master\'s in renewable energy management, '
            'ideally in Germany, without paying application fees out of pocket.',
        ],
        'challenge': [
            'Information was scattered across a dozen spreadsheets, bookmarked pages and '
            'WhatsApp forwards — deadlines kept getting missed.',
            'Eligibility rules (DAAD "two years of experience", English thresholds, '
            'age limits) were hard to compare quickly across programmes.',
            'No central place to track document readiness; transcripts and references '
            'were only started after a deadline had already slipped.',
        ],
        'solution': [
            'Used the directory filters (country = Germany, funding = full, field = '
            'Renewable Energy) to shortlist 14 viable programmes in minutes.',
            'Relied on the 0–100 fit score to rank applications: DAAD EPOS – REM scored '
            '93 and went to the top of the list.',
            'Moved every shortlisted programme through the application tracker '
            '(planning → drafting → submitted) and used the 24-item checklist to '
            'prepare transcripts, references and the DAAD motivation documents early.',
            'The Monday email digest kept the 31 October deadline visible with live '
            'countdowns, so nothing slipped again.',
        ],
        'results': [
            {'value': '14', 'label': 'applications tracked in one dashboard'},
            {'value': '3', 'label': 'applications submitted before their deadlines'},
            {'value': '2', 'label': 'interviews secured'},
            {'value': '1', 'label': 'fully funded offer — DAAD EPOS, TH Köln'},
        ],
        'quote': {
            'text': (
                'The score badge changed everything. I stopped applying to everything '
                'and started applying to what fit — the tracker made it feel like a '
                'project I could actually win.'
            ),
            'author': 'Roy Okola Otieno',
            'role': 'Founder, ScholarHub Africa',
        },
        'next': {
            'title': 'Start your own case study',
            'text': 'The same tools are waiting for you — free.',
            'cta': 'Browse scholarships',
            'url': reverse('scholarships:directory'),
        },
    }
    return render(request, 'pages/case_study.html', {
        'study': study,
        'breadcrumbs_items': [('Home', '/'), ('Resources', None)],
        'breadcrumbs_current': 'Case study',
    })


# ── Contact + thank you ─────────────────────────────────────────────────────

def contact(request):
    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            # Demo handler: nothing is persisted or emailed in Phase 1.
            # Wire to a backend task here (rate-limited by middleware).
            name = form.cleaned_data['name']
            return redirect(reverse('pages:thank_you') + f'?name={quote(name)}')
        return render(request, 'pages/contact.html', {
            'form': form,
            'breadcrumbs_items': [('Home', '/')],
            'breadcrumbs_current': 'Contact',
        }, status=422)
    return render(request, 'pages/contact.html', {
        'form': ContactForm(),
        'breadcrumbs_items': [('Home', '/')],
        'breadcrumbs_current': 'Contact',
    })


def thank_you(request):
    return render(request, 'pages/thank_you.html', {
        'name': request.GET.get('name', ''),
        'breadcrumbs_items': [('Home', '/')],
        'breadcrumbs_current': 'Thank you',
    })


# ── robots.txt + error handlers ─────────────────────────────────────────────

def robots_txt(request):
    return render(request, 'robots.txt', content_type='text/plain; charset=utf-8')


def llms_txt(request):
    """AEO helper file (Track 2.3) — helpful, never authoritative."""
    return render(request, 'llms.txt', content_type='text/plain; charset=utf-8')


def handler404(request, exception=None):
    # API consumers expect JSON 404s, not the branded HTML page.
    if request.path.startswith('/api/'):
        from django.http import JsonResponse
        return JsonResponse({'detail': 'Not found.'}, status=404)
    # Missing static assets (css/js/img) → plain 404, not a full HTML page.
    import re
    if re.search(r'\.[a-zA-Z0-9]{2,5}$', request.path):
        return HttpResponse('Not found', status=404)
    return render(request, '404.html', status=404)


def handler500(request):
    return render(request, '500.html', status=500)
