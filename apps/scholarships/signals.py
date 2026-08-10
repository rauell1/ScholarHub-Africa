"""
Signals — automatic ChangeLog entries whenever a Scholarship is edited.

Every field change on an existing scholarship is recorded so the detail
page can show a transparent change history (System Design v1.0 §6.3).
"""
from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import ChangeLog, Scholarship

SKIP_FIELDS = {'updated_at', 'created_at', 'id'}


@receiver(pre_save, sender=Scholarship)
def log_scholarship_changes(sender, instance, **kwargs):
    if not instance.pk:
        return  # brand new record — no history yet

    try:
        old = Scholarship.objects.get(pk=instance.pk)
    except Scholarship.DoesNotExist:
        return

    for field in old._meta.fields:
        name = field.name
        if name in SKIP_FIELDS:
            continue
        old_value = getattr(old, name)
        new_value = getattr(instance, name)
        if old_value != new_value:
            ChangeLog.objects.create(
                scholarship=instance,
                change_type='update',
                field_changed=name,
                old_value=str(old_value) if old_value is not None else '',
                new_value=str(new_value) if new_value is not None else '',
                source='auto',
            )
