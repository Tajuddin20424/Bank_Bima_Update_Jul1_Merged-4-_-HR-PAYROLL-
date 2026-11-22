from django.urls import path
from . import views

urlpatterns = [

    path('add-employee-department/',views.add_employee_department,name='add_employee_department'),
    path('<int:employee_id>/add-employee-department/',views.add_employee_department,name='add_employee_department_by_id'),
    path('load-department/', views.load_department, name='load_department'),
    path('save-employee-department/', views.save_employee_department, name='save_employee_department'),
    path('update-employee-department/', views.update_employee_department, name='update_employee_department'),
    path('remove-department/', views.remove_department, name='remove_department'),
]