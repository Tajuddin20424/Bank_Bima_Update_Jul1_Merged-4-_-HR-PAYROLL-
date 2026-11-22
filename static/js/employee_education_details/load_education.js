
 // ==========================================
 // EMPLOYEE EDUCATION DETAILS
 // ==========================================

let mode = "save";

let educationList = [];

let allEducationEmployees = [];


// ==========================================
// CSRF TOKEN
// ==========================================

function getCSRFToken() {

    return $(
        'input[name="csrfmiddlewaretoken"]'
    ).val();

}


// ==========================================
// SAFE TEXT
// ==========================================

function escapeHTML(value) {

    return $('<div>')
        .text(value == null ? '' : String(value))
        .html();

}


// ==========================================
 // EMPLOYEE DROPDOWN / SEARCH DATA
 // ==========================================

function loadEmployeeDropdown() {

    $.ajax({

        url: '/employee-education-details/get-employee-combo/',

        method: 'GET',

        dataType: 'json',

        success: function(response) {

            if (response.success) {

                allEducationEmployees = Array.isArray(
                    response.employee_list
                ) ? response.employee_list : [];

                // If editing, display the selected employee
                let selectedId = $('#emp_id').val();

                if (selectedId) {

                    let employee = allEducationEmployees.find(
                        function(item) {

                            return String(item.employee_id) ===
                                String(selectedId);

                        }
                    );

                    if (employee) {

                        $('#educationEmployeeSearch').val(
                            employee.name +
                            ' (' + employee.employee_id + ')'
                        );
                    }
                }

            } else {

                allEducationEmployees = [];

                alert(
                    response.message ||
                    'Failed to load employees.'
                );
            }

        },

        error: function() {

            alert('Failed to load employees.');

        }

    });

}


// ==========================================
// LOAD EDUCATION LIST
// ==========================================

function loadEducation() {

    $.ajax({

        url: '/employee-education-details/load-education/',

        method: 'GET',

        dataType: 'json',

        success: function(response) {

            if (!response.success) {

                alert(
                    response.message ||
                    'Failed to load data.'
                );

                return;
            }

            educationList = response.education_list || [];

            renderEducationTable(educationList);

        },

        error: function(xhr) {

            alert(
                xhr.responseJSON?.message ||
                'Failed to load education list.'
            );

        }

    });

}


// ==========================================
// RENDER TABLE
// ==========================================

