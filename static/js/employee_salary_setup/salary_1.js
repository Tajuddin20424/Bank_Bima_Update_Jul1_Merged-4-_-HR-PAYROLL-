
/* ==========================================
   EMPLOYEE SALARY SETUP
   EMPLOYEE + TRANSACTION HEAD SEARCH
========================================== */

let mode = "save";
let allSalary = [];
let allEmployees = [];
let allHeads = [];


// ==========================================
// SAFE HTML
// ==========================================

function safe(value) {
    return $('<span>')
        .text(value == null ? '' : String(value))
        .html();
}


// ==========================================
// SUCCESS / ERROR MESSAGE
// ==========================================

function salaryMessage(message, success = true) {
    alert(message);
}


// ==========================================
// CSRF TOKEN
// ==========================================

function salaryCSRF() {
    return $('#salaryForm input[name="csrfmiddlewaretoken"]').val() ||
        (typeof csrftoken !== 'undefined' ? csrftoken : '');
}


// ==========================================
// LOAD SALARY
// ==========================================

function loadSalary() {

    $.ajax({

        url: '/salary-setup/get/',
        method: 'GET',
        dataType: 'json',

        success: function(response) {

            if (response.success === false) {
                salaryMessage(
                    response.message || 'Failed to load salary list.',
                    false
                );
                return;
            }

            allSalary = response.data || [];

            let selectedEmployee = $('#emp_id').val();
            let selectedHead = $('#head_id').val();

            // EMPLOYEE SEARCH DATA
            allEmployees = response.employees || [];

            if (selectedEmployee) {

                let selected = allEmployees.find(function(employee) {
                    return String(employee.employee_id) ===
                        String(selectedEmployee);
                });

                if (selected) {
                    $('#employeeSearch').val(
                        selected.name + ' (' +
                        selected.employee_id + ')'
                    );
                }
            }

            // TRANSACTION HEAD SEARCH DATA
            allHeads = response.heads || [];

            if (selectedHead) {

                let selected = allHeads.find(function(head) {
                    return String(head.id) === String(selectedHead);
                });

                if (selected) {
                    $('#headSearch').val(
                        selected.id + ' - ' +
                        selected.tran_head_name
                    );
                }
            }

            showSalaryList(allSalary);
        },

        error: function(xhr) {

            console.log(xhr.responseText);

            $('#salaryRows').html(`
                <tr>
                    <td colspan="6"
                        class="text-center text-danger">
                        Failed to load salary list.
                    </td>
                </tr>
            `);

            salaryMessage('Failed to load salary list.', false);
        }
    });
}


// ==========================================
// SHOW SALARY LIST
// ==========================================

function showSalaryList(salaries) {

    let tbody = '';

    if (salaries.length == 0) {

        tbody = `
            <tr>
                <td colspan="6" class="text-center">
                    No Salary Found
                </td>
            </tr>
        `;

        $('#salaryRows').html(tbody);
        return;
    }

    $.each(salaries, function(index, s) {

        let status = Number(s.status) === 1
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-danger">Inactive</span>';

        let amount = Number(s.amount || 0);

        tbody += `
            <tr class="list-row" data-id="${safe(s.id)}">

                <td>${index + 1}</td>

                <td>
                    ${safe(s.employee_name)}
                    <small class="text-muted">
                        (${safe(s.emp_id)})
                    </small>
                </td>

                <td>${safe(s.head_name)}</td>

                <td>
                    ${Number.isFinite(amount)
                        ? amount.toFixed(2)
                        : '0.00'}
                </td>

                <td>${status}</td>

                <td>
                    <button
                        type="button"
                        class="btn btn-sm btn-warning editBtn"
                        data-id="${safe(s.id)}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger deleteBtn"
                        data-id="${safe(s.id)}">
                        Delete
                    </button>
                </td>

            </tr>
        `;
    });

    $('#salaryRows').html(tbody);
}


// ==========================================
// VALIDATE SALARY
// ==========================================

function validateSalary() {

    let employee = $('#emp_id').val();
    let head = $('#head_id').val();
    let amount = $('#amount').val();

    if (!employee) {
        alert('Please search and select an employee.');
        $('#employeeSearch').focus();
        return false;
    }

    if (!head) {
        alert('Please select transaction head.');
        $('#headSearch').focus();
        return false;
    }

    if (
        amount === '' ||
        !Number.isFinite(Number(amount)) ||
        Number(amount) < 0
    ) {
        alert('Please enter a valid amount.');
        return false;
    }

    return true;
}


