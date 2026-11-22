from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.db import connection
from datetime import datetime


def add_experience(request):
    return render(request, 'experience/add_experience.html')



def save_experience(request):
    if request.method == "POST":
        emp_id = request.POST.get('emp_id')
        company_name = request.POST.get('company_name')
        designation = request.POST.get('designation', '')
        department = request.POST.get('department', '')
        company_location = request.POST.get('company_location', '')
        status = request.POST.get('status', 1)

        cursor = connection.cursor()
        sql = """
            INSERT INTO employee__experience__details (emp_id, company_name, designation, department, company_location, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        params = [emp_id, company_name, designation, department, company_location, status, datetime.now()]

        cursor.execute(sql, params)

        return JsonResponse({"status": "success", "message": "Save Successful!"})

    return JsonResponse({"status": "failed", "message": "Invalid entry!"})


def update_experience(request):
    if request.method == "POST":
        exp_id = request.POST.get('id') or request.POST.get('exp_id')
        emp_id = request.POST.get('emp_id')
        company_name = request.POST.get('company_name')
        designation = request.POST.get('designation', '')
        department = request.POST.get('department', '')
        company_location = request.POST.get('company_location', '')
        status = request.POST.get('status', 1)

        cursor = connection.cursor()
        sql = """
            UPDATE employee__experience__details
            SET emp_id = %s, company_name = %s, designation = %s, department = %s, company_location = %s, status = %s, updated_at = %s
            WHERE id = %s
        """
        params = [emp_id, company_name, designation, department, company_location, status, datetime.now(), exp_id]

        cursor.execute(sql, params)

        return JsonResponse({"status": "success", "message": "Updated Successfully!"})

    return JsonResponse({"status": "failed", "message": "Invalid entry!"})


def load_experience(request):

    cursor = connection.cursor()
    sql = """
        SELECT em.id as id, em.emp_id as emp_id, em.company_name as company_name, em.designation as designation, em.department as department, em.company_location as company_location, em.status as status
        FROM employee__experience__details em
    """

    params = []

    cursor.execute(sql, params)

    experience_list = [
        {
            "id": row[0],
            "emp_id": row[1] or "",
            "company_name": row[2] or "",
            "designation": row[3] or "",
            "department": row[4] or "",
            "company_location": row[5] or "",
            "status": row[6],
        }
        for row in cursor.fetchall()
    ]
    return JsonResponse({
        "experience_list": experience_list,
    })


def remove_experience(request):
    if request.method == "POST":
        exp_id = request.POST.get('id') or request.POST.get('exp_id')

        cursor = connection.cursor()

        sql = """
            DELETE FROM employee__experience__details
            WHERE id = %s
        """
        
        cursor.execute(sql, [exp_id])

        return JsonResponse({
            "status": "success",
            "message": "Deleted Successfully!"
        })

    return JsonResponse({
        "status": "failed",
        "message": "Invalid Request!"
    })
