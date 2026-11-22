from decimal import Decimal, InvalidOperation
from django.shortcuts import render
from django.http import JsonResponse
from django.db import connection, transaction, IntegrityError
from django.views.decorators.http import require_GET, require_POST


# ==========================================
# COMMON FUNCTION
# ==========================================

def dictfetchall(cursor):

    columns = [col[0] for col in cursor.description]

    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


# ==========================================
# EDUCATION PAGE
# ==========================================

def add_education(request):

    return render(
        request,
        'employee_education_details/add_education.html'
    )


# ==========================================
# EMPLOYEE DROPDOWN
# ==========================================

@require_GET
def get_employee_combo(request):

    try:

        with connection.cursor() as cursor:

            sql = """
                SELECT
                    employee_id,
                    name

                FROM employee__personal__details

                WHERE status = 1

                ORDER BY name ASC
            """

            cursor.execute(sql)

            employee_list = dictfetchall(cursor)

        return JsonResponse({
            'success': True,
            'employee_list': employee_list
        })

    except Exception as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


# ==========================================
# LOAD EDUCATION LIST
# ==========================================

@require_GET
def load_education(request):

    try:

        with connection.cursor() as cursor:

            sql = """
                SELECT
                    ed.id,
                    ed.emp_id,

                    COALESCE(
                        ep.name,
                        ed.emp_id
                    ) AS employee_name,

                    ed.degree,
                    ed.`group`,
                    ed.institution,
                    ed.result,
                    ed.scale,
                    ed.cgpa,
                    ed.marks,
                    ed.batch,
                    ed.status

                FROM employee__education__details ed

                LEFT JOIN employee__personal__details ep
                    ON ep.employee_id = ed.emp_id

                ORDER BY ed.id DESC
            """

            cursor.execute(sql)

            education_list = dictfetchall(cursor)

        return JsonResponse({
            'success': True,
            'education_list': education_list
        })

    except Exception as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


# ==========================================
# VALIDATE FORM DATA
# ==========================================

def validate_education(request):

    emp_id = request.POST.get('emp_id', '').strip()

    degree = request.POST.get('degree', '').strip()

    group = request.POST.get('group', '').strip()

    institution = request.POST.get('institution', '').strip()

    result = request.POST.get('result', '').strip()

    scale = request.POST.get('scale', '').strip()

    cgpa = request.POST.get('cgpa', '').strip()

    marks = request.POST.get('marks', '').strip()

    batch = request.POST.get('batch', '').strip()

    status = request.POST.get('status', '1').strip()

    # ==============================
    # REQUIRED FIELD VALIDATION
    # ==============================

    if not emp_id:

        raise ValueError('Please select employee.')

    if not degree:

        raise ValueError('Please enter degree.')

    if not institution:

        raise ValueError('Please enter institution.')

    if not batch:

        raise ValueError('Please enter batch.')

    try:

        batch = int(batch)

    except ValueError:

        raise ValueError('Batch must be a valid number.')

    if batch < 0:

        raise ValueError('Batch cannot be negative.')

    if status not in ('0', '1'):

        raise ValueError('Invalid status.')

    # ==============================
    # DECIMAL VALIDATION
    # ==============================

    def decimal_value(value, field_name):

        if value == '':
            return None

        try:

            number = Decimal(value)

        except (InvalidOperation, ValueError):

            raise ValueError(
                f'Invalid {field_name}.'
            )

        if not number.is_finite():

            raise ValueError(
                f'Invalid {field_name}.'
            )

        if number < 0:

            raise ValueError(
                f'{field_name} cannot be negative.'
            )

        if number >= Decimal('1000000'):

            raise ValueError(
                f'{field_name} is too large.'
            )

        if number.as_tuple().exponent < -2:

            raise ValueError(
                f'{field_name} supports maximum 2 decimal places.'
            )

        return number

    scale = decimal_value(scale, 'Scale')

    cgpa = decimal_value(cgpa, 'CGPA')

    marks = decimal_value(marks, 'Marks')

    # ==============================
    # CHECK EMPLOYEE
    # ==============================

    with connection.cursor() as cursor:

        cursor.execute("""
            SELECT employee_id

            FROM employee__personal__details

            WHERE employee_id = %s
              AND status = 1

            LIMIT 1
        """, [emp_id])

        employee = cursor.fetchone()

        if not employee:

            raise ValueError('Employee not found.')

    return {
        'emp_id': emp_id,
        'degree': degree,
        'group': group or None,
        'institution': institution,
        'result': result or None,
        'scale': scale,
        'cgpa': cgpa,
        'marks': marks,
        'batch': batch,
        'status': int(status)
    }


