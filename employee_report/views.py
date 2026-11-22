import base64
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from django.shortcuts import render
from django.http import JsonResponse
from django.db import connection, transaction, IntegrityError
from django.views.decorators.http import require_GET, require_POST


# =========================================================
# COMMON HELPERS (UNCHANGED)
# =========================================================

def dictfetchall(cursor):
    """Return all rows from a cursor as a dict"""
    columns = [col[0] for col in cursor.description]
    return [
        dict(zip(columns, row))
        for row in cursor.fetchall()
    ]


def format_val(val):
    """Helper to convert dates, decimals, memoryviews to JSON-serializable types"""
    if isinstance(val, (date, datetime)):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, Decimal):
        return float(val)
    if isinstance(val, (bytes, bytearray, memoryview)):
        return None
    return val


def clean_row(row):
    """Format row fields for JSON response"""
    cleaned = {}
    for k, v in row.items():
        cleaned[k] = format_val(v)
    return cleaned


# =========================================================
# REPORT PAGE  (UNCHANGED)
# =========================================================

@require_GET
def employee_report_page(request):
    """
    Renders the Employee Report / CV Builder page.
    Populates the initial employee dropdown.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    employee_id,
                    name,
                    phn_no,
                    email
                FROM employee__personal__details
                ORDER BY name ASC
            """)
            employees = dictfetchall(cursor)
    except Exception:
        employees = []

    return render(request, "employee_report/employee_report.html", {
        "employees": employees
    })


# =========================================================
# REPORT DATA FETCH  (UNCHANGED)
# =========================================================

@require_GET
def employee_report_data(request, emp_id=None):
    """
    Fetches comprehensive CV data for an employee.
    """
    target_emp_id = emp_id or request.GET.get('emp_id')

    if not target_emp_id:
        return JsonResponse({
            "status": "failed",
            "message": "Employee ID is required."
        }, status=400)

    try:
        with connection.cursor() as cursor:
            # 1. Personal Details
            cursor.execute("""
                SELECT
                    e.id,
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
                    e.location_id,
                    e.tran_user_type,
                    e.address,
                    e.image,
                    e.status,
                    l.division,
                    l.district,
                    l.upazila
                FROM employee__personal__details e
                LEFT JOIN location__infos l ON l.id = e.location_id
                WHERE e.employee_id = %s
                LIMIT 1
            """, [target_emp_id])

            personal_rows = dictfetchall(cursor)
            if not personal_rows:
                return JsonResponse({
                    "status": "failed",
                    "message": "Employee not found."
                }, status=404)

            personal_raw = personal_rows[0]

            image_b64 = None
            raw_image = personal_raw.get('image')
            if raw_image:
                try:
                    if isinstance(raw_image, memoryview):
                        raw_bytes = raw_image.tobytes()
                    elif isinstance(raw_image, (bytes, bytearray)):
                        raw_bytes = bytes(raw_image)
                    else:
                        raw_bytes = None

                    if raw_bytes:
                        encoded = base64.b64encode(raw_bytes).decode('utf-8')
                        image_b64 = f"data:image/jpeg;base64,{encoded}"
                except Exception:
                    image_b64 = None

            personal = clean_row(personal_raw)
            personal['image_base64'] = image_b64

            # 2. Education Details
            cursor.execute("""
                SELECT
                    id,
                    emp_id,
                    degree,
                    `group`,
                    institution,
                    result,
                    scale,
                    cgpa,
                    marks,
                    batch,
                    status
                FROM employee__education__details
                WHERE emp_id = %s
                ORDER BY batch DESC, id DESC
            """, [target_emp_id])
            education = [clean_row(row) for row in dictfetchall(cursor)]

            # 3. Experience Details
            cursor.execute("""
                SELECT
                    id,
                    emp_id,
                    company_name,
                    designation,
                    department,
                    company_location,
                    start_date,
                    end_date,
                    status
                FROM employee__experience__details
                WHERE emp_id = %s
                ORDER BY start_date DESC, id DESC
            """, [target_emp_id])
            experience = [clean_row(row) for row in dictfetchall(cursor)]

            # 4. Training Details
            cursor.execute("""
                SELECT
                    id,
                    emp_id,
                    training_title,
                    country,
                    topic,
                    institution_name,
                    start_date,
                    end_date,
                    status
                FROM employee__training__details
                WHERE emp_id = %s
                ORDER BY start_date DESC, id DESC
            """, [target_emp_id])
            training = [clean_row(row) for row in dictfetchall(cursor)]

            # 5. Organization Details
            organization = {}
            try:
                cursor.execute("""
                    SELECT
                        o.joining_date,
                        d.name AS department_name,
                        des.name AS designation_name,
                        l.district AS location_name
                    FROM employee__organization__details o
                    LEFT JOIN employee__departments d ON d.id = o.department
                    LEFT JOIN designations des ON des.id = o.designation
                    LEFT JOIN location__infos l ON l.id = o.joining_location
                    WHERE o.emp_id = %s
                    LIMIT 1
                """, [target_emp_id])
                org_rows = dictfetchall(cursor)
                if org_rows:
                    organization = clean_row(org_rows[0])
            except Exception:
                organization = {}

        return JsonResponse({
            "status": "success",
            "data": {
                "personal": personal,
                "education": education,
                "experience": experience,
                "training": training,
                "organization": organization
            }
        })

    except Exception as e:
        return JsonResponse({
            "status": "failed",
            "message": str(e)
        }, status=500)


