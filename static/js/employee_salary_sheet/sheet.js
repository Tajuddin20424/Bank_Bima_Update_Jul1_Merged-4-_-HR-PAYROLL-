// ==========================================
// EMPLOYEE SALARY SHEET
// (transaction_with pattern)
// ==========================================

var monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

var allSalarySheet = [];   // 👈 GLOBAL


// ==========================================
// CLEAR SALARY SHEET
// ==========================================

function clearSalarySheet() {

    allSalarySheet = [];

    $('#sheetHeaders').empty();
    $('#sheetRows').html(`
        <tr>
            <td colspan="7" class="text-center text-muted">
                Select month and year, then PROCESS.
            </td>
        </tr>
    `);
    $('#saveSalary').prop('disabled', true);
    $('#periodTitle').text('Salary Sheet');
}


// ==========================================
// LOAD SALARY SHEET
// ==========================================

function loadSalarySheet() {

    let month = $('#salaryMonth').val() || '';
    let year = $('#salaryYear').val() || '';

    console.log("Selected Month:", month, "Year:", year);

    $('#processSalary').prop('disabled', true).text('Loading...');

    $.ajax({
        url: '/salary-sheet/preview/',
        method: 'GET',
        data: {
            month: month,
            year: year
        },
        dataType: 'json',

        success: function(response) {

            if (response.success === false) {
                alert(response.message || 'Failed to load salary sheet.');
                return;
            }

            let salary_sheet_list = response.rows || [];
            allSalarySheet = salary_sheet_list;

            $('#periodTitle').text('Salary of ' + monthNames[Number(month) - 1] + ' ' + year);

            // ---------- Salary heads (dynamic columns) ----------
            let heads = [];
            let addedHeads = {};

            $.each(salary_sheet_list, function(index, a) {
                $.each(a.components || [], function(i, c) {
                    if (!addedHeads[c.head_id]) {
                        heads.push({ head_id: c.head_id, head_name: c.head });
                        addedHeads[c.head_id] = true;
                    }
                });
            });

            // ---------- Table header ----------
            let thead = `
                <th><input type="checkbox" id="checkAll"></th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
            `;

            $.each(heads, function(i, h) {
                thead += `<th>${h.head_name || ''}</th>`;
            });

            thead += `
                <th>Total Salary</th>
                <th>Status</th>
            `;

            $('#sheetHeaders').html(thead);

            // ---------- No data ----------
            if (salary_sheet_list.length === 0) {
                $('#sheetRows').html(`
                    <tr>
                        <td colspan="${heads.length + 7}" class="text-center">
                            No Employees Found
                        </td>
                    </tr>
                `);
                $('#saveSalary').prop('disabled', true);
                return;
            }

            // ---------- Table body ----------
            let tbody = '';
            let hasReadyEmployee = false;

            $.each(salary_sheet_list, function(index, a) {

                let components = a.components || [];
                let amounts = {};

                $.each(components, function(i, c) {
                    amounts[c.head_id] = c.amount;
                });

                let canSave = !a.saved && components.length > 0;
                let status = '';

                if (a.saved) {
                    status = '<span class="badge bg-success">Saved</span>';
                } else if (canSave) {
                    status = '<span class="badge bg-primary">Ready</span>';
                    hasReadyEmployee = true;
                } else {
                    status = '<span class="badge bg-secondary">No Setup</span>';
                }

                tbody += `
                    <tr class="sheet-row" data-id="${a.employee_id || ''}">

                        <td>
                            <input type="checkbox"
                                class="employeeCheck"
                                value="${a.employee_id || ''}"
                                ${canSave ? '' : 'disabled'}>
                        </td>
                        <td>${a.employee_id || ''}</td>
                        <td>${a.name || ''}</td>
                        <td>${a.department || ''}</td>
                        <td>${a.designation || ''}</td>
                `;

                $.each(heads, function(i, h) {
                    tbody += `<td class="text-end">${amounts[h.head_id] || '0.00'}</td>`;
                });

                tbody += `
                        <td class="text-end">${a.total || '0.00'}</td>
                        <td>${status}</td>
                    </tr>
                `;
            });

            $('#sheetRows').html(tbody);

            $('#saveSalary').prop('disabled', !hasReadyEmployee);

            console.log("Records loaded:", salary_sheet_list.length);
        },

        error: function(xhr) {
            console.error("AJAX Error:", xhr.status, xhr.responseText);
            alert((xhr.responseJSON && xhr.responseJSON.message) || 'Failed to load salary sheet.');
        },

        complete: function() {
            $('#processSalary').prop('disabled', false).text('PROCESS');
        }
    });
}