// ==========================================
// SAVE / UPDATE FORM
// ==========================================

$(document).on('submit', '#salaryForm', function(e) {

    e.preventDefault();

    if ($('#saveBtn').prop('disabled')) {
        return;
    }

    if (mode === 'save') {
        
        saveSalary();
    } else if (mode === 'update') {
        updateSalary();
    }
});


// ==========================================
// SAVE SALARY
// ==========================================

function saveSalary() {

    if (!validateSalary()) {
        return;
    }

    $('#saveBtn').prop('disabled', true);

    $.ajax({

        url: '/salary-setup/save/',
        method: 'POST',
        dataType: 'json',

        headers: {
            'X-CSRFToken': salaryCSRF()
        },

        data: $('#salaryForm').serialize(),

        success: function(response) {

            if (response.success) {

                alert('Saved successfully');

                clearSalaryForm();
                loadSalary();

            } else {

                alert(response.message || 'Save failed');
            }
        },

        error: function(xhr) {

            console.log(xhr.status);
            console.log(xhr.responseText);

            alert(
                (xhr.responseJSON &&
                    xhr.responseJSON.message) ||
                'Error while saving salary'
            );
        },

        complete: function() {
            $('#saveBtn').prop('disabled', false);
        }
    });
}


// ==========================================
// UPDATE SALARY
// ==========================================

function updateSalary() {

    let salaryId = $('#salaryId').val();

    if (!salaryId) {
        alert('Salary ID not found');
        return;
    }

    if (!validateSalary()) {
        return;
    }

    $('#saveBtn').prop('disabled', true);

    $.ajax({

        url: '/salary-setup/update/',
        method: 'POST',
        dataType: 'json',

        headers: {
            'X-CSRFToken': salaryCSRF()
        },

        data: $('#salaryForm').serialize(),

        success: function(response) {

            if (response.success) {

                alert('Updated successfully');

                clearSalaryForm();
                loadSalary();

            } else {

                alert(response.message || 'Update failed');
            }
        },

        error: function(xhr) {

            console.log(xhr.status);
            console.log(xhr.responseText);

            alert(
                (xhr.responseJSON &&
                    xhr.responseJSON.message) ||
                'Error while updating salary'
            );
        },

        complete: function() {
            $('#saveBtn').prop('disabled', false);
        }
    });
}


// ==========================================
// CLEAR SALARY FORM
// ==========================================

function clearSalaryForm() {

    if ($('#salaryForm').length) {
        $('#salaryForm')[0].reset();
    }

    $('#salaryId').val('');

    // EMPLOYEE
    $('#emp_id').val('');
    $('#employeeSearch').val('');
    $('#employeeSearchResult').hide();
    $('#employeeSearchBody').empty();

    // TRANSACTION HEAD
    $('#head_id').val('');
    $('#headSearch').val('');
    $('#headSearchResult').hide();
    $('#headSearchBody').empty();

    // OTHER FIELDS
    $('#amount').val('');
    $('#status').val('1');

    $('#formTitle').text('Add Salary Setup');

    mode = 'save';

    $('#saveBtn').text('Save');
}


// ==========================================
// EDIT SALARY
// ==========================================

$(document).on('click', '#salaryRows .editBtn', function(e) {

    e.preventDefault();

    let id = String($(this).attr('data-id'));

    let s = allSalary.find(function(item) {
        return String(item.id) === id;
    });

    if (!s) {
        alert('Salary record not found');
        return;
    }

    $('#salaryId').val(s.id);

    // EMPLOYEE
    $('#emp_id').val(String(s.emp_id));

    let selectedEmployee = allEmployees.find(function(employee) {
        return String(employee.employee_id) ===
            String(s.emp_id);
    });

    $('#employeeSearch').val(
        selectedEmployee
            ? selectedEmployee.name +
              ' (' + selectedEmployee.employee_id + ')'
            : String(s.employee_name || '') +
              ' (' + s.emp_id + ')'
    );

    $('#employeeSearchResult').hide();

    // TRANSACTION HEAD
    $('#head_id').val(String(s.head_id));

    let selectedHead = allHeads.find(function(head) {
        return String(head.id) === String(s.head_id);
    });

    $('#headSearch').val(
        selectedHead
            ? selectedHead.id + ' - ' +
              selectedHead.tran_head_name
            : String(s.head_name || '')
    );

    $('#headSearchResult').hide();

    // OTHER FIELDS
    $('#amount').val(s.amount);
    $('#status').val(String(s.status));

    mode = 'update';

    $('#saveBtn').text('Update');
    $('#formTitle').text('Edit Salary Setup');

    $('html, body').animate({
        scrollTop: 0
    }, 300);
});


