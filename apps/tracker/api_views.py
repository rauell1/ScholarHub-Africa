"""
Tracker API (System Design v1.0 §7) - auth required (Phase 1: single admin user).

GET/POST /api/v1/tracker/applications/
PUT      /api/v1/tracker/applications/<id>/
GET/PUT  /api/v1/tracker/documents/<id>/
"""
from rest_framework import permissions, viewsets

from .models import ApplicantProfile, DocumentItem, TrackedApplication
from .serializers import (
    ApplicantProfileSerializer,
    DocumentItemSerializer,
    TrackedApplicationSerializer,
)


def _profile_for(user):
    profile = ApplicantProfile.objects.filter(user=user).first()
    if not profile:
        profile = ApplicantProfile.objects.create(
            user=user,
            email=user.email or f'{user.username}@scholarhub.local',
            full_name=user.get_full_name() or user.username,
        )
    return profile


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.profile.user == request.user


class TrackedApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TrackedApplicationSerializer

    def get_queryset(self):
        return TrackedApplication.objects.filter(profile__user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(profile=_profile_for(self.request.user))


class DocumentItemViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DocumentItemSerializer
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_queryset(self):
        return DocumentItem.objects.filter(profile__user=self.request.user)


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ApplicantProfileSerializer

    def get_queryset(self):
        return ApplicantProfile.objects.filter(user=self.request.user)