# =========================================================
# SHARED DECIMAL VALIDATOR
# =========================================================

def _decimal_value(value, field_name):
    if value in ('', None):
        return None
    try:
        number = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise ValueError(f'Invalid {field_name}.')

    if not number.is_finite():
        raise ValueError(f'Invalid {field_name}.')
    if number < 0:
        raise ValueError(f'{field_name} cannot be negative.')
    if number >= Decimal('1000000'):
        raise ValueError(f'{field_name} is too large.')
    if number.as_tuple().exponent < -2:
        raise ValueError(f'{field_name} supports maximum 2 decimal places.')
    return number


def _parse_date(value, field_name):
    if not value:
        return None
    try:
        return datetime.strptime(str(value), '%Y-%m-%d').date()
    except ValueError:
        raise ValueError(f'{field_name} must be a valid date.')


def _employee_exists(cursor, emp_id):
    cursor.execute("""
        SELECT employee_id
        FROM employee__personal__details
        WHERE employee_id = %s
          AND status = 1
        LIMIT 1
    """, [emp_id])
    return cursor.fetchone() is not None


# =========================================================
# PERSONAL DETAILS — UPDATE
# =========================================================

@require_POST
def report_update_personal(request):
    try:
        emp_id = request.POST.get('employee_id', '').strip()
        name = request.POST.get('name', '').strip()
        fathers_name = request.POST.get('fathers_name', '').strip()
        mothers_name = request.POST.get('mothers_name', '').strip()
        dob = request.POST.get('dob') or None
        gender = request.POST.get('gender', '').strip()
        religion = request.POST.get('religion', '').strip()
        marital_status = request.POST.get('marital_status', '').strip()
        nationality = request.POST.get('nationality', '').strip()
        nid_no = request.POST.get('nid_no', '').strip()
        phn_no = request.POST.get('phn_no', '').strip()
        blood_group = request.POST.get('blood_group', '').strip()
        email = request.POST.get('email', '').strip()
        location_id = request.POST.get('location_id', '').strip()
        address = request.POST.get('address', '').strip()
        status = request.POST.get('status', '1').strip()

        if not emp_id:
            raise ValueError('Employee ID is required.')
        if not name:
            raise ValueError('Please enter employee name.')
        if not phn_no:
            raise ValueError('Please enter phone number.')
        if not gender:
            raise ValueError('Please select gender.')
        if not religion:
            raise ValueError('Please select religion.')
        if not marital_status:
            raise ValueError('Please select marital status.')
        if not email:
            raise ValueError('Please enter email.')
        if not location_id:
            raise ValueError('Please enter location ID.')

        try:
            location_id = int(location_id)
        except ValueError:
            raise ValueError('Location ID must be a valid number.')

        if status not in ('0', '1'):
            raise ValueError('Invalid status.')
        status = int(status)

        with transaction.atomic():
            with connection.cursor() as cursor:
                if not _employee_exists(cursor, emp_id):
                    raise ValueError('Employee not found or inactive.')

                cursor.execute("""
                    UPDATE employee__personal__details
                    SET
                        name = %s,
                        fathers_name = %s,
                        mothers_name = %s,
                        dob = %s,
                        gender = %s,
                        religion = %s,
                        marital_status = %s,
                        nationality = %s,
                        nid_no = %s,
                        phn_no = %s,
                        blood_group = %s,
                        email = %s,
                        location_id = %s,
                        address = %s,
                        status = %s,
                        updated_at = NOW()
                    WHERE employee_id = %s
                """, [
                    name,
                    fathers_name or None,
                    mothers_name or None,
                    dob,
                    gender,
                    religion,
                    marital_status,
                    nationality or None,
                    nid_no or None,
                    phn_no,
                    blood_group or None,
                    email,
                    location_id,
                    address or None,
                    status,
                    emp_id,
                ])

                cursor.execute("""
                    UPDATE user__infos
                    SET
                        user_name = %s,
                        user_phone = %s,
                        gender = %s,
                        dob = %s,
                        address = %s,
                        status = %s
                    WHERE user_id = %s
                """, [
                    name,
                    phn_no,
                    gender,
                    dob,
                    address,
                    status,
                    emp_id,
                ])

        return JsonResponse({
            "status": "success",
            "message": "Personal details updated successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "status": "failed",
            "message": str(e)
        }, status=500)


