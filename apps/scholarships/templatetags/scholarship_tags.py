from django import template

register = template.Library()


@register.filter
def score_label(score):
    """Label per the score badge table (System Design v1.0 §11)."""
    if score >= 90:
        return 'Outstanding'
    if score >= 85:
        return 'Excellent'
    if score >= 80:
        return 'Very Strong'
    if score >= 74:
        return 'Good'
    if score >= 60:
        return 'Achievable'
    return 'Stretch'


@register.filter
def eligibility_label(code):
    labels = {
        'CE': 'Confirmed Eligible',
        'LE': 'Likely Eligible',
        'PE': 'Pending Clarification',
        'NE': 'Not Eligible',
    }
    return labels.get(code, code)


@register.filter
def funding_label(code):
    labels = {
        'full': 'Full',
        'partial': 'Partial',
        'tuition_only': 'Tuition Only',
        'living_only': 'Living Only',
    }
    return labels.get(code, code)


@register.filter
def deadline_class(scholarship):
    """Tailwind classes for the deadline countdown (literal strings only)."""
    state = scholarship.deadline_state
    if state == 'urgent':
        return 'text-crimson font-bold animate-pulse'
    if state == 'soon':
        return 'text-amber font-semibold'
    if state == 'closed':
        return 'text-crimson font-bold'
    return 'text-forest font-semibold'
