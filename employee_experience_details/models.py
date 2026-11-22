from django.db import models


class EmployeeExperienceDetails(models.Model):
    id = models.BigAutoField(primary_key=True)
    emp_id = models.CharField(max_length=255, db_column='emp_id')
    company_name = models.CharField(max_length=255)
    designation = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    company_location = models.CharField(max_length=255, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'employee__experience__details'

    def __str__(self):
        return f"{self.emp_id} - {self.company_name}"
