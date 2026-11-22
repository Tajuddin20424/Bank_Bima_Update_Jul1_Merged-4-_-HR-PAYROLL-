// ==========================================
// LOAD YEAR COMBO
// ==========================================

function loadSalaryYearCombo(selected_id = null, callback = null){

    $.ajax({
        url: '/salary-year-combo/',
        method: 'GET',
        data:{},

        success: function(response){

            let salary_year_combo = response.salary_year_combo;
            let $select = $('#salaryYear');
            $select.empty(); // Clear existing options
            $select.append('<option value="">Select Year</option>');
            $.each(salary_year_combo, function(index, e) {
                $select.append(`<option value="${e.id}">${e.year_name}</option>`);
            });

            // Default: current year
            if (!selected_id) selected_id = new Date().getFullYear();
            $select.val(String(selected_id));

            if(callback){
                callback();
            }
        },
        error: function() {
            alert("Failed to load salary year");
        }
    });
}

// ==========================================
// PAGE LOAD
// ==========================================

$(document).ready(function(){

    loadSalaryYearCombo(null, function(){

    });

});