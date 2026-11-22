from django.urls import path
from . import views


urlpatterns = [

    path(
        '',
        views.add_education,
        name='add_education'
    ),

    path(
        'get-employee-combo/',
        views.get_employee_combo,
        name='get_employee_combo'
    ),

    path(
        'load-education/',
        views.load_education,
        name='load_education'
    ),

    path(
        'save-education/',
        views.save_education,
        name='save_education'
    ),

    path(
        'update-education/',
        views.update_education,
        name='update_education'
    ),

    path(
        'remove-education/',
        views.remove_education,
        name='remove_education'
    ),

]