from django.urls import path
from . import views


urlpatterns = [

    path('add/',views.add_employee_personal_details,name='add_employee_personal_details'),
    path('load/',views.load_employee_personal_details,name='load_employee_personal_details'),
    path('save/',views.save_employee_personal_details,name='save_employee_personal_details'),
    path('update/',views.update_employee_personal_details,name='update_employee_personal_details'),
    path('remove/',views.remove_employee_personal_details,name='remove_employee_personal_details'),
    path('image/<str:employee_id>/',views.employee_image,name='employee_image'),

]