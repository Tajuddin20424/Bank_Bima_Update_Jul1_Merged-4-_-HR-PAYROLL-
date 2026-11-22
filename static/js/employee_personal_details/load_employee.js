let mode = "save";
let allEmployees = [];


// ==========================================
// LOAD EMPLOYEE
// ==========================================

function loadEmployee() {

    $.ajax({

        url: '/employee_personal_details/load/',
        type: 'GET',

        success: function(response) {

            allEmployees = response.employee_list || [];

            showEmployeeList(allEmployees);

        },

        error: function(xhr) {

            console.log(xhr.responseText);

            alert("Failed to load employee list.");

        }

    });

}


// ==========================================
// SHOW EMPLOYEE LIST
// ==========================================

function showEmployeeList(employees) {

    let html = '';

    if (employees.length == 0) {

        html = `
            <tr>
                <td colspan="10" class="text-center">
                    No Employee Found
                </td>
            </tr>
        `;

        $('#employeeTableBody').html(html);

        return;
    }

    $.each(employees, function(index, employee) {

        let status = employee.status == 1
            ? '<span class="badge bg-success">Active</span>'
            : '<span class="badge bg-danger">Inactive</span>';

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${employee.image_url
                        ? `<img src="${employee.image_url}" alt="Photo"
                               style="width:40px; height:40px; object-fit:cover; border-radius:50%;">`
                        : '-'}
                <td>${employee.employee_id || ''}</td>
                <td>${employee.name || ''}</td>
                <td>${employee.gender || ''}</td>
                <td>${employee.phn_no || ''}</td>
                <td>${employee.email || ''}</td>
                <td>${employee.blood_group || ''}</td>
                <td>${employee.location_id || ''}</td>
                <td>${status}</td>

                <td>
                    <button
                        type="button"
                        class="btn btn-sm btn-warning editBtn"
                        data-id="${employee.employee_id}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="btn btn-sm btn-danger deleteBtn"
                        data-id="${employee.employee_id}">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    });

    $('#employeeTableBody').html(html);

}

// ==========================================
// SAVE / UPDATE BUTTON CLICK
// ==========================================

$(document).on('click', '#saveBtn', function (e) {

    e.preventDefault();

    if (mode == "save") {

        saveEmployee();

    } else {

        updateEmployee();

    }

});


// ==========================================
// SAVE EMPLOYEE
// ==========================================

function saveEmployee() {

    let name = $('#name').val();
    let phn_no = $('#phn_no').val();
    let email = $('#email').val();

    // VALIDATION

    if (!name) {
        alert("Please enter employee name.");
        return;
    }

    if (!phn_no) {
        alert("Please enter phone number.");
        return;
    }

    if (!email) {
        alert("Please enter email.");
        return;
    }

    // FORM DATA

    let formData = new FormData(
        document.getElementById('employeeForm')
    );

    formData.set('tran_user_type', '3');

    // AJAX SAVE

    $.ajax({

        url: '/employee_personal_details/save/',

        type: 'POST',

        headers: {
            'X-CSRFToken': csrftoken
        },

        data: formData,

        processData: false,

        contentType: false,

        success: function (response) {

            if (response.status == 'success') {

                alert(
                    response.message ||
                    "Employee saved successfully."
                );

                clearEmployeeForm();

                loadEmployee();

            } else {

                alert(
                    response.message ||
                    "Employee save failed."
                );

            }

        },

        error: function (xhr) {

            console.log(xhr.responseText);

            alert(
                xhr.responseJSON?.message ||
                "Employee save failed."
            );

        }

    });

}


// ==========================================
// UPDATE EMPLOYEE
// ==========================================

function updateEmployee() {

    let employeeId = $('#employee_id').val();

    if (!employeeId) {

        alert("Employee ID not found.");

        return;
    }

    let formData = new FormData(
        document.getElementById('employeeForm')
    );

    formData.set('employee_id', employeeId);

    formData.set('tran_user_type', '3');

    // AJAX UPDATE

    $.ajax({

        url: '/employee_personal_details/update/',

        type: 'POST',

        headers: {
            'X-CSRFToken': csrftoken
        },

        data: formData,

        processData: false,

        contentType: false,

        success: function (response) {

            if (response.status == 'success') {

                alert(
                    response.message ||
                    "Employee updated successfully."
                );

                clearEmployeeForm();

                loadEmployee();

            } else {

                alert(
                    response.message ||
                    "Employee update failed."
                );

            }

        },

        error: function (xhr) {

            console.log(xhr.responseText);

            alert(
                xhr.responseJSON?.message ||
                "Employee update failed."
            );

        }

    });

}


// ==========================================
// CLEAR EMPLOYEE FORM
// ==========================================

function clearEmployeeForm() {

    $('#employeeForm')[0].reset();

    $('#employee_id').val('');

    $('#tran_user_type').val('3');

    $('#status').val('1');

    $('#image').val('');

    mode = "save";

    $('#saveBtn').text('Save');

}


// ==========================================
// CANCEL BUTTON
// ==========================================

$(document).on('click', '#cancelBtn', function (e) {

    e.preventDefault();

    clearEmployeeForm();

});

// ==========================================
// EDIT EMPLOYEE
// ==========================================

$(document).on('click', '.editBtn', function () {

    let employeeId = $(this).data('id');

    let employee = allEmployees.find(function (item) {

        return String(item.employee_id) == String(employeeId);

    });

    if (!employee) {

        alert("Employee information not found.");

        return;
    }

    mode = "update";

    $('#employee_id').val(employee.employee_id);

    $('#name').val(employee.name || '');

    $('#fathers_name').val(employee.fathers_name || '');

    $('#mothers_name').val(employee.mothers_name || '');

    $('#dob').val(employee.dob || '');

    $('#gender').val(employee.gender || '');

    $('#religion').val(employee.religion || '');

    $('#marital_status').val(employee.marital_status || '');

    $('#nationality').val(employee.nationality || '');

    $('#nid_no').val(employee.nid_no || '');

    $('#phn_no').val(employee.phn_no || '');

    $('#blood_group').val(employee.blood_group || '');

    $('#email').val(employee.email || '');

    $('#location_id').val(employee.location_id || '');

    $('#tran_user_type').val('3');

    $('#address').val(employee.address || '');

    $('#status').val(String(employee.status));

    $('#image').val('');

    $('#saveBtn').text('Update');

    $('html, body').animate({
        scrollTop: 0
    }, 300);

});


// ==========================================
// DELETE EMPLOYEE
// ==========================================

$(document).on('click', '.deleteBtn', function () {

    let employeeId = $(this).data('id');

    if (!employeeId) {

        alert("Employee ID not found.");

        return;
    }

    if (!confirm("Confirm to delete this employee?")) {

        return;
    }

    $.ajax({

        url: '/employee_personal_details/remove/',

        type: 'POST',

        headers: {
            'X-CSRFToken': csrftoken
        },

        data: {
            employee_id: employeeId
        },

        success: function (response) {

            if (response.status == 'success') {

                alert(
                    response.message ||
                    "Employee deleted successfully."
                );

                loadEmployee();

            } else {

                alert(
                    response.message ||
                    "Delete failed."
                );

            }

        },

        error: function (xhr) {

            console.log(xhr.responseText);

            alert("Employee delete failed.");

        }

    });

});


// ==========================================
// PAGE LOAD
// ==========================================

$(document).ready(function() {

    loadEmployee();

});