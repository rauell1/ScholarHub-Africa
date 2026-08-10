from django.urls import path

from . import views

app_name = 'tracker'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('checklist/', views.checklist, name='checklist'),
    path('add/<int:scholarship_id>/', views.add_application, name='add'),
    path('update/<int:application_id>/', views.update_application, name='update'),
    path('remove/<int:application_id>/', views.remove_application, name='remove'),
]
