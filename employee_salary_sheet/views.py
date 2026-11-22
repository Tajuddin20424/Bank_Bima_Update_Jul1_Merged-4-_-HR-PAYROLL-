from asyncio.log import logger
import calendar
from datetime import date
import json
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import connection, transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST


PAYROLL_TYPE = 3
PAYROLL_GROUP = 1


# =========================================================
# COMMON HELPERS
# =========================================================

def money(value):
    return Decimal(str(value or 0)).quantize(
        Decimal('0.01'),
        rounding=ROUND_HALF_UP
    )


def fetchall(cursor):
    cols = [x[0] for x in cursor.description]
    return [
        dict(zip(cols, row))
        for row in cursor.fetchall()
    ]


def period(request):
    month = int(
        request.GET.get('month') or
        request.POST.get('month') or 0
    )

    year = int(
        request.GET.get('year') or
        request.POST.get('year') or 0
    )

    if month not in range(1, 13) or year not in range(2000, 2101):
        raise ValueError('Select a valid month and year.')

    return month, year


def period_key(month, year):
    return f'SALARY-{year:04d}-{month:02d}'


# =========================================================
# BUILD EMPLOYEE SALARY SHEET
# =========================================================

def build_sheet(cursor, month, year):

    # Employee Personal and Organization Details

    cursor.execute("""
        SELECT
            e.employee_id,
            e.name,
            COALESCE(d.name, '-') AS department,
            COALESCE(g.designation, '-') AS designation

        FROM employee__personal__details e

        LEFT JOIN employee__organization__details o
            ON o.id = (
                SELECT MAX(o2.id)
                FROM employee__organization__details o2
                WHERE o2.emp_id = e.employee_id
                AND o2.status = 1
            )

        LEFT JOIN employee__departments d
            ON d.id = o.department

        LEFT JOIN employee__designations g
            ON g.id = o.designation

        WHERE e.status = 1

        ORDER BY e.employee_id
    """)

    employees = fetchall(cursor)

    # Fixed Payroll Setup

    cursor.execute("""
        SELECT
            s.emp_id,
            s.head_id,
            s.amount,
            h.tran_head_name,
            h.groupe_id

        FROM employee__payroll__setups s

        JOIN transaction__heads h
            ON h.id = s.head_id

        WHERE s.status = 1
        AND h.status = 1
        AND h.tran_main_head_id = %s
        AND h.groupe_id = %s

        ORDER BY s.id
    """, [
        PAYROLL_TYPE,
        PAYROLL_GROUP
    ])

    fixed = fetchall(cursor)

    # Monthly Payroll Middleware
    # Filtered by salary_month / salary_year (salary period),
    # not by entry date.

    cursor.execute("""
        SELECT
            m.emp_id,
            m.head_id,
            m.amount,
            h.tran_head_name,
            h.groupe_id

        FROM employee__payroll__middlewires m

        JOIN transaction__heads h
            ON h.id = m.head_id

        WHERE m.status = 1
        AND h.status = 1
        AND h.tran_main_head_id = %s
        AND h.groupe_id = %s
        AND m.salary_month = %s
        AND m.salary_year = %s

        ORDER BY m.id
    """, [
        PAYROLL_TYPE,
        PAYROLL_GROUP,
        month,
        year
    ])

    variable = fetchall(cursor)

    # Salary Component Calculation
    # All components including PF are additive.

    by_emp = defaultdict(dict)

    for item in fixed + variable:

        emp = item['emp_id']
        head_id = item['head_id']

        if head_id not in by_emp[emp]:

            by_emp[emp][head_id] = {
                'head_id': head_id,
                'head': item['tran_head_name'],
                'group_id': item['groupe_id'],
                'amount': Decimal('0.00'),
            }

        by_emp[emp][head_id]['amount'] += money(
            item['amount']
        )

    output = []

    for employee in employees:

        components = list(
            by_emp[employee['employee_id']].values()
        )

        total = sum(
            (v['amount'] for v in components),
            Decimal('0.00')
        )

        output.append({
            **employee,
            'components': [
                {
                    **v,
                    'amount': str(v['amount'])
                }
                for v in components
            ],
            'total': str(money(total))
        })

    return output


# =========================================================
# EMPLOYEE SALARY SHEET PAGE
# =========================================================

def page(request):

    return render(
        request,
        'salary_sheet/salary_sheet.html'
    )


# =========================================================
# EMPLOYEE SALARY SHEET PREVIEW
# =========================================================