# =========================================================
# EDUCATION — SAVE / UPDATE / REMOVE
# =========================================================

def _validate_education(request):
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

    scale = _decimal_value(scale, 'Scale')
    cgpa = _decimal_value(cgpa, 'CGPA')
    marks = _decimal_value(marks, 'Marks')

    with connection.cursor() as cursor:
        if not _employee_exists(cursor, emp_id):
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
        'status': int(status),
    }


@require_POST
def report_save_education(request):
    try:
        data = _validate_education(request)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
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
                """, [
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
                ])

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Education details saved successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


@require_POST
def report_update_education(request):
    try:
        education_id = int(request.POST.get('education_id', '0'))
        if education_id <= 0:
            raise ValueError('Invalid education ID.')

        data = _validate_education(request)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id FROM employee__education__details
                    WHERE id = %s LIMIT 1
                """, [education_id])

                if not cursor.fetchone():
                    raise ValueError('Education record not found.')

                cursor.execute("""
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
                """, [
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
                    education_id,
                ])

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Education details updated successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


@require_POST
def report_remove_education(request):
    try:
        education_id = int(request.POST.get('education_id', '0'))
        if education_id <= 0:
            raise ValueError('Invalid education ID.')

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM employee__education__details
                    WHERE id = %s
                """, [education_id])

                if cursor.rowcount == 0:
                    raise ValueError('Education record not found.')

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Education record deleted successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


# =========================================================
# EXPERIENCE — SAVE / UPDATE / REMOVE
# =========================================================

def _validate_experience(request):
    emp_id = request.POST.get('emp_id', '').strip()
    company_name = request.POST.get('company_name', '').strip()
    designation = request.POST.get('designation', '').strip()
    department = request.POST.get('department', '').strip()
    company_location = request.POST.get('company_location', '').strip()
    start_date = request.POST.get('start_date', '').strip()
    end_date = request.POST.get('end_date', '').strip()
    status = request.POST.get('status', '1').strip()

    if not emp_id:
        raise ValueError('Please select employee.')
    if not company_name:
        raise ValueError('Please enter company name.')
    if status not in ('0', '1'):
        raise ValueError('Invalid status.')

    start_date = _parse_date(start_date, 'Start date')
    end_date = _parse_date(end_date, 'End date')

    if start_date and end_date and end_date < start_date:
        raise ValueError('End date cannot be earlier than start date.')

    with connection.cursor() as cursor:
        if not _employee_exists(cursor, emp_id):
            raise ValueError('Employee not found or inactive.')

    return {
        'emp_id': emp_id,
        'company_name': company_name,
        'designation': designation or None,
        'department': department or None,
        'company_location': company_location or None,
        'start_date': start_date,
        'end_date': end_date,
        'status': int(status),
    }


@require_POST
def report_save_experience(request):
    try:
        data = _validate_experience(request)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO employee__experience__details
                    (
                        emp_id,
                        company_name,
                        designation,
                        department,
                        company_location,
                        start_date,
                        end_date,
                        status,
                        created_at
                    )
                    VALUES
                    (
                        %s, %s, %s, %s,
                        %s, %s, %s, %s, NOW()
                    )
                """, [
                    data['emp_id'],
                    data['company_name'],
                    data['designation'],
                    data['department'],
                    data['company_location'],
                    data['start_date'],
                    data['end_date'],
                    data['status'],
                ])

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Experience details saved successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


@require_POST
def report_update_experience(request):
    try:
        exp_id = int(request.POST.get('experience_id', '0'))
        if exp_id <= 0:
            raise ValueError('Invalid experience ID.')

        data = _validate_experience(request)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id FROM employee__experience__details
                    WHERE id = %s LIMIT 1
                """, [exp_id])

                if not cursor.fetchone():
                    raise ValueError('Experience record not found.')

                cursor.execute("""
                    UPDATE employee__experience__details
                    SET
                        emp_id = %s,
                        company_name = %s,
                        designation = %s,
                        department = %s,
                        company_location = %s,
                        start_date = %s,
                        end_date = %s,
                        status = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """, [
                    data['emp_id'],
                    data['company_name'],
                    data['designation'],
                    data['department'],
                    data['company_location'],
                    data['start_date'],
                    data['end_date'],
                    data['status'],
                    exp_id,
                ])

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Experience details updated successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


@require_POST
def report_remove_experience(request):
    try:
        exp_id = int(request.POST.get('experience_id', '0'))
        if exp_id <= 0:
            raise ValueError('Invalid experience ID.')

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM employee__experience__details
                    WHERE id = %s
                """, [exp_id])

                if cursor.rowcount == 0:
                    raise ValueError('Experience record not found.')

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Experience record deleted successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