// ==========================================
// PAGE LOAD (only month & year, no list)
// ==========================================

$(document).ready(function() {

    clearSalarySheet();

    if (typeof loadSalaryMonthCombo === 'function' && typeof loadSalaryYearCombo === 'function') {

        loadSalaryMonthCombo(0, function() {});
        loadSalaryYearCombo(0, function() {});

    } else {

        console.warn("Combo JS not loaded, using local month/year.");

        let today = new Date();
        let currentMonth = today.getMonth() + 1;
        let currentYear = today.getFullYear();

        // Month dropdown
        let monthOptions = '<option value="">Select Month</option>';
        for (let i = 1; i <= 12; i++) {
            monthOptions += '<option value="' + i + '">' + monthNames[i - 1] + '</option>';
        }
        $('#salaryMonth').html(monthOptions);
        $('#salaryMonth').val(currentMonth);

        // Year dropdown
        let yearOptions = '<option value="">Select Year</option>';
        for (let y = currentYear + 1; y >= currentYear - 5; y--) {
            yearOptions += '<option value="' + y + '">' + y + '</option>';
        }
        $('#salaryYear').html(yearOptions);
        $('#salaryYear').val(currentYear);
    }
});


// ==========================================
// MONTH / YEAR CHANGE (clear old list)
// ==========================================

$(document)
    .off('change.salaryPeriod', '#salaryMonth, #salaryYear')
    .on('change.salaryPeriod', '#salaryMonth, #salaryYear', function() {

        clearSalarySheet();
    });


// ==========================================
// PROCESS BUTTON (list shows only here)
// ==========================================

$(document)
    .off('click.salaryProcess', '#processSalary')
    .on('click.salaryProcess', '#processSalary', function(e) {
        e.preventDefault();

        let month = $('#salaryMonth').val() || '';
        let year = $('#salaryYear').val() || '';

        if (!month) {
            alert("Please select salary month.");
            return;
        }
        if (!year) {
            alert("Please select salary year.");
            return;
        }

        loadSalarySheet();
    });


// ==========================================
// CHECK ALL / SINGLE CHECK
// ==========================================

$(document).on('change', '#checkAll', function() {

    $('.employeeCheck:not(:disabled)').prop('checked', $(this).prop('checked'));
});

$(document).on('change', '.employeeCheck', function() {

    let total = $('.employeeCheck:not(:disabled)').length;
    let checked = $('.employeeCheck:not(:disabled):checked').length;

    $('#checkAll').prop('checked', total > 0 && total === checked);
});


// ==========================================
// SAVE SALARY SHEET
// ==========================================

$(document).on('click', '#saveSalary', function(e) {
    e.preventDefault();

    let month = $('#salaryMonth').val();
    let year = $('#salaryYear').val();
    let employees = [];

    $('.employeeCheck:checked:not(:disabled)').each(function() {
        employees.push($(this).val());
    });

    if (!month) {
        alert("Please select salary month.");
        return;
    }
    if (!year) {
        alert("Please select salary year.");
        return;
    }
    if (employees.length === 0) {
        alert("Please select employees first.");
        return;
    }

    if (!confirm('Save ' + monthNames[Number(month) - 1] + ' ' + year +
                 ' salary for ' + employees.length + ' employee(s)?')) {
        return;
    }

    $('#saveSalary').prop('disabled', true);

    $.ajax({
        url: '/salary-sheet/save/',
        method: 'POST',
        headers: { "X-CSRFToken": $('input[name="csrfmiddlewaretoken"]').val() },
        data: {
            'month': month,
            'year': year,
            'employees': JSON.stringify(employees),
        },
        success: function(response) {

            if (response.success === false) {
                alert(response.message || "Salary save failed.");
                $('#saveSalary').prop('disabled', false);
                return;
            }

            alert(response.message || "Saved successfull");
            loadSalarySheet();
        },
        error: function(xhr) {
            console.error("AJAX Error:", xhr.status, xhr.responseText);
            alert((xhr.responseJSON && xhr.responseJSON.message) || "Save failed");
            $('#saveSalary').prop('disabled', false);
        }
    });
});