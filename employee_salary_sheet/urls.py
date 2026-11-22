from django.urls import path
from . import views
urlpatterns = [
    path('salary-sheet/', views.page, name='salary_sheet_page'),
    path('salary-sheet/preview/', views.preview, name='salary_sheet_preview'),
    path('salary-sheet/save/', views.save, name='salary_sheet_save'),
    path('salary-month-combo/', views.salary_month_combo, name='salary_month_combo'),
    path('salary-year-combo/', views.salary_year_combo, name='salary_year_combo'),
]
