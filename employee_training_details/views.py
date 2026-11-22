
from django.shortcuts import render
from django.http import JsonResponse
from django.db import connection


# Page
def add_employee_training_details(request):
    return render(
        request,
        'employee_training_details/add_employee_training_details.html'
    )


# Save training details
def save_employee_training_details(request):
    if request.method == "POST":
        emp_id = request.POST.get('emp_id')
        training_title = request.POST.get('training_title')
        country = request.POST.get('country')
        topic = request.POST.get('topic')
        institution_name = request.POST.get('institution_name')
        start_date = request.POST.get('start_date') or None
        end_date = request.POST.get('end_date') or None

        if not all([
            emp_id,
            training_title,
            topic,
            institution_name
        ]):
            return JsonResponse({
                "status": "failed",
                "message": "Please fill in all required fields!"
            })

        try:
            with connection.cursor() as cursor:
                # Existing table has no AUTO_INCREMENT on id.
                # Generate the next ID using the current maximum.
                cursor.execute("""
                    SELECT COALESCE(MAX(id), 0) + 1
                    FROM employee__training__details
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
                        status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, [
                    new_id,
                    emp_id,
                    training_title,
                    country,
                    topic,
                    institution_name,
                    start_date,
                    end_date,
                    1
                ])

            return JsonResponse({
                "status": "success",
                "message": "Training details saved successfully!"
            })

        except Exception as e:
            return JsonResponse({
                "status": "failed",
                "message": str(e)
            }, status=500)

    return JsonResponse({
        "status": "failed",
        "message": "Invalid request!"
    }, status=400)


# Load training details
def load_employee_training_details(request):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                id,
                emp_id,
                training_title,
                country,
                topic,
                institution_name,
                start_date,
                end_date
            FROM employee__training__details
            WHERE status = 1
            ORDER BY id DESC
        """)

        training_list = [
            {
                "id": row[0],
                "emp_id": row[1],
                "training_title": row[2],
                "country": row[3],
                "topic": row[4],
                "institution_name": row[5],
                "start_date": (
                    row[6].strftime('%Y-%m-%d')
                    if row[6] else ""
                ),
                "end_date": (
                    row[7].strftime('%Y-%m-%d')
                    if row[7] else ""
                )
            }
            for row in cursor.fetchall()
        ]

    return JsonResponse({
        "training_list": training_list
    })


# Update training details
def update_employee_training_details(request):
    if request.method == "POST":
        training_id = request.POST.get('training_id')
        emp_id = request.POST.get('emp_id')
        training_title = request.POST.get('training_title')
        country = request.POST.get('country')
        topic = request.POST.get('topic')
        institution_name = request.POST.get('institution_name')
        start_date = request.POST.get('start_date') or None
        end_date = request.POST.get('end_date') or None

        if not all([
            training_id,
            emp_id,
            training_title,
            topic,
            institution_name
        ]):
            return JsonResponse({
                "status": "failed",
                "message": "Please fill in all required fields!"
            })

        try:
            with connection.cursor() as cursor:
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
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                      AND status = 1
                """, [
                    emp_id,
                    training_title,
                    country,
                    topic,
                    institution_name,
                    start_date,
                    end_date,
                    training_id
                ])

                if cursor.rowcount == 0:
                    return JsonResponse({
                        "status": "failed",
                        "message": "No matching record found, or no changes were made."
                    })

            return JsonResponse({
                "status": "success",
                "message": "Training details updated successfully!"
            })

        except Exception as e:
            return JsonResponse({
                "status": "failed",
                "message": str(e)
            }, status=500)

    return JsonResponse({
        "status": "failed",
        "message": "Invalid request!"
    }, status=400)


# Delete training details
def remove_employee_training_details(request):
    if request.method == "POST":
        training_id = request.POST.get('training_id')

        if not training_id:
            return JsonResponse({
                "status": "failed",
                "message": "Training ID is required!"
            })

        try:
            with connection.cursor() as cursor:
                # Soft delete: keep the record but hide it from the list.
                cursor.execute("""
                    UPDATE employee__training__details
                    SET status = 0,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                      AND status = 1
                """, [training_id])

                if cursor.rowcount == 0:
                    return JsonResponse({
                        "status": "failed",
                        "message": "Training record not found!"
                    })

            return JsonResponse({
                "status": "success",
                "message": "Training details deleted successfully!"
            })

        except Exception as e:
            return JsonResponse({
                "status": "failed",
                "message": str(e)
            }, status=500)

    return JsonResponse({
        "status": "failed",
        "message": "Invalid request!"
    }, status=400)