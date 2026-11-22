from django.shortcuts import render
from django.http import Http404, HttpResponse, JsonResponse
from django.db import connection, transaction
from django.views.decorators.http import require_GET, require_POST


# ============================================================
# EMPLOYEE PERSONAL DETAILS PAGE
# ============================================================

def add_employee_personal_details(request):

    return render(request,'employee/add_employee_personal_details.html' )

# ==========================================
# GENERATE EMPLOYEE ID
# ==========================================

def generate_employee_id(cursor):

    cursor.execute("""
        SELECT COALESCE(MAX(id), 0) + 1
        FROM employee__personal__details
    """)

    next_id = cursor.fetchone()[0]

    employee_id = "EM" + str(int(next_id)).zfill(9)

    return employee_id


# ==========================================
# IMAGE CHECK (save + update duitai use kore)
# ==========================================

MAX_IMAGE_SIZE = 2 * 1024 * 1024   # 2 MB
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']


def read_image(request):

    image = request.FILES.get('image')

    if not image:
        return None, None

    if image.content_type not in ALLOWED_IMAGE_TYPES:
        return None, "Only JPG, PNG or WEBP image allowed!"

    if image.size > MAX_IMAGE_SIZE:
        return None, "Image must be 2 MB or smaller!"

    return image.read(), None


def image_mime(data):

    if data[:3] == b'\xff\xd8\xff':
        return 'image/jpeg'
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return 'image/png'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return 'image/webp'
    return 'application/octet-stream'


# ==========================================
# image
# ==========================================
@require_GET
def employee_image(request, employee_id):

    with connection.cursor() as cursor:

        cursor.execute("""
            SELECT image
            FROM employee__personal__details
            WHERE employee_id = %s
        """, [employee_id])

        row = cursor.fetchone()

    if not row or not row[0]:
        raise Http404("Image not found")

    data = bytes(row[0])

    return HttpResponse(data, content_type=image_mime(data))

# ============================================================
# SAVE EMPLOYEE
# ============================================================

@require_POST
def save_employee_personal_details(request):

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
    status = request.POST.get('status', '1')

    # Database-এ required
    if not name or not phn_no or not gender or not religion or not marital_status or not email or not location_id:
        return JsonResponse({
            "status": "failed",
            "message": "Please fill all required fields!"
        }, status=400)

    try:

        location_id = int(location_id)
        status = int(status)

        image = request.FILES.get('image')
        image_data = image.read() if image else None

        with transaction.atomic():

            with connection.cursor() as cursor:

                # Employee ID generate
                cursor.execute("""
                    SELECT id
                    FROM employee__personal__details
                    ORDER BY id DESC
                    LIMIT 1
                    FOR UPDATE
                """)
                cursor.fetchone()

                employee_id = generate_employee_id(cursor)

                # ============================================
                # 1. SAVE USER INFOS
                # ============================================

                cursor.execute("""
                    INSERT INTO user__infos
                    (
                        user_id,
                        login_user_id,
                        user_name,
                        user_phone,
                        gender,
                        dob,
                        address,
                        tran_user_type,
                        tran_method,
                        tran_with_id,
                        status,
                        added_at
                    )
                    VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                """, [
                    employee_id,
                    employee_id,
                    name,
                    phn_no,
                    gender,
                    dob,
                    address,
                    3,
                    "Both",
                    3,
                    status
                ])

                # ============================================
                # 2. SAVE EMPLOYEE PERSONAL DETAILS
                # ============================================

                cursor.execute("""
                    INSERT INTO employee__personal__details
                    (
                        employee_id,
                        name,
                        fathers_name,
                        mothers_name,
                        dob,
                        gender,
                        religion,
                        marital_status,
                        nationality,
                        nid_no,
                        phn_no,
                        blood_group,
                        email,
                        location_id,
                        tran_user_type,
                        address,
                        image,
                        status,
                        updated_at

                    )
                    VALUES
                    (%s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, NOW())
                """, [
                    employee_id,
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
                    3,
                    address or None,
                    image_data,
                    status
                ])

        return JsonResponse({
            "status": "success",
            "message": "Employee saved successfully!",
            "employee_id": employee_id
        })

    except Exception as e:

        import traceback

        print("EMPLOYEE SAVE ERROR:")
        traceback.print_exc()

    return JsonResponse({
        "status": "failed",
        "message": str(e)
    }, status=500)

