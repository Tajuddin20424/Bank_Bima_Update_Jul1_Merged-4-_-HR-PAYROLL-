from django.shortcuts import render

from django.http import JsonResponse
from django.db import connection
from datetime import datetime



def add_employee_department(request):
    return render(request, 'employee_departments/add_employee_department.html')

def save_employee_department(request):
    if request.method == "POST":
        name = request.POST.get('name')
        depStatus = request.POST.get('status')

        cursor = connection.cursor()
        sql = """
            INSERT INTO employee__departments (name, status)
            VALUES (%s, %s)
        """
        params = [name, depStatus]

        cursor.execute(sql, params)

        return JsonResponse({"status": "success", "message": "Save Successful!"})
    
    return JsonResponse({"status": "failed", "message": "Invalid entry!"})

def update_employee_department(request):
    if request.method == "POST":
        name = request.POST.get('name')
        depStatus = request.POST.get('status')
        dep_id = request.POST.get('dep_id')
        cursor = connection.cursor()
        sql = """
            UPDATE employee__departments SET name = %s, status = %s
            WHERE id = %s
        """
        params = [name, depStatus, dep_id]

        cursor.execute(sql, params)

        return JsonResponse({"status":"success","message":"Updated Successfull!"})
    
    return JsonResponse({"status":"failed","message":"Invalid entry!"})

def load_department(request):

    cursor = connection.cursor()
    sql = """
        select 
        s.id as id,
        s.name as name,
        s.status as status
        from employee__departments s
    """

    params = []

    cursor.execute(sql, params)

    department_list = [
        {
            "id": row[0],
            "name": row[1],
            "status": row[2]
        }
        for row in cursor.fetchall()
    ]
    return JsonResponse({
        "department_list": department_list,
    })


def remove_department(request):
    if request.method == "POST":

        dep_id = request.POST.get('dep_id')
        name = request.POST.get('name')

        cursor = connection.cursor()

        sql = """
            DELETE FROM employee__departments 
            WHERE id = %s
        """

        cursor.execute(sql, [dep_id])

        return JsonResponse({
            "status": "success",
            "message": "Deleted Successfully!"
        })

    return JsonResponse({
        "status": "failed",
        "message": "Invalid Request!"
    })

