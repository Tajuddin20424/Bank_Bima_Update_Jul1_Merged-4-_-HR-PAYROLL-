
let trainingMode = "save";

// Save or Update training details
$(document).on("click", "#saveBtn", function (e) {
    e.preventDefault();

    const training_id = $("#training_id").val();
    const emp_id = $("#emp_id").val().trim();
    const training_title = $("#training_title").val().trim();
    const country = $("#country").val().trim();
    const topic = $("#topic").val().trim();
    const institution_name = $("#institution_name").val().trim();
    const start_date = $("#start_date").val();
    const end_date = $("#end_date").val();

    // Validate required fields
    if (!emp_id || !training_title || !topic || !institution_name) {
        alert("Please fill in all required fields.");
        return;
    }

    // Validate dates
    if (start_date && end_date && end_date < start_date) {
        alert("End date cannot be earlier than start date.");
        return;
    }

    // Make sure an ID exists when updating
    if (trainingMode === "update" && !training_id) {
        alert("Training ID is missing. Please select the record again.");
        return;
    }

    // Select the correct Django URL
    const url =
        trainingMode === "save"
            ? "/employee-training-details/save/"
            : "/employee-training-details/update/";

    // Prevent duplicate clicks while the request is running
    const saveButton = $("#saveBtn");
    const originalButtonText = saveButton.text();

    saveButton.prop("disabled", true).text("Processing...");

    $.ajax({
        url: url,
        type: "POST",
        headers: {
            "X-CSRFToken": csrftoken
        },
        dataType: "json",
        data: {
            training_id: training_id,
            emp_id: emp_id,
            training_title: training_title,
            country: country,
            topic: topic,
            institution_name: institution_name,
            start_date: start_date,
            end_date: end_date
        },

        // Request completed successfully at the HTTP level
        success: function (response) {
            // Check the status returned by Django
            if (response.status !== "success") {
                alert(
                    response.message ||
                    "Failed to save training details."
                );

                console.error("Django operation failed:", response);
                return;
            }

            alert(
                response.message ||
                (
                    trainingMode === "save"
                        ? "Training details saved successfully."
                        : "Training details updated successfully."
                )
            );

            // Reload records and clear the form
            if (typeof loadTrainingDetails === "function") {
                loadTrainingDetails();
            } else {
                console.error("loadTrainingDetails() function not found.");
            }

            resetTrainingForm();
        },

        // HTTP error or invalid server response
        error: function (xhr) {
            console.error("HTTP status:", xhr.status);
            console.error("Server response:", xhr.responseText);

            let message = "Failed to save training details.";

            try {
                const response = JSON.parse(xhr.responseText);

                if (response.message) {
                    message = response.message;
                }
            } catch (error) {
                console.error("The server did not return valid JSON.");
            }

            alert(message);
        },

        // Always re-enable the button
        complete: function () {
            saveButton.prop("disabled", false);

            if (trainingMode === "update") {
                saveButton.text("Update");
            } else {
                saveButton.text("💾 Save");
            }
        }
    });
});


// Edit an existing training record
$(document).on("click", ".editBtn", function (e) {
    e.preventDefault();

    $("#training_id").val($(this).attr("data-id"));
    $("#emp_id").val($(this).attr("data-emp-id"));
    $("#training_title").val($(this).attr("data-training-title"));
    $("#country").val($(this).attr("data-country"));
    $("#topic").val($(this).attr("data-topic"));
    $("#institution_name").val($(this).attr("data-institution-name"));
    $("#start_date").val($(this).attr("data-start-date"));
    $("#end_date").val($(this).attr("data-end-date"));

    trainingMode = "update";

    $("#saveBtn").text("Update");
});


// Cancel editing
$(document).on("click", "#cancelBtn", function (e) {
    e.preventDefault();
    resetTrainingForm();
});


// Reset the form
function resetTrainingForm() {
    const form = $("#trainingForm")[0];

    if (form) {
        form.reset();
    }

    $("#training_id").val("");

    trainingMode = "save";

    $("#saveBtn")
        .prop("disabled", false)
        .text("💾 Save");

    $("#message").text("");
}