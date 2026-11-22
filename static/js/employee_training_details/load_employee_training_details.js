
function loadTrainingDetails() {

    $.ajax({
        url: '/employee-training-details/load/',
        method: 'GET',
        dataType: 'json',

        success: function (response) {
            let training_list = response.training_list;
            let tbody = '';

            $.each(training_list, function (index, t) {
                tbody += `
                    <tr class="list-row"
                        data-id="${t.id}"
                        data-emp-id="${t.emp_id}"
                        data-training-title="${t.training_title}"
                        data-country="${t.country || ''}"
                        data-topic="${t.topic}"
                        data-institution-name="${t.institution_name}"
                        data-start-date="${t.start_date || ''}"
                        data-end-date="${t.end_date || ''}">

                        <td>${index + 1}</td>
                        <td>${t.id}</td>
                        <td>${t.emp_id}</td>
                        <td>${t.training_title}</td>
                        <td>${t.country || ''}</td>
                        <td>${t.topic}</td>
                        <td>${t.institution_name}</td>
                        <td>${t.start_date || ''}</td>
                        <td>${t.end_date || ''}</td>

                        <td>
                            <button type="button"
                                class="btn btn-sm btn-warning editBtn"
                                data-id="${t.id}"
                                data-emp-id="${t.emp_id}"
                                data-training-title="${t.training_title}"
                                data-country="${t.country || ''}"
                                data-topic="${t.topic}"
                                data-institution-name="${t.institution_name}"
                                data-start-date="${t.start_date || ''}"
                                data-end-date="${t.end_date || ''}">
                                Edit
                            </button>

                            <button type="button"
                                class="btn btn-sm btn-danger deleteBtn"
                                data-id="${t.id}">
                                Delete
                            </button>
                        </td>
                    </tr>
                `;
            });

            $('#trainingTableBody').html(tbody);
        },

        error: function () {
            alert('Failed to load employee training details.');
        }
    });
}

$(document).ready(function () {
    loadTrainingDetails();
});