# =========================================================
# TRAINING — SAVE / UPDATE / REMOVE
# =========================================================

def _validate_training(request):
    emp_id = request.POST.get('emp_id', '').strip()
    training_title = request.POST.get('training_title', '').strip()
    country = request.POST.get('country', '').strip()
    topic = request.POST.get('topic', '').strip()
    institution_name = request.POST.get('institution_name', '').strip()
    start_date = request.POST.get('start_date', '').strip()
    end_date = request.POST.get('end_date', '').strip()
    status = request.POST.get('status', '1').strip()

    if not emp_id:
        raise ValueError('Please select employee.')
    if not training_title:
        raise ValueError('Please enter training title.')
    if not topic:
        raise ValueError('Please enter training topic.')
    if not institution_name:
        raise ValueError('Please enter institution name.')
    if status not in ('0', '1'):
        raise ValueError('Invalid status.')

    start_date = _parse_date(start_date, 'Start date')
    end_date = _parse_date(end_date, 'End date')

    if start_date and end_date and end_date < start_date:
        raise ValueError('End date cannot be earlier than start date.')

    with connection.cursor() as cursor:
        if not _employee_exists(cursor, emp_id):
            raise ValueError('Employee not found.')

    return {
        'emp_id': emp_id,
        'training_title': training_title,
        'country': country or None,
        'topic': topic,
        'institution_name': institution_name,
        'start_date': start_date,
        'end_date': end_date,
        'status': int(status),
    }


@require_POST
def report_save_training(request):
    try:
        data = _validate_training(request)

        with transaction.atomic():
            with connection.cursor() as cursor:
                # Preserve existing manual-ID pattern.
                cursor.execute("""
                    SELECT COALESCE(MAX(id), 0) + 1
                    FROM employee__training__details
                    FOR UPDATE
                """)
                new_id = cursor.fetchone()[0]

                cursor.execute("""
                    INSERT INTO employee__training__details
                    (
                        id,
                        emp_id,
                        training_title,
                        country,
                        topic,
                        institution_name,
                        start_date,
                        end_date,
                        status,
                        created_at
                    )
                    VALUES
                    (
                        %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, NOW()
                    )
                """, [
                    new_id,
                    data['emp_id'],
                    data['training_title'],
                    data['country'],
                    data['topic'],
                    data['institution_name'],
                    data['start_date'],
                    data['end_date'],
                    data['status'],
                ])

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Training details saved successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


@require_POST
def report_update_training(request):
    try:
        training_id = int(request.POST.get('training_id', '0'))
        if training_id <= 0:
            raise ValueError('Invalid training ID.')

        data = _validate_training(request)

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT id FROM employee__training__details
                    WHERE id = %s LIMIT 1
                """, [training_id])

                if not cursor.fetchone():
                    raise ValueError('Training record not found.')

                cursor.execute("""
                    UPDATE employee__training__details
                    SET
                        emp_id = %s,
                        training_title = %s,
                        country = %s,
                        topic = %s,
                        institution_name = %s,
                        start_date = %s,
                        end_date = %s,
                        status = %s,
                        updated_at = NOW()
                    WHERE id = %s
                """, [
                    data['emp_id'],
                    data['training_title'],
                    data['country'],
                    data['topic'],
                    data['institution_name'],
                    data['start_date'],
                    data['end_date'],
                    data['status'],
                    training_id,
                ])

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Training details updated successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)


@require_POST
def report_remove_training(request):
    try:
        training_id = int(request.POST.get('training_id', '0'))
        if training_id <= 0:
            raise ValueError('Invalid training ID.')

        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("""
                    DELETE FROM employee__training__details
                    WHERE id = %s
                """, [training_id])

                if cursor.rowcount == 0:
                    raise ValueError('Training record not found.')

        return JsonResponse({
            "success": True,
            "status": "success",
            "message": "Training record deleted successfully."
        })

    except (ValueError, IntegrityError) as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=400)

    except Exception as e:
        return JsonResponse({
            "success": False,
            "status": "failed",
            "message": str(e)
        }, status=500)