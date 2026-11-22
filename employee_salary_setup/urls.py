from django.urls import path
from . import views
urlpatterns = [
 path('salary-setup/', views.page, name='salary_setup_page'),
 path('salary-setup/get/', views.get_salary, name='salary_setup_get'),
 path('salary-setup/save/', views.save_salary, name='salary_setup_save'),
 path('salary-setup/update/', views.update_salary, name='salary_setup_update'),
#  path('salary-setup/delete/', views.delete_salary, name='salary_setup_delete'),
 path('salary-setup/employee-search/', views.employee_search_url, name='employee_search_url'),
 path('salary-setup/head-search/', views.head_search_url, name='head_search_url'),
 path('salary-setup/duplication-check/', views.duplication_check, name='duplication_check'),


path('salary-setup/employee-details/', views.employee_details, name='salary_setup_employee_details'),

]