// ==========================================
// DELETE SALARY
// ==========================================

$(document).on('click', '#salaryRows .deleteBtn', function(e) {

    e.preventDefault();

    let id = $(this).attr('data-id');

    if (!id) {
        alert('Salary ID not found');
        return;
    }

    if (!confirm('Confirm to remove this salary setup?')) {
        return;
    }

    $.ajax({

        url: '/salary-setup/delete/',
        method: 'POST',
        dataType: 'json',

        headers: {
            'X-CSRFToken': salaryCSRF()
        },

        data: {
            id: id,
            csrfmiddlewaretoken: salaryCSRF()
        },

        success: function(response) {

            if (response.success) {

                alert('Removed successfully');

                clearSalaryForm();
                loadSalary();

            } else {

                alert(response.message || 'Delete failed');
            }
        },

        error: function(xhr) {

            console.log(xhr.status);
            console.log(xhr.responseText);

            alert(
                (xhr.responseJSON &&
                    xhr.responseJSON.message) ||
                'Failed to remove salary'
            );
        }
    });
});


// ==========================================
// CLEAR BUTTON
// ==========================================

$(document).on('click', '#clearBtn', function(e) {

    e.preventDefault();
    clearSalaryForm();
});


// ==========================================
// SEARCH SALARY LIST
// ==========================================

$(document).on('input', '#salarySearch', function() {

    let search = String($(this).val() || '')
        .toLowerCase();

    let filtered = allSalary.filter(function(s) {

        return [
            s.employee_name,
            s.emp_id,
            s.head_name
        ].some(function(value) {

            return String(value || '')
                .toLowerCase()
                .includes(search);
        });
    });

    showSalaryList(filtered);
});


// ==========================================
// EMPLOYEE SEARCH
// GUEST SEARCH SAME PATTERN
// ==========================================