# ==========================================
# SAVE EDUCATION
# ==========================================

@require_POST
def save_education(request):

    try:

        data = validate_education(request)

        with transaction.atomic():

            with connection.cursor() as cursor:

                sql = """
                    INSERT INTO employee__education__details
                    (
                        emp_id,
                        degree,
                        `group`,
                        institution,
                        result,
                        scale,
                        cgpa,
                        marks,
                        batch,
                        status,
                        created_at
                    )

                    VALUES
                    (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s,
                        NOW()
                    )
                """

                params = [
                    data['emp_id'],
                    data['degree'],
                    data['group'],
                    data['institution'],
                    data['result'],
                    data['scale'],
                    data['cgpa'],
                    data['marks'],
                    data['batch'],
                    data['status']
                ]

                cursor.execute(sql, params)

        return JsonResponse({
            'success': True,
            'message': 'Education details saved successfully.'
        })

    except (ValueError, IntegrityError) as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

    except Exception as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


# ==========================================
# UPDATE EDUCATION
# ==========================================

@require_POST
def update_education(request):

    try:

        education_id = int(
            request.POST.get('education_id', '0')
        )

        if education_id <= 0:

            raise ValueError('Invalid education ID.')

        data = validate_education(request)

        with transaction.atomic():

            with connection.cursor() as cursor:

                # Check record

                cursor.execute("""
                    SELECT id

                    FROM employee__education__details

                    WHERE id = %s

                    LIMIT 1
                """, [education_id])

                existing = cursor.fetchone()

                if not existing:

                    raise ValueError(
                        'Education record not found.'
                    )

                # Update record

                sql = """
                    UPDATE employee__education__details

                    SET
                        emp_id = %s,
                        degree = %s,
                        `group` = %s,
                        institution = %s,
                        result = %s,
                        scale = %s,
                        cgpa = %s,
                        marks = %s,
                        batch = %s,
                        status = %s,
                        updated_at = NOW()

                    WHERE id = %s
                """

                params = [
                    data['emp_id'],
                    data['degree'],
                    data['group'],
                    data['institution'],
                    data['result'],
                    data['scale'],
                    data['cgpa'],
                    data['marks'],
                    data['batch'],
                    data['status'],
                    education_id
                ]

                cursor.execute(sql, params)

        return JsonResponse({
            'success': True,
            'message': 'Education details updated successfully.'
        })

    except (ValueError, IntegrityError) as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

    except Exception as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


# ==========================================
# DELETE EDUCATION
# ==========================================

@require_POST
def remove_education(request):

    try:

        education_id = int(
            request.POST.get('education_id', '0')
        )

        if education_id <= 0:

            raise ValueError('Invalid education ID.')

        with transaction.atomic():

            with connection.cursor() as cursor:

                sql = """
                    DELETE FROM employee__education__details

                    WHERE id = %s
                """

                cursor.execute(
                    sql,
                    [education_id]
                )

                if cursor.rowcount == 0:

                    raise ValueError(
                        'Education record not found.'
                    )

        return JsonResponse({
            'success': True,
            'message': 'Education details deleted successfully.'
        })

    except (ValueError, IntegrityError) as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=400)

    except Exception as e:

        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)