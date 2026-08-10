from rest_framework.routers import DefaultRouter

from .api_views import (
    DocumentItemViewSet,
    ProfileViewSet,
    TrackedApplicationViewSet,
)

router = DefaultRouter()
router.register('applications', TrackedApplicationViewSet, basename='application')
router.register('documents', DocumentItemViewSet, basename='document')
router.register('profile', ProfileViewSet, basename='profile')

app_name = 'tracker_api'
urlpatterns = router.urls
