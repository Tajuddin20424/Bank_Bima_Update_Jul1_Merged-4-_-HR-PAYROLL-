function loadDepartment() {

    $.ajax({
        url: '/employee_departments/load-department/',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            let department_list = response.department_list;
            let tbody = '';

            $.each(department_list, function (index, s) {
                tbody += `
                    <tr class="list-row"
                        data-id="${s.id}"
                        data-name="${s.name}"
                        data-status="${s.status}">
                       

                        <td>${index + 1}</td>
                        <td>${s.id}</td>
                        <td>${s.name}</td>
                        <td>${s.status}</td>
                        <td>
                            <button class="btn btn-sm btn-warning editBtn" 
                                data-id="${s.id}"
                                data-name="${s.name}"
                                data-status="${s.status}">
                                
                                Edit
                            </button>                        
                            <button class="btn btn-sm btn-danger deleteBtn" 
                                data-id="${s.id}">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });

            $('#departmentTableBody').html(tbody);
        },

        error: function () {
            alert('Failed to load Department list...');
        }
    });
}

$(document).ready(function () {
    loadDepartment();
})


// // save department

let mode = "save";   // 👈 GLOBAL

$(document).on('click', '#saveBtn', function (e) {
    e.preventDefault();

    let name = $('#name').val();
    let depStatus = $('#depStatus').val();
    let dep_id = $('#dep_id').val();

    if (!name) {
        alert("Please enter Department name.");
        return;
    }
    // alert(mode);
    // return;        
    if (mode === 'save') {
        $.ajax({
            url: '/employee_departments/save-employee-department/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'name': name,
                'status': depStatus
            },
            success: function (response) {
                alert("Saved successfull");
                loadDepartment();
                $('#name').val('');
            }
        });
    } else if (mode === 'update') {
        $.ajax({
            url: '/employee_departments/update-employee-department/',
            method: 'POST',
            headers: { "X-CSRFToken": csrftoken },
            data: {
                'name': name,
                'status': depStatus,
                'dep_id': dep_id,
            },
            success: function (response) {
                alert("Updated successfull");
                loadDepartment();
                $('#name').val('');
                mode = "save";
                $('#saveBtn').text('Save');
            }
        });
    }
});

// ✅ editBtn handler যোগ করো
$(document).on('click', '.editBtn', function(e) {
    e.preventDefault();

    $('#name').val($(this).data('name'));
    $('#depStatus').val(String($(this).data('status')));
    $('#dep_id').val($(this).data('id'));

    mode = 'update';
    $('#saveBtn').text('Update');
});

$(document).on('click', '#cancelBtn', function (e) {
    e.preventDefault();
    $('#addForm')[0].reset();
    $('#dep_id').val('');
    mode = 'save';
    $('#saveBtn').text('Save');
});

//deleteBtn add

$(document).on('click', '.deleteBtn', function(e){
    e.preventDefault();

    let dep_id = $(this).data('id');
    let dep_name = $(this).data('name');

    if (!confirm("Confirm to remove this class?")) {
        return;
    }

    $.ajax({
        url: "/employee_departments/remove-department/",
        method: "POST",
        headers: { "X-CSRFToken": csrftoken },
        data: {
            'dep_id': dep_id,
            'dep_name' : dep_name,
        },
        success: function(response) {
            alert("Removed successfully");
            loadDepartment();
        },
        error: function() {
            alert("Failed to remove subject");
        }
    });
})
