
 // ==========================================
 // EMPLOYEE REPORT
 // SALARY SHEET JS PATTERN
 // ==========================================

$(document).ready(function () {

    const CONFIG = window.EMPLOYEE_REPORT_CONFIG || {};

    const EMPLOYEE_DATA_URL =
        CONFIG.employeeDataUrl ||
        "/employee-report/__EMP_ID__/data/";

    const DEFAULT_AVATAR =
        "data:image/svg+xml;utf8," +
        "<svg xmlns='http://www.w3.org/2000/svg' " +
        "width='100' height='115' viewBox='0 0 24 24' " +
        "fill='%2394a3b8'>" +
        "<path d='M12 12c2.7 0 4.8-2.1 4.8-4.8" +
        "S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 " +
        "9.3 12 12 12zm0 2.4c-3.2 0-9.6 " +
        "1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-" +
        "6.4-4.8-9.6-4.8z'/></svg>";

    const URLS = {

        personalUpdate: "/employee-report/personal/update/",

        eduUpdate: "/employee-report/education/update/",

        eduRemove: "/employee-report/education/remove/",

        expUpdate: "/employee-report/experience/update/",

        expRemove: "/employee-report/experience/remove/",

        trnUpdate: "/employee-report/training/update/",

        trnRemove: "/employee-report/training/remove/"

    };


    // ==========================================
    // GLOBAL VARIABLES
    // ==========================================

    let cachedEmployeeData = null;

    let editingEducationId = null;

    let editingTrainingId = null;

    let editingExperienceId = null;


    // ==========================================
    // GET QUERY PARAMETER
    // ==========================================

    function getQueryParam(param) {

        return new URLSearchParams(
            window.location.search
        ).get(param);

    }


    // ==========================================
    // CSRF TOKEN
    // ==========================================

    function getCSRFToken() {

        return $(
            'input[name="csrfmiddlewaretoken"]'
        ).val() || "";

    }


    // ==========================================
    // SAFE HTML
    // ==========================================

    function escapeHtml(text) {

        if (text === null || text === undefined) {
            return "";
        }

        return String(text)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    // ==========================================
    // FORMAT TEXT
    // ==========================================

    function formatText(value, fallback) {

        fallback = fallback === undefined
            ? "-"
            : fallback;

        if (
            value === null ||
            value === undefined ||
            String(value).trim() === ""
        ) {
            return fallback;
        }

        return escapeHtml(value);

    }


    // ==========================================
    // CURRENT EMPLOYEE ID
    // ==========================================

    function currentEmpId() {

        return $("#selected_emp_id").val() ||
            $("#EmployeeSelect").val() ||
            "";

    }


    // ==========================================
    // UPDATE MODAL SCALE
    // ==========================================

    function updateModalScale() {

        const modalBody = $(".preview-modal-body");

        if (!modalBody.length) {
            return;
        }

        const availableWidth = modalBody.width() - 36;

        const availableHeight = Math.min(
            window.innerHeight - 170,
            780
        );

        let scaleByWidth = availableWidth / 794;

        let scaleByHeight = availableHeight / 1123;

        let scale = Math.min(
            scaleByWidth,
            scaleByHeight,
            0.78
        );

        scale = Math.max(scale, 0.45);

        document.documentElement.style.setProperty(
            "--modal-scale",
            scale
        );

    }


    // ==========================================
    // FETCH EMPLOYEE DATA
    // ==========================================

    function fetchEmployeeData(empId) {

        if (!empId) {

            $("#reportWorkArea").slideUp();

            cachedEmployeeData = null;

            $("#selected_emp_id").val("");

            return;
        }

        let url = EMPLOYEE_DATA_URL.replace(
            "__EMP_ID__",
            encodeURIComponent(empId)
        );

        $.ajax({

            url: url,

            method: "GET",

            dataType: "json",

            success: function (response) {

                if (
                    response.status === "success" &&
                    response.data
                ) {

                    cachedEmployeeData = response.data;

                    $("#selected_emp_id").val(empId);

                    populatePersonalDetails(
                        response.data.personal || {}
                    );

                    populateEducationDetails(
                        response.data.education || []
                    );

                    populateTrainingDetails(
                        response.data.training || []
                    );

                    populateExperienceDetails(
                        response.data.experience || []
                    );

                    buildCvPreview(response.data);

                    $("#reportWorkArea").slideDown();

                } else {

                    $("#reportWorkArea").slideUp();

                    cachedEmployeeData = null;

                }

            },

            error: function (xhr) {

                console.log(xhr.responseText);

                $("#reportWorkArea").slideUp();

                cachedEmployeeData = null;

            }

        });

    }


    // ==========================================
    // POPULATE PERSONAL DETAILS
    // ==========================================

    function populatePersonalDetails(p) {

        $("#viewEmpId").val(p.employee_id || "");

        $("#viewName").val(p.name || "");

        $("#viewFather").val(p.fathers_name || "");

        $("#viewMother").val(p.mothers_name || "");

        $("#viewDob").val(p.dob || "");

        $("#viewGender").val(p.gender || "");

        $("#viewReligion").val(p.religion || "");

        $("#viewMarital").val(p.marital_status || "");

        $("#viewNationality").val(p.nationality || "");

        $("#viewNid").val(p.nid_no || "");

        $("#viewPhone").val(p.phn_no || "");

        $("#viewBlood").val(p.blood_group || "");

        $("#viewEmail").val(p.email || "");

        $("#viewLocationId").val(p.location_id || "");

        $("#viewStatus").val(
            String(p.status != null ? p.status : 1)
        );

        let locParts = [
            p.upazila,
            p.district,
            p.division
        ].filter(Boolean);

        $("#viewLocation").val(
            locParts.length ? locParts.join(", ") : ""
        );

        $("#viewAddress").val(p.address || "");

    }


    // ==========================================
    // POPULATE EDUCATION DETAILS
    // ==========================================

    function populateEducationDetails(eduList) {

        const tbody = $("#tableEducation tbody").empty();

        if (eduList && eduList.length > 0) {

            eduList.forEach(function (e, index) {

                let result = e.cgpa

                    ? `CGPA: ${e.cgpa}`

                    : (
                        e.marks
                            ? `Marks: ${e.marks}%`
                            : (e.result || "-")
                    );

                tbody.append(`

                    <tr>

                        <td>${index + 1}</td>

                        <td class="fw-semibold">
                            ${formatText(e.degree)}
                        </td>

                        <td>${formatText(e.group)}</td>

                        <td>${formatText(e.institution)}</td>

                        <td>${formatText(result)}</td>

                        <td>${formatText(e.batch)}</td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-sm btn-warning editEducationBtn"
                                data-id="${escapeHtml(e.id)}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-sm btn-danger deleteEducationBtn"
                                data-id="${escapeHtml(e.id)}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                `);

            });

        } else {

            tbody.append(`

                <tr>
                    <td colspan="7" class="text-muted py-3">
                        No education records found
                    </td>
                </tr>

            `);

        }

    }


    // ==========================================
    // POPULATE TRAINING DETAILS
    // ==========================================

    function populateTrainingDetails(trainList) {

        const tbody = $("#tableTraining tbody").empty();

        if (trainList && trainList.length > 0) {

            trainList.forEach(function (t, index) {

                tbody.append(`

                    <tr>

                        <td>${index + 1}</td>

                        <td class="fw-semibold">
                            ${formatText(t.training_title)}
                        </td>

                        <td>${formatText(t.topic)}</td>

                        <td>${formatText(t.institution_name)}</td>

                        <td>${formatText(t.country)}</td>

                        <td>${formatText(t.start_date)}</td>

                        <td>${formatText(t.end_date)}</td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-sm btn-warning editTrainingBtn"
                                data-id="${escapeHtml(t.id)}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-sm btn-danger deleteTrainingBtn"
                                data-id="${escapeHtml(t.id)}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                `);

            });

        } else {

            tbody.append(`

                <tr>
                    <td colspan="8" class="text-muted py-3">
                        No training records found
                    </td>
                </tr>

            `);

        }

    }


    // ==========================================
    // POPULATE EXPERIENCE DETAILS
    // ==========================================

    function populateExperienceDetails(expList) {

        const tbody = $("#tableExperience tbody").empty();

        if (expList && expList.length > 0) {

            expList.forEach(function (x, index) {

                tbody.append(`

                    <tr>

                        <td>${index + 1}</td>

                        <td class="fw-semibold">
                            ${formatText(x.company_name)}
                        </td>

                        <td>${formatText(x.designation)}</td>

                        <td>${formatText(x.department)}</td>

                        <td>${formatText(x.company_location)}</td>

                        <td>${formatText(x.start_date)}</td>

                        <td>${formatText(x.end_date, "Present")}</td>

                        <td>

                            <button
                                type="button"
                                class="btn btn-sm btn-warning editExperienceBtn"
                                data-id="${escapeHtml(x.id)}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                class="btn btn-sm btn-danger deleteExperienceBtn"
                                data-id="${escapeHtml(x.id)}"
                            >
                                Delete
                            </button>

                        </td>

                    </tr>

                `);

            });

        } else {

            tbody.append(`

                <tr>
                    <td colspan="8" class="text-muted py-3">
                        No experience records found
                    </td>
                </tr>

            `);

        }

    }


    // ==========================================
    // BUILD CV PREVIEW
    // ==========================================

    function buildCvPreview(data) {

        const p = data.personal || {};

        $("#cvName").text(
            p.name || "EMPLOYEE NAME"
        );

        $("#cvSubtitle").text("CURRICULUM VITAE");

        $("#cvContactPhone .val").text(
            p.phn_no || "-"
        );

        $("#cvContactEmail .val").text(
            p.email || "-"
        );

        let locParts = [
            p.upazila,
            p.district
        ].filter(Boolean);

        $("#cvContactLocation .val").text(
            locParts.length
                ? locParts.join(", ")
                : (p.address || "-")
        );

        if (p.image_base64) {

            $("#cvPhoto")
                .attr("src", p.image_base64)
                .show();

        } else {

            $("#cvPhoto")
                .attr("src", DEFAULT_AVATAR)
                .show();

        }

        $("#cvEmpId").text(p.employee_id || "-");

        $("#cvDob").text(p.dob || "-");

        $("#cvFather").text(p.fathers_name || "-");

        $("#cvMother").text(p.mothers_name || "-");

        $("#cvGender").text(p.gender || "-");

        $("#cvBlood").text(p.blood_group || "-");

        $("#cvMarital").text(p.marital_status || "-");

        $("#cvReligion").text(p.religion || "-");

        $("#cvNationality").text(p.nationality || "-");

        $("#cvNid").text(p.nid_no || "-");

        let fullAddress = [

            p.address,

            p.upazila,

            p.district,

            p.division

        ].filter(Boolean).join(", ");

        $("#cvAddress").text(
            fullAddress || "-"
        );


        // ==================================
        // CV EDUCATION
        // ==================================

        const cvEdu = $("#cvEduTable tbody").empty();

        if (data.education && data.education.length > 0) {

            data.education.forEach(function (e) {

                let result = e.cgpa

                    ? `CGPA: ${e.cgpa}`

                    : (
                        e.marks
                            ? `${e.marks}%`
                            : (e.result || "-")
                    );

                cvEdu.append(`

                    <tr>

                        <td class="fw-bold">
                            ${formatText(e.degree)}
                        </td>

                        <td>${formatText(e.group)}</td>

                        <td>${formatText(e.institution)}</td>

                        <td>${formatText(result)}</td>

                        <td>${formatText(e.batch)}</td>

                    </tr>

                `);

            });

        } else {

            cvEdu.append(`

                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No educational qualifications recorded
                    </td>
                </tr>

            `);

        }


        // ==================================
        // CV TRAINING
        // ==================================

        const cvTrain = $("#cvTrainTable tbody").empty();

        if (data.training && data.training.length > 0) {

            data.training.forEach(function (t) {

                let duration = "-";

                if (t.start_date) {

                    duration =
                        `${t.start_date} to ${t.end_date || ""}`;

                }

                cvTrain.append(`

                    <tr>

                        <td class="fw-bold">
                            ${formatText(t.training_title)}
                        </td>

                        <td>${formatText(t.topic)}</td>

                        <td>${formatText(t.institution_name)}</td>

                        <td>${formatText(t.country)}</td>

                        <td>${formatText(duration)}</td>

                    </tr>

                `);

            });

        } else {

            cvTrain.append(`

                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No training programs recorded
                    </td>
                </tr>

            `);

        }


        // ==================================
        // CV EXPERIENCE
        // ==================================

        const cvExp = $("#cvExpTable tbody").empty();

        if (data.experience && data.experience.length > 0) {

            data.experience.forEach(function (x) {

                let duration = "-";

                if (x.start_date) {

                    duration =
                        `${x.start_date} to ${x.end_date || "Present"}`;

                }

                cvExp.append(`

                    <tr>

                        <td class="fw-bold">
                            ${formatText(x.company_name)}
                        </td>

                        <td>${formatText(x.designation)}</td>

                        <td>${formatText(x.department)}</td>

                        <td>${formatText(x.company_location)}</td>

                        <td>${formatText(duration)}</td>

                    </tr>

                `);

            });

        } else {

            cvExp.append(`

                <tr>
                    <td colspan="5" class="text-center text-muted">
                        No previous experience recorded
                    </td>
                </tr>

            `);

        }

        $("#cvSigName").text(
            p.name ? p.name : "Applicant Signature"
        );

    }


    // ==========================================
    // PREVIEW MODAL
    // ==========================================

    function openPreviewModal() {

        if (!cachedEmployeeData) {

            alert("Please select an employee first.");

            return;
        }

        const clonedReport = $("#reportPreview").clone();

        $("#previewModalPaper")
            .empty()
            .append(clonedReport);

        const previewModal = new bootstrap.Modal(
            document.getElementById("previewModal")
        );

        previewModal.show();

    }


    // ==========================================
    // AJAX POST HELPER
    // ==========================================

    function postAjax(url, data, onSuccess) {

        return $.ajax({

            url: url,

            method: "POST",

            dataType: "json",

            headers: {

                "X-CSRFToken": getCSRFToken()

            },

            data: data,

            success: function (response) {

                if (
                    response &&
                    (
                        response.success === true ||
                        response.status === "success"
                    )
                ) {

                    if (onSuccess) {

                        onSuccess(response);

                    }

                } else {

                    alert(
                        (response && response.message) ||
                        "Operation failed."
                    );

                }

            },

            error: function (xhr) {

                console.log(xhr.responseText);

                let message = (
                    xhr.responseJSON &&
                    xhr.responseJSON.message
                ) || "Request failed.";

                alert(message);

            }

        });

    }


    // ==========================================
    // REFRESH AFTER CHANGE
    // ==========================================

    function refreshAfterChange() {

        let empId = currentEmpId();

        if (empId) {

            fetchEmployeeData(empId);

        }

    }


    // ==========================================
    // PERSONAL DETAILS SAVE
    // ==========================================

    $(document).on(
        "click",
        "#savePersonalBtn",
        function (e) {

            e.preventDefault();

            let empId = currentEmpId();

            if (!empId) {

                alert("No employee selected.");

                return;
            }

            let data = {

                employee_id: empId,

                name: $("#viewName").val(),

                fathers_name: $("#viewFather").val(),

                mothers_name: $("#viewMother").val(),

                dob: $("#viewDob").val(),

                gender: $("#viewGender").val(),

                religion: $("#viewReligion").val(),

                marital_status: $("#viewMarital").val(),

                nationality: $("#viewNationality").val(),

                nid_no: $("#viewNid").val(),

                phn_no: $("#viewPhone").val(),

                blood_group: $("#viewBlood").val(),

                email: $("#viewEmail").val(),

                location_id: $("#viewLocationId").val(),

                address: $("#viewAddress").val(),

                status: $("#viewStatus").val()

            };

            let $btn = $(this).prop("disabled", true);

            postAjax(
                URLS.personalUpdate,
                data,
                function (response) {

                    alert(
                        response.message ||
                        "Personal details updated."
                    );

                    refreshAfterChange();

                }
            ).always(function () {

                $btn.prop("disabled", false);

            });

        }
    );


    // ==========================================
    // EDUCATION EDIT
    // ==========================================

    $(document).on(
        "click",
        ".editEducationBtn",
        function (e) {

            e.preventDefault();

            let id = String($(this).data("id"));

            let list = (
                cachedEmployeeData &&
                cachedEmployeeData.education
            ) || [];

            let item = list.find(function (row) {

                return String(row.id) === id;

            });

            if (!item) {

                alert("Record not found.");

                return;
            }

            editingEducationId = item.id;

            $("#educationFormPanel").slideDown();

            $("#edu_degree").val(item.degree || "");

            $("#edu_group").val(item.group || "");

            $("#edu_institution").val(
                item.institution || ""
            );

            $("#edu_result").val(item.result || "");

            $("#edu_scale").val(
                item.scale != null ? item.scale : ""
            );

            $("#edu_cgpa").val(
                item.cgpa != null ? item.cgpa : ""
            );

            $("#edu_marks").val(
                item.marks != null ? item.marks : ""
            );

            $("#edu_batch").val(
                item.batch != null ? item.batch : ""
            );

            $("#edu_status").val(
                String(
                    item.status != null ? item.status : 1
                )
            );

            console.log(
                "[EDU EDIT] editingEducationId =",
                editingEducationId
            );

            window.scrollTo({

                top: $("#educationFormPanel").offset().top - 90,

                behavior: "smooth"

            });

        }
    );


    // ==========================================
    // EDUCATION CANCEL
    // ==========================================

    $(document).on(
        "click",
        "#educationCancelBtn",
        function (e) {

            e.preventDefault();

            editingEducationId = null;

            if ($("#educationForm").length) {

                $("#educationForm")[0].reset();

            }

            $("#edu_status").val("1");

            $("#educationFormPanel").slideUp();

        }
    );


    // ==========================================
    // EDUCATION UPDATE
    // ==========================================

    $(document).on(
        "click",
        "#educationSaveBtn",
        function (e) {

            e.preventDefault();

            let empId = currentEmpId();

            if (!empId) {

                alert("No employee selected.");

                return;
            }

            if (!editingEducationId) {

                alert(
                    "No record selected. Click Edit on a row first."
                );

                return;
            }

            let data = {

                education_id: editingEducationId,

                emp_id: empId,

                degree: $("#edu_degree").val(),

                group: $("#edu_group").val(),

                institution: $("#edu_institution").val(),

                result: $("#edu_result").val(),

                scale: $("#edu_scale").val(),

                cgpa: $("#edu_cgpa").val(),

                marks: $("#edu_marks").val(),

                batch: $("#edu_batch").val(),

                status: $("#edu_status").val()

            };

            let $btn = $(this).prop("disabled", true);

            postAjax(
                URLS.eduUpdate,
                data,
                function (response) {

                    alert(
                        response.message || "Updated."
                    );

                    editingEducationId = null;

                    $("#educationFormPanel").slideUp();

                    refreshAfterChange();

                }
            ).always(function () {

                $btn.prop("disabled", false);

            });

        }
    );


    // ==========================================
    // EDUCATION DELETE
    // ==========================================

    $(document).on(
        "click",
        ".deleteEducationBtn",
        function (e) {

            e.preventDefault();

            let id = $(this).data("id");

            if (!confirm(
                "Delete this education record?"
            )) {
                return;
            }

            postAjax(
                URLS.eduRemove,
                {
                    education_id: id
                },
                function (response) {

                    alert(
                        response.message || "Deleted."
                    );

                    refreshAfterChange();

                }
            );

        }
    );


    // ==========================================
    // TRAINING EDIT
    // ==========================================

    $(document).on(
        "click",
        ".editTrainingBtn",
        function (e) {

            e.preventDefault();

            let id = String($(this).data("id"));

            let list = (
                cachedEmployeeData &&
                cachedEmployeeData.training
            ) || [];

            let item = list.find(function (row) {

                return String(row.id) === id;

            });

            if (!item) {

                alert("Record not found.");

                return;
            }

            editingTrainingId = item.id;

            $("#trainingFormPanel").slideDown();

            $("#trn_title").val(
                item.training_title || ""
            );

            $("#trn_topic").val(item.topic || "");

            $("#trn_institution").val(
                item.institution_name || ""
            );

            $("#trn_country").val(
                item.country || ""
            );

            $("#trn_start").val(
                item.start_date || ""
            );

            $("#trn_end").val(
                item.end_date || ""
            );

            $("#trn_status").val(
                String(
                    item.status != null ? item.status : 1
                )
            );

            console.log(
                "[TRN EDIT] editingTrainingId =",
                editingTrainingId
            );

            window.scrollTo({

                top: $("#trainingFormPanel").offset().top - 90,

                behavior: "smooth"

            });

        }
    );


    // ==========================================
    // TRAINING CANCEL
    // ==========================================

    $(document).on(
        "click",
        "#trainingCancelBtn",
        function (e) {

            e.preventDefault();

            editingTrainingId = null;

            if ($("#trainingForm").length) {

                $("#trainingForm")[0].reset();

            }

            $("#trn_status").val("1");

            $("#trainingFormPanel").slideUp();

        }
    );


    // ==========================================
    // TRAINING UPDATE
    // ==========================================

    $(document).on(
        "click",
        "#trainingSaveBtn",
        function (e) {

            e.preventDefault();

            let empId = currentEmpId();

            if (!empId) {

                alert("No employee selected.");

                return;
            }

            if (!editingTrainingId) {

                alert(
                    "No record selected. Click Edit on a row first."
                );

                return;
            }

            let data = {

                training_id: editingTrainingId,

                emp_id: empId,

                training_title: $("#trn_title").val(),

                topic: $("#trn_topic").val(),

                institution_name: $("#trn_institution").val(),

                country: $("#trn_country").val(),

                start_date: $("#trn_start").val(),

                end_date: $("#trn_end").val(),

                status: $("#trn_status").val()

            };

            let $btn = $(this).prop("disabled", true);

            postAjax(
                URLS.trnUpdate,
                data,
                function (response) {

                    alert(
                        response.message || "Updated."
                    );

                    editingTrainingId = null;

                    $("#trainingFormPanel").slideUp();

                    refreshAfterChange();

                }
            ).always(function () {

                $btn.prop("disabled", false);

            });

        }
    );


    // ==========================================
    // TRAINING DELETE
    // ==========================================

    $(document).on(
        "click",
        ".deleteTrainingBtn",
        function (e) {

            e.preventDefault();

            let id = $(this).data("id");

            if (!confirm(
                "Delete this training record?"
            )) {
                return;
            }

            postAjax(
                URLS.trnRemove,
                {
                    training_id: id
                },
                function (response) {

                    alert(
                        response.message || "Deleted."
                    );

                    refreshAfterChange();

                }
            );

        }
    );


    // ==========================================
    // EXPERIENCE EDIT
    // ==========================================

    $(document).on(
        "click",
        ".editExperienceBtn",
        function (e) {

            e.preventDefault();

            let id = String($(this).data("id"));

            let list = (
                cachedEmployeeData &&
                cachedEmployeeData.experience
            ) || [];

            let item = list.find(function (row) {

                return String(row.id) === id;

            });

            if (!item) {

                alert("Record not found.");

                return;
            }

            editingExperienceId = item.id;

            $("#experienceFormPanel").slideDown();

            $("#exp_company").val(
                item.company_name || ""
            );

            $("#exp_designation").val(
                item.designation || ""
            );

            $("#exp_department").val(
                item.department || ""
            );

            $("#exp_location").val(
                item.company_location || ""
            );

            $("#exp_start").val(
                item.start_date || ""
            );

            $("#exp_end").val(
                item.end_date || ""
            );

            $("#exp_status").val(
                String(
                    item.status != null ? item.status : 1
                )
            );

            console.log(
                "[EXP EDIT] editingExperienceId =",
                editingExperienceId
            );

            window.scrollTo({

                top: $("#experienceFormPanel").offset().top - 90,

                behavior: "smooth"

            });

        }
    );


    // ==========================================
    // EXPERIENCE CANCEL
    // ==========================================

    $(document).on(
        "click",
        "#experienceCancelBtn",
        function (e) {

            e.preventDefault();

            editingExperienceId = null;

            if ($("#experienceForm").length) {

                $("#experienceForm")[0].reset();

            }

            $("#exp_status").val("1");

            $("#experienceFormPanel").slideUp();

        }
    );


    // ==========================================
    // EXPERIENCE UPDATE
    // ==========================================

    $(document).on(
        "click",
        "#experienceSaveBtn",
        function (e) {

            e.preventDefault();

            let empId = currentEmpId();

            if (!empId) {

                alert("No employee selected.");

                return;
            }

            if (!editingExperienceId) {

                alert(
                    "No record selected. Click Edit on a row first."
                );

                return;
            }

            let data = {

                experience_id: editingExperienceId,

                emp_id: empId,

                company_name: $("#exp_company").val(),

                designation: $("#exp_designation").val(),

                department: $("#exp_department").val(),

                company_location: $("#exp_location").val(),

                start_date: $("#exp_start").val(),

                end_date: $("#exp_end").val(),

                status: $("#exp_status").val()

            };

            let $btn = $(this).prop("disabled", true);

            postAjax(
                URLS.expUpdate,
                data,
                function (response) {

                    alert(
                        response.message || "Updated."
                    );

                    editingExperienceId = null;

                    $("#experienceFormPanel").slideUp();

                    refreshAfterChange();

                }
            ).always(function () {

                $btn.prop("disabled", false);

            });

        }
    );


    // ==========================================
    // EXPERIENCE DELETE
    // ==========================================

    $(document).on(
        "click",
        ".deleteExperienceBtn",
        function (e) {

            e.preventDefault();

            let id = $(this).data("id");

            if (!confirm(
                "Delete this experience record?"
            )) {
                return;
            }

            postAjax(
                URLS.expRemove,
                {
                    experience_id: id
                },
                function (response) {

                    alert(
                        response.message || "Deleted."
                    );

                    refreshAfterChange();

                }
            );

        }
    );


    // ==========================================
    // EMPLOYEE DROPDOWN CHANGE
    // ==========================================

    $("#EmployeeSelect").on(
        "change",
        function () {

            fetchEmployeeData(
                $(this).val()
            );

        }
    );


    // ==========================================
    // PREVIEW BUTTON
    // ==========================================

    $("#previewBtn").on(
        "click",
        function (e) {

            e.preventDefault();

            openPreviewModal();

        }
    );


    // ==========================================
    // PRINT BUTTON
    // ==========================================

    $("#modalPrintBtn").on(
        "click",
        function (e) {

            e.preventDefault();

            window.print();

        }
    );


    // ==========================================
    // MODAL SHOW
    // ==========================================

    $("#previewModal").on(
        "shown.bs.modal",
        function () {

            updateModalScale();

        }
    );


    // ==========================================
    // WINDOW RESIZE
    // ==========================================

    $(window).on(
        "resize",
        function () {

            updateModalScale();

        }
    );


    // ==========================================
    // PAGE LOAD
    // ==========================================

    let initialEmpId =
        getQueryParam("emp_id") ||
        $("#EmployeeSelect").val();

    if (initialEmpId) {

        $("#EmployeeSelect").val(initialEmpId);

        fetchEmployeeData(initialEmpId);

    }

});
