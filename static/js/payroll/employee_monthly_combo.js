// ==========================================
// LOAD MONTH COMBO
// ==========================================

function loadSalaryMonthCombo(selected_id = null, callback = null){

    $.ajax({
        url: '/salary-month-combo/',
        method: 'GET',
        data:{},

        success: function(response){

            let salary_month_combo = response.salary_month_combo;
            let $select = $('#salaryMonth');
            $select.empty(); // Clear existing options
            $select.append('<option value="">Select Month</option>');
            $.each(salary_month_combo, function(index, e) {
                $select.append(`<option value="${e.id}">${e.month_name}</option>`);
            });

            // Default: current month
            if (!selected_id) selected_id = new Date().getMonth() + 1;
            $select.val(String(selected_id));

            if(callback){
                callback();
            }
        },
        error: function() {
            alert("Failed to load salary month");
        }
    });
}

// ==========================================
// PAGE LOAD
// ==========================================

$(document).ready(function(){

    loadSalaryMonthCombo(null, function(){

    });

});