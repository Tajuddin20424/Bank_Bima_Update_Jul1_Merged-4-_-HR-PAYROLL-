function loadExperience() {
    $.ajax({
        url: '/employee-experience/load-experience/',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            let experience_list = response.experience_list;
            let tbody = '';

            if (!experience_list || experience_list.length === 0) {
                tbody = '<tr><td colspan="8" class="text-center">No experience records found</td></tr>';
            } else {
                $.each(experience_list, function (index, exp) {
                    let statusText = exp.status == 1 ? 'Active' : 'Inactive';
                    tbody += `
                        <tr class="list-row"
                            data-id="${exp.id}"
                            data-emp_id="${exp.emp_id}"
                            data-company_name="${exp.company_name}"
                            data-designation="${exp.designation}"
                            data-department="${exp.department}"
                            data-company_location="${exp.company_location}"
                            data-status="${exp.status}">

                            <td>${index + 1}</td>
                            <td>${exp.emp_id}</td>
                            <td>${exp.company_name}</td>
                            <td>${exp.designation || ''}</td>
                            <td>${exp.department || ''}</td>
                            <td>${exp.company_location || ''}</td>
                            <td>${statusText}</td>
                            <td>
                                <button class="btn btn-sm btn-warning editBtn"
                                    data-id="${exp.id}"
                                    data-emp_id="${exp.emp_id}"
                                    data-company_name="${exp.company_name}"
                                    data-designation="${exp.designation}"
                                    data-department="${exp.department}"
                                    data-company_location="${exp.company_location}"
                                    data-status="${exp.status}">
                                    Edit
                                </button>
                                <button class="btn btn-sm btn-danger deleteBtn"
                                    data-id="${exp.id}"
                                    data-emp_id="${exp.emp_id}">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `;
                });
            }

            $('#experienceTableBody').html(tbody);
        },
        error: function () {
            alert('Failed to load experience list...');
        }
    });
}

$(document).ready(function () {
    loadExperience();
});


let mode = "save";   // GLOBAL

$(document).on('click', '#saveBtn', function (e) {
    e.preventDefault();

    let exp_id = $('#exp_id').val();
    let emp_id = $('#emp_id').val();
    let company_name = $('#company_name').val();
    let designation = $('#designation').val();
    let department = $('#department').val();
    let company_location = $('#company_location').val();
    let status = $('#status').val();

    if (!emp_id) {
        alert("Please enter employee id.");
        return;
    }
    if (!company_name) {
        alert("Please enter company name.");
        return;
    }

    if (mode === 'save') {
        $.ajax({
            url: '/employee-experience/save-experience/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'emp_id': emp_id,
                'company_name': company_name,
                'designation': designation,
                'department': department,
                'company_location': company_location,
                'status': status
            },
            success: function (response) {
                if (response.status === 'success') {
                    alert(response.message || "Saved successfully");
                    loadExperience();
                    resetForm();
                } else {
                    alert(response.message || "Failed to save");
                }
            },
            error: function () {
                alert("Failed to save experience.");
            }
        });
    } else if (mode === 'update') {
        $.ajax({
            url: '/employee-experience/update-experience/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'exp_id': exp_id,
                'emp_id': emp_id,
                'company_name': company_name,
                'designation': designation,
                'department': department,
                'company_location': company_location,
                'status': status
            },
            success: function (response) {
                if (response.status === 'success') {
                    alert(response.message || "Updated successfully");
                    loadExperience();
                    resetForm();
                } else {
                    alert(response.message || "Failed to update");
                }
            },
            error: function () {
                alert("Failed to update experience.");
            }
        });
    }
});

function resetForm() {
    $('#exp_id').val('');
    $('#emp_id').val('');
    $('#company_name').val('');
    $('#designation').val('');
    $('#department').val('');
    $('#company_location').val('');
    $('#status').val('1');
    mode = "save";
    $('#saveBtn').html('💾 Save');
}

// Edit button click handler
$(document).on('click', '.editBtn', function (e) {
    e.preventDefault();

    $('#exp_id').val($(this).data('id'));
    $('#emp_id').val($(this).data('emp_id'));
    $('#company_name').val($(this).data('company_name'));
    $('#designation').val($(this).data('designation'));
    $('#department').val($(this).data('department'));
    $('#company_location').val($(this).data('company_location'));
    $('#status').val($(this).data('status'));

    mode = 'update';
    $('#saveBtn').html('💾 Update');
});

// Cancel button click handler
$(document).on('click', '#cancelBtn', function (e) {
    e.preventDefault();
    resetForm();
});

// Delete button click handler
$(document).on('click', '.deleteBtn', function (e) {
    e.preventDefault();

    let exp_id = $(this).data('id');

    if (!confirm("Confirm to remove this experience record?")) {
        return;
    }

    $.ajax({
        url: "/employee-experience/remove-experience/",
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
        data: {
            'exp_id': exp_id
        },
        success: function (response) {
            if (response.status === 'success') {
                alert(response.message || "Removed successfully");
                loadExperience();
            } else {
                alert(response.message || "Failed to remove experience");
            }
        },
        error: function () {
            alert("Failed to remove experience");
        }
    });
});

