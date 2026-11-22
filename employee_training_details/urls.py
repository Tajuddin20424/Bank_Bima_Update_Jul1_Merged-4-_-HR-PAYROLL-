
from django.urls import path
from . import views

urlpatterns = [
    path(
        '',
        views.add_employee_training_details,
        name='add_employee_training_details'
    ),
    path(
        'save/',
        views.save_employee_training_details,
        name='save_employee_training_details'
    ),
    path(
        'load/',
        views.load_employee_training_details,
        name='load_employee_training_details'
    ),
    path(
        'update/',
        views.update_employee_training_details,
        name='update_employee_training_details'
    ),
    path(
        'remove/',
        views.remove_employee_training_details,
        name='remove_employee_training_details'
    ),
]