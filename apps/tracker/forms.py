from django import forms

from .models import TrackedApplication


class TrackedApplicationForm(forms.ModelForm):
    class Meta:
        model = TrackedApplication
        fields = [
            'stage', 'priority', 'sop_status', 'refs_status',
            'transcript_ready', 'moi_ready', 'next_action', 'next_action_due', 'notes',
        ]
        widgets = {
            'next_action': forms.TextInput(attrs={'class': 'input', 'placeholder': 'e.g. Email referee 1'}),
            'next_action_due': forms.DateInput(attrs={'type': 'date', 'class': 'input'}),
            'notes': forms.Textarea(attrs={'rows': 2, 'class': 'input'}),
            'stage': forms.Select(attrs={'class': 'input', 'onchange': 'this.form.submit()'}),
            'priority': forms.Select(attrs={'class': 'input'}),
            'sop_status': forms.Select(attrs={'class': 'input'}),
            'refs_status': forms.Select(attrs={'class': 'input'}),
        }