@require_GET
def preview(request):

    try:

        month, year = period(request)

        with connection.cursor() as cursor:

            sheet = build_sheet(
                cursor,
                month,
                year
            )

            cursor.execute("""
                SELECT tran_user
                FROM transaction__mains
                WHERE invoice_ref = %s
                AND tran_type = %s
            """, [
                period_key(month, year),
                PAYROLL_TYPE
            ])

            saved = {
                r[0]
                for r in cursor.fetchall()
            }

        for row in sheet:

            row['saved'] = (
                row['employee_id'] in saved
            )

        return JsonResponse({
            'success': True,
            'rows': sheet,
            'month': month,
            'year': year
        })

    except (ValueError, TypeError) as exc:

        return JsonResponse({
            'success': False,
            'message': str(exc)
        }, status=400)


# ==========================================
# SAVE SALARY SHEET
# ==========================================
@require_POST
def save(request):
    try:
        month, year = period(request)
        emp_ids = json.loads(request.POST.get('employees', '[]'))

        if (not isinstance(emp_ids, list) or not emp_ids
                or any(not isinstance(x, str) or not x.strip() for x in emp_ids)):
            raise ValueError('Select at least one employee.')

        if len(emp_ids) != len(set(emp_ids)):
            raise ValueError('Duplicate employee selection.')

        reference = period_key(month, year)
        lock_name = f'salary_sheet_{year}_{month}'
        saved = 0

        # Lock so two users can't process the same month at once
        with connection.cursor() as cursor:
            cursor.execute("SELECT GET_LOCK(%s, 10)", [lock_name])
            if cursor.fetchone()[0] != 1:
                raise ValueError('Salary processing is busy. Try again.')

        try:
            with transaction.atomic(), connection.cursor() as cursor:
                data = {row['employee_id']: row for row in build_sheet(cursor, month, year)}

                for emp_id in emp_ids:
                    row = data.get(emp_id)

                    if not row or not row['components']:
                        raise ValueError(f'No active salary component for {emp_id}.')

                    amount = money(row['total'])
                    if amount < 0:
                        raise ValueError(f'Negative salary for {emp_id}; check payroll data.')

                    # Already processed?
                    cursor.execute("""
                        SELECT id FROM transaction__mains
                        WHERE invoice_ref = %s AND tran_type = %s AND tran_user = %s
                        LIMIT 1
                    """, [reference, PAYROLL_TYPE, emp_id])

                    if cursor.fetchone():
                        raise ValueError(
                            f'{emp_id} already processed for '
                            f'{calendar.month_name[month]} {year}.'
                        )

                    tran_id = f'{reference}-{emp_id}'

                    # Transaction main
                    cursor.execute("""
                        INSERT INTO transaction__mains
                        (tran_id, tran_type, tran_method, invoice_ref, tran_user, user_name,
                         bill_amount, net_amount, receive, payment, due, tran_date, status)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 0, 0, %s, NOW(), 1)
                    """, [tran_id, PAYROLL_TYPE, 'Salary Sheet', reference, emp_id,
                          row['name'], amount, amount, amount])

                    # Transaction details (one row per salary head)
                    for comp in row['components']:
                        value = money(comp['amount'])
                        cursor.execute("""
                            INSERT INTO transaction__details
                            (tran_id, tran_type, tran_method, invoice_ref, tran_user, user_name,
                             tran_groupe_id, tran_head_id, quantity_actual, quantity,
                             amount, tot_amount, receive, payment, due, tran_date, status)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 1, 1,
                                    %s, %s, 0, 0, %s, NOW(), 1)
                        """, [tran_id, PAYROLL_TYPE, 'Salary Sheet', reference, emp_id,
                              row['name'], comp['group_id'], comp['head_id'],
                              value, value, value])

                    saved += 1

        finally:
            with connection.cursor() as cursor:
                cursor.execute("SELECT RELEASE_LOCK(%s)", [lock_name])

        return JsonResponse({
            'success': True,
            'status': 'success',
            'message': f'{saved} employee salary saved successfully!'
        })

    except (ValueError, TypeError, json.JSONDecodeError) as e:
        return JsonResponse({'success': False, 'status': 'failed', 'message': str(e)}, status=400)

    except Exception as e:
        logger.exception('Salary sheet save failed')
        return JsonResponse({'success': False, 'status': 'failed', 'message': 'Save failed: ' + str(e)}, status=500)

# ==========================================
# SALARY MONTH COMBO
# ==========================================
def salary_month_combo(request):
    salary_month_combo = []

    for month in range(1, 13):
        salary_month_combo.append({
            'id': month,
            'month_name': calendar.month_name[month]
        })

    return JsonResponse({
        'salary_month_combo': salary_month_combo
    })


# ==========================================
# SALARY YEAR COMBO
# ==========================================
def salary_year_combo(request):
    current_year = date.today().year

    salary_year_combo = []

    for year in range(current_year + 1, current_year - 6, -1):
        salary_year_combo.append({
            'id': year,
            'year_name': year
        })

    return JsonResponse({
        'salary_year_combo': salary_year_combo
    })