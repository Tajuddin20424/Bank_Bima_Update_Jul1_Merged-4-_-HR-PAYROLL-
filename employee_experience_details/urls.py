from django.urls import path
from . import views

urlpatterns = [
    path('add-experience/', views.add_experience, name='add_experience'),
    path('load-experience/', views.load_experience, name='load_experience'),
    path('save-experience/', views.save_experience, name='save_experience'),
    path('update-experience/', views.update_experience, name='update_experience'),
    path('remove-experience/', views.remove_experience, name='remove_experience'),
]