function renderEducationTable(data) {

    let tbody = '';

    if (!data.length) {

        tbody = `
            <tr>
                <td colspan="13" class="text-center">
                    No Data Found
                </td>
            </tr>
        `;

        $('#educationTableBody').html(tbody);

        return;
    }

    $.each(data, function(index, item) {

        let statusBadge = Number(item.status) === 1

            ? '<span class="badge bg-success">Active</span>'

            : '<span class="badge bg-danger">Inactive</span>';

        tbody += `

            <tr>

                <td>${index + 1}</td>

                <td>${escapeHTML(item.id)}</td>

                <td>${escapeHTML(item.employee_name)}</td>

                <td>${escapeHTML(item.degree)}</td>

                <td>${escapeHTML(item.group)}</td>

                <td>${escapeHTML(item.institution)}</td>

                <td>${escapeHTML(item.result)}</td>

                <td>${escapeHTML(item.scale)}</td>

                <td>${escapeHTML(item.cgpa)}</td>

                <td>${escapeHTML(item.marks)}</td>

                <td>${escapeHTML(item.batch)}</td>

                <td>${statusBadge}</td>

                <td>

                    <div class="d-flex gap-1">

                        <button
                            type="button"
                            class="btn btn-sm btn-warning editBtn"
                            data-id="${escapeHTML(item.id)}"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            class="btn btn-sm btn-danger deleteBtn"
                            data-id="${escapeHTML(item.id)}"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

    $('#educationTableBody').html(tbody);

}


// ==========================================
// DOCUMENT READY
// ==========================================

$(document).ready(function() {

    loadEmployeeDropdown();

    loadEducation();

});


// ==========================================
// SAVE / UPDATE
// ==========================================

$(document).on('click', '#saveBtn', function(e) {

    e.preventDefault();

    let emp_id = $('#emp_id').val();

    let degree = $('#degree').val().trim();

    let institution = $('#institution').val().trim();

    let batch = $('#batch').val();

    if (!emp_id) {

        alert('Please select employee.');

        $('#educationEmployeeSearch').focus();

        return;
    }

    if (!degree) {

        alert('Please enter degree.');

        return;
    }

    if (!institution) {

        alert('Please enter institution.');

        return;
    }

    if (!batch) {

        alert('Please enter batch.');

        return;
    }

    let formData = $('#educationForm').serialize();

    let url = '';

    if (mode === 'save') {

        url = '/employee-education-details/save-education/';

    } else {

        url = '/employee-education-details/update-education/';

    }

    $('#saveBtn').prop('disabled', true);

    $.ajax({

        url: url,

        method: 'POST',

        headers: {
            'X-CSRFToken': getCSRFToken()
        },

        data: formData,

        success: function(response) {

            if (response.success) {

                alert(response.message);

                clearEducationForm();

                loadEducation();

            } else {

                alert(response.message);

            }

        },

        error: function(xhr) {

            alert(
                xhr.responseJSON?.message ||
                'Failed to save education details.'
            );

        },

        complete: function() {

            $('#saveBtn').prop('disabled', false);

        }

    });

});


// ==========================================
// EDIT EDUCATION
// ==========================================

$(document).on('click', '.editBtn', function(e) {

    e.preventDefault();

    let id = String($(this).data('id'));

    let item = educationList.find(function(row) {

        return String(row.id) === id;

    });

    if (!item) {

        alert('Education record not found.');

        return;

    }

    $('#education_id').val(item.id);

    $('#emp_id').val(item.emp_id);

    // ======================================
    // SHOW EMPLOYEE NAME ON EDIT
    // ======================================

    let selectedEmployee = allEducationEmployees.find(
        function(employee) {

            return String(employee.employee_id) ===
                String(item.emp_id);

        }
    );

    if (selectedEmployee) {

        $('#educationEmployeeSearch').val(
            selectedEmployee.name +
            ' (' + selectedEmployee.employee_id + ')'
        );

    } else {

        $('#educationEmployeeSearch').val(
            String(item.employee_name || '') +
            ' (' + String(item.emp_id || '') + ')'
        );

    }

    $('#educationEmployeeSearchResult').hide();

    $('#degree').val(item.degree);

    $('#group').val(item.group || '');

    $('#institution').val(item.institution);

    $('#result').val(item.result || '');

    $('#scale').val(item.scale);

    $('#cgpa').val(item.cgpa);

    $('#marks').val(item.marks);

    $('#batch').val(item.batch);

    $('#status').val(String(item.status));

    mode = 'update';

    $('#saveBtn').text('Update');

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

});


// ==========================================
// DELETE EDUCATION
// ==========================================

$(document).on('click', '.deleteBtn', function(e) {

    e.preventDefault();

    let education_id = $(this).data('id');

    if (!confirm(
        'Are you sure you want to delete this education record?'
    )) {

        return;

    }

    $.ajax({

        url: '/employee-education-details/remove-education/',

        method: 'POST',

        headers: {
            'X-CSRFToken': getCSRFToken()
        },

        data: {
            education_id: education_id
        },

        success: function(response) {

            if (response.success) {

                alert(response.message);

                clearEducationForm();

                loadEducation();

            } else {

                alert(response.message);

            }

        },

        error: function(xhr) {

            alert(
                xhr.responseJSON?.message ||
                'Failed to delete education record.'
            );

        }

    });

});


// ==========================================
// CANCEL BUTTON
// ==========================================

$(document).on('click', '#cancelBtn', function(e) {

    e.preventDefault();

    clearEducationForm();

});


// ==========================================
// CLEAR FORM
// ==========================================

function clearEducationForm() {

    $('#educationForm')[0].reset();

    $('#education_id').val('');

    $('#emp_id').val('');

    // CLEAR EMPLOYEE SEARCH
    $('#educationEmployeeSearch').val('');

    $('#educationEmployeeSearchResult').hide();

    $('#educationEmployeeSearchBody').empty();

    $('#status').val('1');

    mode = 'save';

    $('#saveBtn').text('Save');

}


// ==========================================
// SEARCH EDUCATION
// ==========================================

$(document).on('keyup', '#searchEducation', function() {

    let search = $(this).val().toLowerCase();

    let filtered = educationList.filter(function(item) {

        return (

            String(item.employee_name || '')
                .toLowerCase().includes(search) ||

            String(item.emp_id || '')
                .toLowerCase().includes(search) ||

            String(item.degree || '')
                .toLowerCase().includes(search) ||

            String(item.institution || '')
                .toLowerCase().includes(search) ||

            String(item.result || '')
                .toLowerCase().includes(search)

        );

    });

    renderEducationTable(filtered);

});


// ==========================================
// EMPLOYEE SEARCH
// GUEST SEARCH SAME PATTERN
// ==========================================

$(document).ready(function() {

    let filteredEmployees = [];

    let activeIndex = -1;

    let searchTimer = null;


    // ==========================================
    // SEARCH EMPLOYEES
    // ==========================================

    $('#educationEmployeeSearch').on('input', function() {

        let search = $(this).val().trim();

        // CLEAR SELECTED EMPLOYEE
        $('#emp_id').val('');

        clearTimeout(searchTimer);

        filteredEmployees = [];

        activeIndex = -1;

        // SHOW ALL EMPLOYEES IF EMPTY
        if (search.length < 1) {

            filteredEmployees = allEducationEmployees.slice();

            showEmployees();

            return;
        }

        // WAIT UNTIL TYPING STOPS
        searchTimer = setTimeout(function() {

            // IGNORE OLD SEARCH
            if (
                $('#educationEmployeeSearch').val().trim()
                !== search
            ) {
                return;
            }

            let keyword = search.toLowerCase();

            filteredEmployees = allEducationEmployees.filter(
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

        }, 250);

    });


    // ==========================================
    // SHOW ALL EMPLOYEES ON CLICK
    // ==========================================

    $('#educationEmployeeSearch').on(
        'focus click',
        function() {

            let search = $(this).val().trim();

            if (
                search.length === 0 ||
                $('#emp_id').val()
            ) {

                filteredEmployees = allEducationEmployees.slice();

                activeIndex = -1;

                showEmployees();
            }

        }
    );


    // ==========================================
    // SHOW EMPLOYEE SEARCH RESULTS
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

            filteredEmployees.forEach(
                function(employee, index) {

                    html += `
                        <tr
                            class="education-employee-row"
                            data-index="${index}"
                            style="cursor:pointer;"
                        >

                            <td>
                                ${escapeHTML(employee.employee_id)}
                            </td>

                            <td>
                                ${escapeHTML(employee.name)}
                            </td>

                        </tr>
                    `;

                }
            );
        }

        $('#educationEmployeeSearchBody').html(html);

        $('#educationEmployeeSearchResult').show();

    }


    // ==========================================
    // CLICK AN EMPLOYEE
    // ==========================================

    $(document).on(
        'click',
        '#educationEmployeeSearchBody .education-employee-row',
        function() {

            let index = $(this).data('index');

            selectEmployee(filteredEmployees[index]);

        }
    );


    // ==========================================
    // KEYBOARD NAVIGATION
    // ==========================================

    $('#educationEmployeeSearch').on(
        'keydown',
        function(e) {

            if (e.key === 'Escape') {

                $('#educationEmployeeSearchResult').hide();

                return;
            }

            if (
                !$('#educationEmployeeSearchResult').is(':visible') ||
                filteredEmployees.length === 0
            ) {
                return;
            }

            // DOWN ARROW
            if (e.key === 'ArrowDown') {

                e.preventDefault();

                activeIndex++;

                if (activeIndex >= filteredEmployees.length) {
                    activeIndex = 0;
                }

                activeRow();
            }

            // UP ARROW
            else if (e.key === 'ArrowUp') {

                e.preventDefault();

                activeIndex--;

                if (activeIndex < 0) {
                    activeIndex = filteredEmployees.length - 1;
                }

                activeRow();
            }

            // ENTER
            else if (e.key === 'Enter') {

                e.preventDefault();

                if (activeIndex >= 0) {

                    selectEmployee(
                        filteredEmployees[activeIndex]
                    );
                }
            }

        }
    );


    // ==========================================
    // HIGHLIGHT ACTIVE ROW
    // ==========================================

    function activeRow() {

        let $rows = $(
            '#educationEmployeeSearchBody .education-employee-row'
        );

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

        // STORE EMPLOYEE ID
        $('#emp_id').val(
            employee.employee_id || ''
        );

        // DISPLAY EMPLOYEE NAME AND ID
        $('#educationEmployeeSearch').val(
            (employee.employee_id || '') +
            ' - ' +
            (employee.name || '')
        );

        $('#educationEmployeeSearchResult').hide();

        filteredEmployees = [];

        activeIndex = -1;

        // NEXT FIELD
        $('#degree').trigger('focus');

    }


    // ==========================================
    // CLICK OUTSIDE
    // ==========================================

    $(document).on('click', function(e) {

        if (
            !$(e.target).closest(
                '#educationEmployeeSearch, #educationEmployeeSearchResult'
            ).length
        ) {

            $('#educationEmployeeSearchResult').hide();

        }

    });

});
