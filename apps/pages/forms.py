"""
Server-side form validation for public inputs (Track 3: Security / 3.1).

Defence in depth: the client only marks fields `required`; this Django Form
re-validates everything server-side (the Django counterpart of "Zod on the
server" - never trust client validation alone). A honeypot field filters
bots, and values are never rendered as raw HTML (templates auto-escape).
"""
from django import forms
from django.core.validators import EmailValidator, MaxLengthValidator, MinLengthValidator


class ContactForm(forms.Form):
    name = forms.CharField(
        max_length=120,
        min_length=2,
        validators=[MinLengthValidator(2), MaxLengthValidator(120)],
        error_messages={
            'required': 'Please tell us your name.',
            'min_length': 'Your name must be at least 2 characters.',
        },
    )
    email = forms.EmailField(
        validators=[EmailValidator(message='Please enter a valid email address.')],
        error_messages={'required': 'We need your email to reply.'},
    )
    subject = forms.CharField(
        required=False,
        max_length=200,
        validators=[MaxLengthValidator(200)],
    )
    message = forms.CharField(
        min_length=10,
        max_length=4000,
        validators=[MinLengthValidator(10), MaxLengthValidator(4000)],
        error_messages={
            'required': 'Please write a message (at least 10 characters).',
            'min_length': 'Please write a message of at least 10 characters.',
        },
    )
    # Honeypot - hidden from humans; bots fill it in. If filled, drop silently.
    website = forms.CharField(required=False, max_length=100)

    # AEO attribution (Track 2.5): catches how visitors heard about us,
    # including AI assistants, which analytics miss. Optional; no PII.
    HEAR_ABOUT_CHOICES = [
        ('', 'How did you hear about us? (optional)'),
        ('google', 'Google search'),
        ('ai_assistant', 'ChatGPT / Claude / Perplexity / other AI assistant'),
        ('social', 'Social media (X, LinkedIn, Instagram…)'),
        ('whatsapp', 'WhatsApp'),
        ('friend', 'Friend or family'),
        ('other', 'Other'),
    ]
    hear_about = forms.ChoiceField(
        required=False,
        choices=HEAR_ABOUT_CHOICES,
        widget=forms.Select,
    )

    def clean(self):
        cleaned = super().clean()
        if cleaned.get('website'):
            raise forms.ValidationError('Submission rejected.', code='honeypot')
        return cleaned
