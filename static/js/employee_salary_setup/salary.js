function loadSalary(emp_id = '') {

    console.log("Selected Employee ID:", emp_id);

    $.ajax({
        url: '/salary-setup/get/',
        method: 'GET',
        data: {
            emp_id: emp_id
        },
        dataType: 'json',

        success: function(response) {

            let salary_list = response.data || [];
            let tbody = '';

            $.each(salary_list, function(index, a) {

                tbody += `
                    <tr class="salary-row"
                        data-id="${a.id || ''}"
                        data-emp_id="${a.emp_id || ''}"
                        data-head_id="${a.head_id || ''}">

                        <td>${index + 1}</td>
                        <td>${a.emp_id || ''} - ${a.employee_name || ''}</td>
                        <td>${a.head_id || ''} - ${a.head_name || ''}</td>
                        <td>${Number(a.amount || 0).toFixed(2)}</td>
                        <td>${a.status == 1 ? 'Active' : 'Inactive'}</td>

                        <td>
                            <button type="button"
                                class="btn btn-sm btn-warning editBtn"
                                data-id="${a.id || ''}"
                                data-emp_id="${a.emp_id || ''}"
                                data-emp_name="${a.employee_name || ''}"
                                data-head_id="${a.head_id || ''}"
                                data-head_name="${a.head_name || ''}"
                                data-amount="${a.amount || ''}"
                                data-status="${a.status}">
                                Edit
                            </button>

                            <button type="button"
                                class="btn btn-sm btn-danger deleteBtn"
                                data-id="${a.id || ''}">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Kono data na thakle
            if (salary_list.length === 0) {
                tbody = `
                    <tr>
                        <td colspan="6" class="text-center">No Salary Setup Found</td>
                    </tr>
                `;
            }

            $('#salaryRows').html(tbody);

            console.log("Records loaded:", salary_list.length);
        },

        error: function(xhr) {
            console.error("AJAX Error:", xhr.status, xhr.responseText);
            alert('Failed to load salary list.');
        }
    });
}


$(document).ready(function() {

    // Page khulle shob list
    loadSalary();

});


// ==========================================
// EMPLOYEE ID HAAT DIYE LIKHLE -> OI EMPLOYEE ER LIST
// ==========================================
$(document)
    .off('change.empId', '#emp_id')
    .on('change.empId', '#emp_id', function() {

        loadSalary($(this).val());
    });


// ==========================================
// EMPLOYEE SEARCH BOX KHALI -> SHOB LIST
// ==========================================
$(document).on('input', '#employeeSearch', function() {

    if ($(this).val().trim() === '') {
        loadSalary();
    }
});


// ==========================================
// SEARCH SALARY LIST (table er bhitore)
// ==========================================
$(document).on('input', '#salarySearch', function() {

    let search = $(this).val().trim().toLowerCase();

    $('#salaryRows .salary-row').each(function() {
        $(this).toggle($(this).text().toLowerCase().includes(search));
    });
});


// ==========================================
// SAVE / UPDATE
// ==========================================
let mode = "save";   // 👈 GLOBAL

$(document).on('click', '#saveBtn', function(e){
    e.preventDefault();

    let salary_id = $('#salaryId').val();
    let emp_id = $('#emp_id').val();
    let head_id = $('#head_id').val();
    let amount = $('#amount').val();
    let status = $('#status').val();

    if (!emp_id) {
        alert("Please select employee.");
        return;
    }
    if (!head_id) {
        alert("Please select transaction head.");
        return;
    }
    if (amount === '' || Number(amount) < 0) {
        alert("Please enter valid amount.");
        return;
    }

    // DUPLICATE CHECK (shudhu notun save e)
    if (mode === 'save') {

        let duplicate = false;

        $('#salaryRows .salary-row').each(function () {
            if ($(this).data('emp_id') == emp_id && $(this).data('head_id') == head_id) {
                duplicate = true;
                return false;
            }
        });

        if (duplicate) {
            alert("❌ This employee already has this salary head!");
            $('#headSearch').focus();
            return;
        }
    }

    if(mode === 'save') {
        $.ajax({
            url: '/salary-setup/save/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'emp_id': emp_id,
                'head_id': head_id,
                'amount': amount,
                'status': status,
            },
            success: function(response){
                alert("Saved successfull");
                clearSalaryForm();
                loadSalary(emp_id);
            },
            error: function(xhr){
                alert((xhr.responseJSON && xhr.responseJSON.message) || "Save failed");
            }
        });
    } else if(mode === 'update') {
        $.ajax({
            url: '/salary-setup/update/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'id': salary_id,
                'emp_id': emp_id,
                'head_id': head_id,
                'amount': amount,
                'status': status,
            },
            success: function(response){
                alert("Updated successfull");
                clearSalaryForm();
                loadSalary(emp_id);
            },
            error: function(xhr){
                alert((xhr.responseJSON && xhr.responseJSON.message) || "Update failed");
            }
        });
    }

});


// ==========================================
// EDIT
// ==========================================
$(document).on('click', '.editBtn', function(e) {
    e.preventDefault();

    $("#salaryId").val($(this).data('id'));

    $("#emp_id").val($(this).data('emp_id'));
    $("#employeeSearch").val($(this).data('emp_id') + ' - ' + $(this).data('emp_name'));

    $("#head_id").val($(this).data('head_id'));
    $("#headSearch").val($(this).data('head_id') + ' - ' + $(this).data('head_name'));

    $("#amount").val($(this).data('amount'));
    $("#status").val(String($(this).data('status')));

    mode = "update";
    $('#saveBtn').text('Update');
});


// ==========================================
// DELETE
// ==========================================
$(document).on('click', '.deleteBtn', function(e) {
    e.preventDefault();

    let salary_id = $(this).data('id');
    let emp_id = $('#emp_id').val();      // clear er AGE rekhe dao

    if (confirm("Are you sure to delete?")) {
        $.ajax({
            url: '/salary-setup/delete/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'id': salary_id,
            },
            success: function(response){

                if (response.status === 'success') {
                    alert(response.message || "✅ Remove successful!");
                    clearSalaryForm();
                    loadSalary(emp_id);
                } else {
                    alert(response.message || "Error occurred");
                }

            },
            error: function(xhr){
                alert((xhr.responseJSON && xhr.responseJSON.message) || "Delete failed");
            }
        });
    }
});


// ==========================================
// CLEAR FORM
// ==========================================
function clearSalaryForm() {

    $('#salaryId').val('');
    $('#emp_id').val('');
    $('#employeeSearch').val('');
    $('#head_id').val('');
    $('#headSearch').val('');
    $('#amount').val('');
    $('#status').val('1');

    mode = "save";
    $('#saveBtn').text('Save');
}

$(document).on('click', '#clearBtn', function(e) {
    e.preventDefault();

    clearSalaryForm();
    loadSalary();
});