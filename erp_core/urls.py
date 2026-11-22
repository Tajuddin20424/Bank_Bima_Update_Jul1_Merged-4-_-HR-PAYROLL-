# erp_core/urls.py
from django.contrib import admin
from django.contrib.admindocs import views
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', include('employee_salary_sheet.urls')),

    path('admin/', admin.site.urls),
    path('', include('page_init.urls')),
    path('', include('core.urls')),
    path('', include('pharmacy.urls')), 
    # path('pharmacy/', include('pharmacy.urls')),
    path('', include('company.urls')), 
    path('users/', include('users.urls')),
    path('', include('location.urls')),
    path('', include('bank.urls')),
    path('', include('store.urls')),
    path('', include('payment_method.urls')),
    path('', include('main_heads.urls')),
    path('', include('transaction_main_heads.urls')),
    path('', include('transaction_group.urls')),
    path('', include('transaction_head.urls')),    
    path('', include('transaction_with.urls')),    
    path('', include('transaction_with_user.urls')),    
    path('', include('corporates.urls')),
    path('', include('combo_load.urls')),
    path('', include('administrator.urls')),
    path('general/', include('general_transaction.urls')), 
    path('general/', include('general_transaction.urls_payment')), 
    path('bank-bima/', include('bank_bima.urls')),
    path('diagnosis/', include('diagnosis.urls')),
    path('doctors/', include('doctors.urls')),
    path('representatives/', include('sr.urls')),
    path('transaction-category/', include('transaction_category.urls')),
    path('dcc/', include('dcc.urls')),
    path('', include('all_transaction_report.urls')),
    path('', include('details_statement.urls')),
    path('', include('consolidated_report.urls')),
    path('hotel/', include('hotel.urls')),
    path('bed_category/', include('bed_category.urls')),
    path('bed_info/', include('bed_info.urls')),
    path('check_in_details/', include('check_in_details.urls')),
    path('', include('employee_salary_setup.urls')),
    path('employee-education-details/',include('employee_education_details.urls')),
    path('employee_personal_details/', include('employee_personal_details.urls')),
    path('employee-experience/', include('employee_experience_details.urls')),
    path('employee-training-details/', include('employee_training_details.urls')),
    path('', include('employee_departments.urls')),
    path('', include('employee_report.urls')),

]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