$(document).ready(function() {

    let filteredEmployees = [];
    let activeIndex = -1;
    let searchTimer = null;
    let searchRequest = null;


    // ==========================================
    // SEARCH EMPLOYEES THROUGH AJAX
    // ==========================================

    $('#employeeSearch').on('input', function() {

        let search = $(this).val().trim();

        $('#emp_id').val('');

        clearTimeout(searchTimer);

        if (searchRequest) {
            searchRequest.abort();
            searchRequest = null;
        }

        filteredEmployees = [];
        activeIndex = -1;

        if (search.length < 1) {

            filteredEmployees = allEmployees.slice();
            showEmployees();

            return;
        }

        searchTimer = setTimeout(function() {

            let request;

            request = $.ajax({

                url: '/salary-setup/get/',
                type: 'GET',

                data: {
                    search: search
                },

                dataType: 'json',

                success: function(response) {

                    console.log(
                        'Employee search response:',
                        response
                    );

                    if (
                        $('#employeeSearch').val().trim()
                        !== search
                    ) {
                        return;
                    }

                    if (response.success === false) {

                        filteredEmployees = [];

                    } else {

                        let employees = Array.isArray(response.employees)
                            ? response.employees
                            : allEmployees;

                        let keyword = search.toLowerCase();

                        filteredEmployees = employees.filter(
                            function(employee) {

                                let employeeId = String(
                                    employee.employee_id || ''
                                ).toLowerCase();

                                let employeeName = String(
                                    employee.name || ''
                                ).toLowerCase();

                                return (
                                    employeeId.includes(keyword) ||
                                    employeeName.includes(keyword)
                                );
                            }
                        );
                    }

                    activeIndex = -1;
                    showEmployees();
                },

                error: function(xhr, status) {

                    if (status !== 'abort') {

                        console.log(xhr.responseText);

                        let keyword = search.toLowerCase();

                        filteredEmployees = allEmployees.filter(
                            function(employee) {

                                let employeeId = String(
                                    employee.employee_id || ''
                                ).toLowerCase();

                                let employeeName = String(
                                    employee.name || ''
                                ).toLowerCase();

                                return (
                                    employeeId.includes(keyword) ||
                                    employeeName.includes(keyword)
                                );
                            }
                        );

                        activeIndex = -1;
                        showEmployees();
                    }
                },

                complete: function() {

                    if (searchRequest === request) {
                        searchRequest = null;
                    }
                }
            });

            searchRequest = request;

        }, 250);
    });


    // ==========================================
    // SHOW FULL EMPLOYEE LIST ON CLICK
    // ==========================================

    $('#employeeSearch').on('focus click', function() {

        let search = $(this).val().trim();

        if (
            search.length === 0 ||
            $('#emp_id').val()
        ) {

            filteredEmployees = allEmployees.slice();
            activeIndex = -1;

            showEmployees();
        }
    });


    // ==========================================
    // SHOW EMPLOYEE RESULTS
    // ==========================================

    function showEmployees() {

        let html = '';

        if (filteredEmployees.length === 0) {

            html = `
                <tr>
                    <td colspan="2" class="text-center">
                        No Employee Found
                    </td>
                </tr>
            `;

        } else {

            filteredEmployees.forEach(function(employee, index) {

                html += `
                    <tr
                        class="employee-search-row"
                        data-index="${index}"
                        style="cursor:pointer;">

                        <td>
                            ${safe(employee.employee_id)}
                        </td>

                        <td>
                            ${safe(employee.name)}
                        </td>

                    </tr>
                `;
            });
        }

        $('#employeeSearchBody').html(html);
        $('#employeeSearchResult').show();
    }


    // ==========================================
    // CLICK EMPLOYEE ROW
    // ==========================================

    $(document).on(
        'click',
        '#employeeSearchBody .employee-search-row',
        function() {

            let index = $(this).data('index');

            selectEmployee(filteredEmployees[index]);
        }
    );


    // ==========================================
    // KEYBOARD NAVIGATION
    // ==========================================

    $('#employeeSearch').on('keydown', function(e) {

        if (e.key === 'Escape') {
            $('#employeeSearchResult').hide();
            return;
        }

        if (
            !$('#employeeSearchResult').is(':visible') ||
            filteredEmployees.length === 0
        ) {
            return;
        }

        if (e.key === 'ArrowDown') {

            e.preventDefault();

            activeIndex++;

            if (activeIndex >= filteredEmployees.length) {
                activeIndex = 0;
            }

            activeRow();

        } else if (e.key === 'ArrowUp') {

            e.preventDefault();

            activeIndex--;

            if (activeIndex < 0) {
                activeIndex = filteredEmployees.length - 1;
            }

            activeRow();

        } else if (e.key === 'Enter') {

            e.preventDefault();

            if (activeIndex >= 0) {
                selectEmployee(filteredEmployees[activeIndex]);
            }
        }
    });


    // ==========================================
    // HIGHLIGHT ACTIVE EMPLOYEE ROW
    // ==========================================

    function activeRow() {

        let $rows = $('#employeeSearchBody .employee-search-row');

        $rows.removeClass('table-primary');

        let $currentRow = $rows.eq(activeIndex);

        $currentRow.addClass('table-primary');

        if ($currentRow.length) {
            $currentRow[0].scrollIntoView({
                block: 'nearest',
                behavior: 'auto'
            });
        }
    }


    // ==========================================
    // SELECT EMPLOYEE
    // ==========================================

    function selectEmployee(employee) {

        if (!employee) {
            return;
        }

        clearTimeout(searchTimer);

        if (searchRequest) {
            searchRequest.abort();
            searchRequest = null;
        }

        $('#emp_id').val(employee.employee_id || '');

        $('#employeeSearch').val(
            (employee.employee_id || '') +
            ' - ' +
            (employee.name || '')
        );

        $('#employeeSearchResult').hide();

        filteredEmployees = [];
        activeIndex = -1;

        // NEXT FIELD
        $('#headSearch').trigger('focus');
    }


    // ==========================================
    // CLICK OUTSIDE
    // ==========================================

    $(document).on('click', function(e) {

        if (
            !$(e.target).closest(
                '#employeeSearch, #employeeSearchResult'
            ).length
        ) {
            $('#employeeSearchResult').hide();
        }
    });

});


// ==========================================
// TRANSACTION HEAD SEARCH
// EMPLOYEE SEARCH SAME PATTERN
// ==========================================

