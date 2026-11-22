from django.urls import path
from . import views

urlpatterns = [
    # =========================================================
    # EXISTING ROUTES (UNCHANGED — DO NOT REMOVE)
    # =========================================================
    path(
        'employee-report/',
        views.employee_report_page,
        name='employee_report_page'
    ),
    path(
        'employee-report/<str:emp_id>/data/',
        views.employee_report_data,
        name='employee_report_data'
    ),
    path(
        'employee-report/data/',
        views.employee_report_data,
        name='employee_report_data_query'
    ),

    # =========================================================
    # NEW ROUTES — PERSONAL DETAILS (EDIT INLINE)
    # =========================================================
    path(
        'employee-report/personal/update/',
        views.report_update_personal,
        name='report_update_personal'
    ),

    # =========================================================
    # NEW ROUTES — EDUCATION
    # =========================================================
    path(
        'employee-report/education/save/',
        views.report_save_education,
        name='report_save_education'
    ),
    path(
        'employee-report/education/update/',
        views.report_update_education,
        name='report_update_education'
    ),
    path(
        'employee-report/education/remove/',
        views.report_remove_education,
        name='report_remove_education'
    ),

    # =========================================================
    # NEW ROUTES — EXPERIENCE
    # =========================================================
    path(
        'employee-report/experience/save/',
        views.report_save_experience,
        name='report_save_experience'
    ),
    path(
        'employee-report/experience/update/',
        views.report_update_experience,
        name='report_update_experience'
    ),
    path(
        'employee-report/experience/remove/',
        views.report_remove_experience,
        name='report_remove_experience'
    ),

    # =========================================================
    # NEW ROUTES — TRAINING
    # =========================================================
    path(
        'employee-report/training/save/',
        views.report_save_training,
        name='report_save_training'
    ),
    path(
        'employee-report/training/update/',
        views.report_update_training,
        name='report_update_training'
    ),
    path(
        'employee-report/training/remove/',
        views.report_remove_training,
        name='report_remove_training'
    ),
]