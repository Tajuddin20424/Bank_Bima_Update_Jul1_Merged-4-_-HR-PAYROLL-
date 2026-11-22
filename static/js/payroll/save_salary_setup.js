$(document).ready(function() {

    $(document).on('click', '#saveBtn', function(e){
        e.preventDefault();

        alert("saveBtn clicked");
        let checkValue = "";
        duplicationCheck(function(result) {
            checkValue = result;
            if (checkValue === "duplicate") {
                alert("Duplicate entry found. Save operation aborted.");
                return;
            } else {
                alert("No duplicate found. Proceeding with save operation.");
                // Proceed with the save operation here
            }
        });


        // let salary_id = $('#salaryId').val();
        // let emp_id = $('#emp_id').val();
        // let head_id = $('#head_id').val();
        // let amount = $('#amount').val();
        // let status = $('#status').val();

        // if (!emp_id) {
        //     alert("Please select employee.");
        //     return;
        // }
        // if (!head_id) {
        //     alert("Please select transaction head.");
        //     return;
        // }
        // if (amount === '' || Number(amount) < 0) {
        //     alert("Please enter valid amount.");
        //     return;
        // }

        // // ✅ DUPLICATE CHECK (only for ADD, not edit)
        // if (mode === 'save') {
        //     let duplicate = false;

        //     $("#salaryRows tr").each(function () {
        //         if (
        //             $(this).data("emp_id") == emp_id &&
        //             $(this).data("head_id") == head_id
        //         ) {
        //             duplicate = true;
        //             return false;
        //         }
        //     });

        //     if (duplicate) {
        //         alert("❌ This employee already has this salary head!");
        //         $('#headSearch').focus().select();
        //         return;
        //     }
        // }

        // if(mode === 'save') {
        //     $.ajax({
        //         url: '/salary-setup/save/',
        //         method: 'POST',
        //         headers: { "X-CSRFToken": csrftoken },
        //         data: {
        //             'emp_id': emp_id,
        //             'head_id': head_id,
        //             'amount': amount,
        //             'status': status,
        //         },
        //         success: function(response){
        //             alert("Saved successfull");
        //             loadSalary();
        //             clearSalaryForm();
        //         },
        //         error: function(xhr){
        //             alert((xhr.responseJSON && xhr.responseJSON.message) || "Save failed");
        //         }
        //     });
        // } else if(mode === 'update') {
        //     $.ajax({
        //         url: '/salary-setup/update/',
        //         method: 'POST',
        //         headers: { "X-CSRFToken": csrftoken },
        //         data: {
        //             'id': salary_id,
        //             'emp_id': emp_id,
        //             'head_id': head_id,
        //             'amount': amount,
        //             'status': status,
        //         },
        //         success: function(response){
        //             alert("Updated successfull");
        //             loadSalary();
        //             clearSalaryForm();
        //         },
        //         error: function(xhr){
        //             alert((xhr.responseJSON && xhr.responseJSON.message) || "Update failed");
        //         }
        //     });
        // }

    });
});