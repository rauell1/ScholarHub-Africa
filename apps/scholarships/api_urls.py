from django.urls import path
from rest_framework.routers import DefaultRouter

from .api_views import CountryViewSet, FieldViewSet, ScholarshipViewSet, SearchView, CSVUploadView

router = DefaultRouter()
router.register('scholarships', ScholarshipViewSet, basename='scholarship')
router.register('countries', CountryViewSet, basename='country')
router.register('fields', FieldViewSet, basename='field')

app_name = 'api'
urlpatterns = [
    path('search/', SearchView.as_view(), name='search'),
    path('scholarships/upload_csv/', CSVUploadView.as_view(), name='upload_csv'),
] + router.urls
