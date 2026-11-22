import logging
from decimal import Decimal, InvalidOperation

from django.db import connection, transaction, IntegrityError
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST

logger = logging.getLogger(__name__)

# ==========================================
# COMMON FUNCTION (same name)
# ==========================================
def rows(cursor):
    columns = [col[0] for col in cursor.description]
    result = []
    for row in cursor.fetchall():
        result.append(dict(zip(columns, row)))
    return result
# ==========================================
# SALARY SETUP PAGE
# ==========================================
def page(request):
    return render(request, 'salary_setup/salary.html')
# ==========================================
# LOAD SALARY LIST
# ==========================================
@require_GET
def get_salary(request):

    emp_id = request.GET.get('emp_id', '').strip()

    cursor = connection.cursor()
    sql = """
        select
        p.id as id,
        p.emp_id as emp_id,
        COALESCE(e.name, CAST(p.emp_id AS CHAR)) as employee_name,
        p.head_id as head_id,
        COALESCE(h.tran_head_name, CAST(p.head_id AS CHAR)) as head_name,
        p.amount as amount,
        p.status as status
        from employee__payroll__setups p
        LEFT JOIN employee__personal__details e ON e.employee_id = p.emp_id
        LEFT JOIN transaction__heads h ON h.id = p.head_id
        WHERE (%s = '' OR p.emp_id = %s)
        ORDER BY p.id DESC
    """

    params = [emp_id, emp_id]

    cursor.execute(sql, params)

    salary_list = [
        {
            "id": row[0],
            "emp_id": row[1],
            "employee_name": row[2],
            "head_id": row[3],
            "head_name": row[4],
            "amount": row[5],
            "status": row[6]
        }
        for row in cursor.fetchall()
    ]

    print(salary_list)

    return JsonResponse({
        "data": salary_list,
    })

@require_GET
def duplication_check(request):
    emp_id = request.GET.get('emp_id')
    head_id = request.GET.get('head_id')

    cursor = connection.cursor()
    sql = """
        SELECT
            p.id
        FROM employee__payroll__setups p
        WHERE p.emp_id = %s AND p.head_id = %s
    """
    params = [emp_id, head_id]

    cursor.execute(sql, params)

    data = [
        {
            "id": row[0]
        }
        for row in cursor.fetchall()
    ]
    print("duplication_check data:", data)  # Debugging line
    return JsonResponse({
        "data": data,
    })
    
#---------------------------------
# Employee Search List
#---------------------------------
def employee_search_url(request):
    search = request.GET.get('search', '').strip()

    search_pattern = f"%{search}%"

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                e.employee_id,
                e.name,
                e.phn_no,
                e.address
            FROM employee__personal__details e
            WHERE
                e.status = 1
                AND (
                    CAST(e.employee_id AS CHAR) LIKE %s
                    OR COALESCE(e.name, '') LIKE %s
                    OR CAST(COALESCE(e.phn_no, '') AS CHAR) LIKE %s
                    OR COALESCE(e.address, '') LIKE %s
                )
            ORDER BY e.name ASC
            LIMIT 10
        """, [
            search_pattern,
            search_pattern,
            search_pattern,
            search_pattern
        ])

        rows = cursor.fetchall()
    # Convert database rows into JSON results
    results = [
        {
            "employee_id": row[0],
            "name": row[1] or "",
            "mobile": row[2] or "",
            "address": row[3] or ""
        }
        for row in rows
    ]

    return JsonResponse({
        "status": "success",
        "results": results
    })
#---------------------------------
# Transaction Head Search List
#---------------------------------
def head_search_url(request):
    search = request.GET.get('search', '').strip()

    search_pattern = f"%{search}%"

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                h.id,
                h.tran_head_name
            FROM transaction__heads h
            WHERE
                h.tran_main_head_id = 3 
                AND h.groupe_id = 1
                AND h.status = 1
                AND (
                    CAST(h.id AS CHAR) LIKE %s
                    OR COALESCE(h.tran_head_name, '') LIKE %s
                )
            ORDER BY h.id ASC
            LIMIT 10
        """, [
            search_pattern,
            search_pattern
        ])

        rows = cursor.fetchall()

    results = [
        {
            "id": row[0],
            "tran_head_name": row[1] or ""
        }
        for row in rows
    ]

    return JsonResponse({
        "status": "success",
        "results": results
    })