# ============================================================
# LOAD EMPLOYEE
# ============================================================

@require_GET
def load_employee_personal_details(request):

    try:

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT
                    id,
                    employee_id,
                    name,
                    fathers_name,
                    mothers_name,
                    dob,
                    gender,
                    religion,
                    marital_status,
                    nationality,
                    nid_no,
                    phn_no,
                    blood_group,
                    email,
                    location_id,
                    tran_user_type,
                    address,
                    status
                FROM employee__personal__details
                ORDER BY id DESC
            """)

            rows = cursor.fetchall()

        employee_list = []

        for row in rows:

            employee_list.append({
                "id": row[0],
                "employee_id": row[1],
                "name": row[2],
                "fathers_name": row[3],
                "mothers_name": row[4],
                "dob": row[5].strftime('%Y-%m-%d') if row[5] else '',
                "gender": row[6],
                "religion": row[7],
                "marital_status": row[8],
                "nationality": row[9],
                "nid_no": row[10],
                "phn_no": row[11],
                "blood_group": row[12],
                "email": row[13],
                "location_id": row[14],
                "tran_user_type": row[15],
                "address": row[16],
                "status": row[17]
            })

        return JsonResponse({
            "employee_list": employee_list
        })

    except Exception as e:

        return JsonResponse({
            "status": "failed",
            "message": str(e)
        }, status=500)


# ============================================================
# UPDATE EMPLOYEE
# ============================================================

@require_POST
def update_employee_personal_details(request):

    employee_id = request.POST.get('employee_id', '').strip()
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
    status = request.POST.get('status', '1')

    if not employee_id or not name or not phn_no or not gender or not religion or not marital_status or not email or not location_id:
        return JsonResponse({
            "status": "failed",
            "message": "Please fill all required fields!"
        }, status=400)

    try:

        location_id = int(location_id)
        status = int(status)

        image = request.FILES.get('image')

        with transaction.atomic():

            with connection.cursor() as cursor:

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
                        tran_user_type = %s,
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
                    3,
                    address or None,
                    status,
                    employee_id
                ])

                if cursor.rowcount == 0:
                    return JsonResponse({
                        "status": "failed",
                        "message": "Employee not found or no changes made!"
                    }, status=404)

                if image:

                    cursor.execute("""
                        UPDATE employee__personal__details
                        SET image = %s
                        WHERE employee_id = %s
                    """, [
                        image.read(),
                        employee_id
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
                    employee_id
                ])

        return JsonResponse({
            "status": "success",
            "message": "Employee updated successfully!"
        })

    except Exception as e:

        return JsonResponse({
            "status": "failed",
            "message": str(e)
        }, status=500)


# ============================================================
# DELETE EMPLOYEE
# ============================================================

@require_POST
def remove_employee_personal_details(request):

    employee_id = request.POST.get('employee_id', '').strip()

    if not employee_id:
        return JsonResponse({
            "status": "failed",
            "message": "Employee ID is required!"
        }, status=400)

    try:

        with transaction.atomic():

            with connection.cursor() as cursor:

                cursor.execute("""
                    DELETE FROM employee__personal__details
                    WHERE employee_id = %s
                """, [employee_id])

                deleted_rows = cursor.rowcount

                if deleted_rows == 0:
                    return JsonResponse({
                        "status": "failed",
                        "message": "Employee not found!"
                    }, status=404)

                cursor.execute("""
                    DELETE FROM user__infos
                    WHERE user_id = %s
                    AND tran_user_type = 3
                """, [employee_id])

        return JsonResponse({
            "status": "success",
            "message": "Employee deleted successfully!"
        })

    except Exception as e:

        return JsonResponse({
            "status": "failed",
            "message": str(e)
        }, status=500)