$(document).ready(function() {

    let filteredHeads = [];
    let activeIndex = -1;
    let searchTimer = null;


    // ==========================================
    // SEARCH TRANSACTION HEAD
    // ==========================================

    $('#headSearch').on('input', function() {

        let search = $(this).val().trim();

        clearTimeout(searchTimer);

        // CLEAR PREVIOUS SELECTED HEAD
        $('#head_id').val('');

        filteredHeads = [];
        activeIndex = -1;

        // SHOW ALL HEADS IF EMPTY
        if (search.length < 1) {

            filteredHeads = allHeads.slice();
            showHeads();

            return;
        }

        // SAME 250MS DELAY PATTERN
        searchTimer = setTimeout(function() {

            // IGNORE OLD SEARCH TEXT
            if ($('#headSearch').val().trim() !== search) {
                return;
            }

            let keyword = search.toLowerCase();

            filteredHeads = allHeads.filter(function(head) {

                let headId = String(
                    head.id == null ? '' : head.id
                ).toLowerCase();

                let headName = String(
                    head.tran_head_name || ''
                ).toLowerCase();

                return (
                    headId.includes(keyword) ||
                    headName.includes(keyword)
                );
            });

            activeIndex = -1;
            showHeads();

        }, 250);
    });


    // ==========================================
    // SHOW FULL HEAD LIST ON CLICK
    // ==========================================

    $('#headSearch').on('focus click', function() {

        let search = $(this).val().trim();

        if (
            search.length === 0 ||
            $('#head_id').val()
        ) {

            filteredHeads = allHeads.slice();
            activeIndex = -1;

            showHeads();
        }
    });


    // ==========================================
    // SHOW TRANSACTION HEAD RESULTS
    // ==========================================

    function showHeads() {

        let html = '';

        if (filteredHeads.length === 0) {

            html = `
                <tr>
                    <td colspan="2" class="text-center">
                        No Transaction Head Found
                    </td>
                </tr>
            `;

        } else {

            filteredHeads.forEach(function(head, index) {

                html += `
                    <tr
                        class="head-search-row"
                        data-index="${index}"
                        style="cursor:pointer;">

                        <td>
                            ${safe(head.id)}
                        </td>

                        <td>
                            ${safe(head.tran_head_name)}
                        </td>

                    </tr>
                `;
            });
        }

        $('#headSearchBody').html(html);
        $('#headSearchResult').show();
    }


    // ==========================================
    // CLICK TRANSACTION HEAD ROW
    // ==========================================

    $(document).on(
        'click',
        '#headSearchBody .head-search-row',
        function() {

            let index = $(this).data('index');

            selectHead(filteredHeads[index]);
        }
    );


    // ==========================================
    // KEYBOARD NAVIGATION
    // ==========================================

    $('#headSearch').on('keydown', function(e) {

        if (e.key === 'Escape') {

            $('#headSearchResult').hide();
            return;
        }

        if (
            !$('#headSearchResult').is(':visible') ||
            filteredHeads.length === 0
        ) {
            return;
        }

        // DOWN ARROW
        if (e.key === 'ArrowDown') {

            e.preventDefault();

            activeIndex++;

            if (activeIndex >= filteredHeads.length) {
                activeIndex = 0;
            }

            activeRow();
        }

        // UP ARROW
        else if (e.key === 'ArrowUp') {

            e.preventDefault();

            activeIndex--;

            if (activeIndex < 0) {
                activeIndex = filteredHeads.length - 1;
            }

            activeRow();
        }

        // ENTER
        else if (e.key === 'Enter') {

            e.preventDefault();

            if (activeIndex >= 0) {

                selectHead(filteredHeads[activeIndex]);
            }
        }
    });


    // ==========================================
    // HIGHLIGHT ACTIVE HEAD ROW
    // ==========================================

    function activeRow() {

        let $rows = $('#headSearchBody .head-search-row');

        $rows.removeClass('table-primary');

        let $currentRow = $rows.eq(activeIndex);

        $currentRow.addClass('table-primary');

        if ($currentRow.length) {

            $currentRow[0].scrollIntoView({
                block: 'nearest',
                behavior: 'auto'
            });
        }
    }


    // ==========================================
    // SELECT TRANSACTION HEAD
    // ==========================================

    function selectHead(head) {

        if (!head) {
            return;
        }

        clearTimeout(searchTimer);

        // SAVE SELECTED HEAD ID
        $('#head_id').val(
            String(head.id)
        );

        // DISPLAY HEAD ID + NAME
        $('#headSearch').val(
            String(head.id) +
            ' - ' +
            String(head.tran_head_name || '')
        );

        $('#headSearchResult').hide();

        filteredHeads = [];
        activeIndex = -1;

        // NEXT FIELD
        $('#amount').trigger('focus');
    }


    // ==========================================
    // CLICK OUTSIDE
    // ==========================================

    $(document).on('click', function(e) {

        if (
            !$(e.target).closest(
                '#headSearch, #headSearchResult'
            ).length
        ) {

            $('#headSearchResult').hide();
        }
    });

});


// ==========================================
// PAGE LOAD
// ==========================================

$(document).ready(function() {

    loadSalary();

});
