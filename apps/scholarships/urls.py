from django.urls import path

from . import views

app_name = 'scholarships'

urlpatterns = [
    path('', views.home, name='home'),
    path('scholarships/', views.directory, name='directory'),
    path('scholarships/country/', views.by_country, name='by_country'),
    path('scholarships/field/', views.by_field, name='by_field'),
    path('scholarships/<slug:slug>/', views.detail, name='detail'),
]