# ==========================================
# SAVE SALARY SETUP
# ==========================================
@require_POST
def save_salary(request):
    try:
        emp = request.POST.get('emp_id')
        head = request.POST.get('head_id')
        amount = request.POST.get('amount')
        status = request.POST.get('status', '1')

        with connection.cursor() as cursor:

            # Employee Setup Table
            cursor.execute("""
                INSERT INTO employee__payroll__setups
                (emp_id, head_id, amount, status, added_at)
                VALUES (%s, %s, %s, %s, NOW())
            """, [emp, head, amount, status])

            # Employee Middleware Table
            cursor.execute("""
                INSERT INTO employee__payroll__middlewires
                (emp_id, head_id, amount, salary_month, salary_year, `date`, status)
                VALUES (%s, %s, %s, MONTH(NOW()), YEAR(NOW()), NOW(), %s)
            """, [emp, head, amount, status])

        return JsonResponse({
            'success': True,
            'status': 'success',
            'message': 'Saved successfully!'
        })

    except Exception as e:
        logger.exception('Salary setup save failed')
        return JsonResponse({'success': False, 'status': 'failed', 'message': 'Save failed: ' + str(e)}, status=500)
# ==========================================
# UPDATE SALARY SETUP
# ==========================================
@require_POST
def update_salary(request):
    try:
        pk = request.POST.get('id')
        emp = request.POST.get('emp_id')
        head = request.POST.get('head_id')
        amount = request.POST.get('amount')
        status = request.POST.get('status', '1')

        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE employee__payroll__setups
                SET emp_id = %s,
                    head_id = %s,
                    amount = %s,
                    status = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, [emp, head, amount, status, pk])

        return JsonResponse({
            'success': True,
            'status': 'success',
            'message': 'Updated successfully!'
        })

    except Exception as e:
        logger.exception('Salary setup update failed')
        return JsonResponse({'success': False, 'status': 'failed', 'message': 'Update failed: ' + str(e)}, status=500)


# ==========================================
# EMPLOYEE DETAILS (employee__personal__details theke)
# ==========================================
@require_GET
def employee_details(request):

    emp_id = request.GET.get('emp_id', '').strip()

    cursor = connection.cursor()
    sql = """
        select
        e.employee_id,
        e.name,
        e.fathers_name,
        e.mothers_name,
        e.dob,
        e.gender,
        e.religion,
        e.marital_status,
        e.nationality,
        e.nid_no,
        e.phn_no,
        e.blood_group,
        e.email,
        e.address,
        e.image IS NOT NULL as has_image
        from employee__personal__details e
        where e.employee_id = %s
        limit 1
    """

    params = [emp_id]

    cursor.execute(sql, params)

    row = cursor.fetchone()

    if not row:
        return JsonResponse({
            "status": "failed",
            "message": "Employee not found."
        })

    employee = {
        "employee_id": row[0],
        "name": row[1],
        "fathers_name": row[2],
        "mothers_name": row[3],
        "dob": row[4].strftime('%d-%m-%Y') if row[4] else "",
        "gender": row[5],
        "religion": row[6],
        "marital_status": row[7],
        "nationality": row[8],
        "nid_no": row[9],
        "phn_no": row[10],
        "blood_group": row[11],
        "email": row[12],
        "address": row[13],
        "has_image": bool(row[14])
    }

    return JsonResponse({
        "status": "success",
        "employee": employee
    })