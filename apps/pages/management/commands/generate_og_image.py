"""
Generate the social share (OG/Twitter) image at static/img/og-image.png.

Deterministic 1200×630 banner rendered with Pillow - navy background,
teal accents, a drawn mortarboard, and the site name/tagline. Used by the
og:image / twitter:image meta tags (SEO checklist #13).

    python manage.py generate_og_image
"""
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1200, 630

NAVY = (31, 56, 100)
NAVY_DARK = (22, 41, 74)
TEAL = (26, 188, 156)
TEAL_LIGHT = (163, 232, 218)
WHITE = (255, 255, 255)
AMBER = (243, 156, 18)

FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/System/Library/Fonts/Helvetica.ttc',
]


def load_font(size):
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_mortarboard(draw, x, y, scale=1.0, fill=TEAL):
    """Small graduation-cap glyph drawn with polygons (no emoji font needed)."""
    s = scale
    draw.polygon(
        [(x, y), (x + 60 * s, y - 28 * s), (x + 120 * s, y), (x + 60 * s, y + 28 * s)],
        fill=fill,
    )
    draw.rectangle([x + 18 * s, y + 22 * s, x + 30 * s, y + 78 * s], fill=NAVY)
    draw.line([(x + 22 * s, y + 78 * s), (x + 78 * s, y + 78 * s)], fill=NAVY, width=int(6 * s))


class Command(BaseCommand):
    help = 'Render the 1200x630 social share image (static/img/og-image.png).'

    def handle(self, *args, **options):
        output_dir = Path(settings.BASE_DIR) / 'static' / 'img'
        output_dir.mkdir(parents=True, exist_ok=True)
        output = output_dir / 'og-image.png'

        img = Image.new('RGB', (WIDTH, HEIGHT), NAVY)
        draw = ImageDraw.Draw(img)

        # Decorative background circles
        draw.ellipse([-140, -140, 220, 220], fill=NAVY_DARK)
        draw.ellipse([1020, 400, 1380, 760], fill=NAVY_DARK)
        draw.ellipse([980, -80, 1180, 120], outline=TEAL, width=4)
        draw.ellipse([40, 480, 190, 630], outline=TEAL_LIGHT, width=3)

        # Left accent bar + mortarboard
        draw.rectangle([0, 0, 14, HEIGHT], fill=TEAL)
        draw_mortarboard(draw, 92, 300, scale=1.35)

        # Title
        title_font = load_font(64)
        draw.text((92, 200), 'ScholarHub', font=title_font, fill=WHITE)
        draw.text((92, 292), 'Africa', font=title_font, fill=TEAL)

        # Tagline
        tag_font = load_font(30)
        draw.text(
            (92, 420),
            "Fully-funded master's scholarships for African students",
            font=tag_font,
            fill=TEAL_LIGHT,
        )

        # Domain + verify pill
        small_font = load_font(24)
        draw.text((92, 520), 'scholarhub.africa', font=small_font, fill=WHITE)
        pill_w, pill_h = 230, 44
        draw.rounded_rectangle(
            [WIDTH - 92 - pill_w, 60, WIDTH - 92, 60 + pill_h],
            radius=22, fill=TEAL,
        )
        draw.text(
            (WIDTH - 92 - pill_w + 26, 70),
            '✅ Human-verified',
            font=load_font(20),
            fill=NAVY,
        )

        # Tiny footer band
        draw.rectangle([0, HEIGHT - 10, WIDTH, HEIGHT], fill=TEAL)

        img.save(output, 'PNG')
        self.stdout.write(self.style.SUCCESS(f'OG image written to {output}'))
