$(document).ready(function () {

    let employeeList = [];   
    let activeIndex = -1;    
    let searchTimer = null;  


    // ==========================================
    // 1. SEARCH
    // ==========================================
    $("#employeeSearch").on("input", function () {

        let search = $(this).val().trim();

        $("#emp_id").val("");          
        clearTimeout(searchTimer);

        if (search === "") {           
            $("#employeeSearchResult").hide();
            return;
        }

        searchTimer = setTimeout(function () {
            searchEmployee(search);
        }, 250);
    });


    function searchEmployee(search) {

        $.ajax({
            url: '/salary-setup/employee-search/',
            type: "GET",
            data: { search: search },
            dataType: "json",

            success: function (response) {
                employeeList = response.results || [];
                activeIndex = -1;
                showEmployees();
            }
        });
    }

    function showEmployees() {

        let html = "";

        if (employeeList.length === 0) {
            html = `<tr><td colspan="4" class="text-center">No Employee Found</td></tr>`;
        }

        $.each(employeeList, function (index, a) {
            html += `
                <tr class="employee-search-row" data-index="${index}" style="cursor:pointer;">
                    <td>${a.employee_id || "-"}</td>
                    <td>${a.name || "-"}</td>
                    <td>${a.mobile || "-"}</td>
                    <td>${a.address || "-"}</td>
                </tr>
            `;
        });

        $("#employeeSearchBody").html(html);
        $("#employeeSearchResult").show();
    }


    // ==========================================
    // 3. SELECT EMPLOYEE
    // ==========================================
    $(document).on("click", ".employee-search-row", function () {
        selectEmployee(employeeList[$(this).data("index")]);
    });

    $("#employeeSearch").on("keydown", function (e) {

        if (e.key === "Escape") {
            $("#employeeSearchResult").hide();
            return;
        }

        if (employeeList.length === 0) {
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % employeeList.length;
            highlightRow();
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + employeeList.length) % employeeList.length;
            highlightRow();
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0) {
                selectEmployee(employeeList[activeIndex]);
            }
        }
    });

    function highlightRow() {

        let $rows = $("#employeeSearchBody .employee-search-row");

        $rows.removeClass("table-primary");
        $rows.eq(activeIndex).addClass("table-primary")[0].scrollIntoView({ block: "nearest" });
    }


    // ==========================================
    // 4. EMPLOYEE SELECT 
    // ==========================================
    function selectEmployee(employee) {

        if (!employee) {
            return;
        }

        $("#emp_id").val(employee.employee_id);
        $("#employeeSearch").val(employee.employee_id + " - " + employee.name);
        $("#employeeSearchResult").hide();

        loadEmployeeDetails(employee.employee_id);   

        if (typeof loadSalary === "function") {
            loadSalary(employee.employee_id);        
        }

        employeeList = [];
        activeIndex = -1;

        $("#headSearch").trigger("focus");
    }


    // ==========================================
    // EMPLOYEE DETAILS (employee__personal__details)
    // ==========================================
    function loadEmployeeDetails(emp_id) {

        $.ajax({
            url: '/salary-setup/employee-details/',
            type: "GET",
            data: { emp_id: emp_id },
            dataType: "json",

            success: function (response) {

                let a = response.employee || {};

                $("#emp_id_display").val(a.employee_id || "");
                $("#emp_name").val(a.name || "");
                $("#emp_fathers_name").val(a.fathers_name || "");
                $("#emp_mothers_name").val(a.mothers_name || "");
                $("#emp_dob").val(a.dob || "");
                $("#emp_gender").val(a.gender || "");
                $("#emp_religion").val(a.religion || "");
                $("#emp_marital_status").val(a.marital_status || "");
                $("#emp_nationality").val(a.nationality || "");
                $("#emp_nid").val(a.nid_no || "");
                $("#emp_phone").val(a.phn_no || "");
                $("#emp_blood_group").val(a.blood_group || "");
                $("#emp_email").val(a.email || "");
                $("#emp_address").val(a.address || "");

                if (a.has_image) {
                    $("#emp_photo").attr("src", "/employee_personal_details/image/" + a.employee_id + "/?t=" + Date.now()).show();
                    $("#emp_photo_empty").removeClass("d-flex").hide();
                } else {
                    $("#emp_photo").attr("src", "").hide();
                    $("#emp_photo_empty").addClass("d-flex").show();
                }
            },

            error: function (xhr) {
                console.log("Employee details error:", xhr.responseText);
            }
        });
    }


    // ==========================================
    // 5. CLICK 
    // ==========================================
    $(document).on("click", function (e) {
        if (!$(e.target).closest("#employeeSearch, #employeeSearchResult").length) {
            $("#employeeSearchResult").hide();
        }
    });

});

// /* ==========================================
//    EMPLOYEE COMBO (SEARCH)
// ========================================== */

// $(document).ready(function () {

//     let filteredEmployees = [];

//     let activeIndex = -1;
//     let searchTimer = null;
//     let searchRequest = null;

//     // ==========================================
//     // SEARCH EMPLOYEES THROUGH AJAX
//     // ==========================================
//     $("#employeeSearch").on("input", function () {

//         let search = $(this).val().trim();

//         $("#emp_id").val("");

//         clearTimeout(searchTimer);

//         if (searchRequest) {
//             searchRequest.abort();
//             searchRequest = null;
//         }

//         filteredEmployees = [];
//         activeIndex = -1;

//         if (search.length < 1) {
//             $("#employeeSearchBody").empty();
//             $("#employeeSearchResult").hide();
//             return;
//         }

//         searchTimer = setTimeout(function () {

//             let request;

//             request = $.ajax({
//                 url: '/salary-setup/employee-search/',
//                 type: "GET",
//                 data: {
//                     search: search
//                 },
//                 dataType: "json",

//                 success: function (response) {

//                     console.log("Employee search response:", response);

//                     if (
//                         $("#employeeSearch").val().trim()
//                         !== search
//                     ) {
//                         return;
//                     }

//                     if (response.status === "success") {
//                         filteredEmployees = response.results || [];
//                     } else {
//                         filteredEmployees = [];
//                     }

//                     activeIndex = -1;
//                     showEmployees();
//                 },

//                 error: function (xhr, status) {

//                     if (status !== "abort") {
//                         console.log(xhr.responseText);
//                     }

//                 },

//                 complete: function () {
//                     if (searchRequest === request) {
//                         searchRequest = null;
//                     }
//                 }
//             });

//             searchRequest = request;

//         }, 250);

//     });


//     // ==========================================
//     // SHOW SEARCH RESULTS
//     // ==========================================
//     function showEmployees() {

//         let html = "";

//         if (filteredEmployees.length === 0) {

//             html = `
//                 <tr>
//                     <td colspan="4" class="text-center">
//                         No Employee Found
//                     </td>
//                 </tr>
//             `;

//         } else {

//             filteredEmployees.forEach(function (employee, index) {

//                 html += `
//                     <tr class="employee-search-row"
//                         data-index="${index}"
//                         style="cursor:pointer;">

//                         <td>${escapeHtml(employee.employee_id)}</td>
//                         <td>${escapeHtml(employee.name)}</td>
//                         <td>${escapeHtml(employee.mobile)}</td>
//                         <td>${escapeHtml(employee.address)}</td>

//                     </tr>
//                 `;

//             });

//         }

//         $("#employeeSearchBody").html(html);
//         $("#employeeSearchResult").show();
//     }


//     // Safely display values received from the server
//     function escapeHtml(value) {

//         if (value === null || value === undefined || value === "") {
//             return "-";
//         }

//         return String(value).replace(/[&<>"']/g, function (char) {
//             return {
//                 "&": "&amp;",
//                 "<": "&lt;",
//                 ">": "&gt;",
//                 '"': "&quot;",
//                 "'": "&#39;"
//             }[char];
//         });
//     }

//     // ==========================================
//     // CLICK AN EMPLOYEE
//     // ==========================================

//     $(document).on("click", ".employee-search-row", function () {

//         let index = $(this).data("index");

//         selectEmployee(filteredEmployees[index]);

//     });


//     // ==========================================
//     // KEYBOARD NAVIGATION
//     // ==========================================
//     $("#employeeSearch").on("keydown", function (e) {

//         if (e.key === "Escape") {
//             $("#employeeSearchResult").hide();
//             return;
//         }

//         if (filteredEmployees.length === 0) {
//             return;
//         }

//         // DOWN ARROW
//         if (e.key === "ArrowDown") {
//             e.preventDefault();

//             activeIndex++;

//             if (activeIndex >= filteredEmployees.length) {
//                 activeIndex = 0;
//             }

//             activeRow();
//         }

//         // UP ARROW
//         else if (e.key === "ArrowUp") {
//             e.preventDefault();

//             activeIndex--;

//             if (activeIndex < 0) {
//                 activeIndex = filteredEmployees.length - 1;
//             }

//             activeRow();
//         }

//         // ENTER
//         else if (e.key === "Enter") {
//             e.preventDefault();

//             if (activeIndex >= 0) {
//                 selectEmployee(filteredEmployees[activeIndex]);
//             }

//         }

//     });


//     // ==========================================
//     // HIGHLIGHT ACTIVE ROW
//     // ==========================================
//     function activeRow() {

//         let $rows = $("#employeeSearchBody .employee-search-row");

//         $rows.removeClass("table-primary");

//         let $currentRow = $rows.eq(activeIndex);

//         $currentRow.addClass("table-primary");

//         if ($currentRow.length) {
//             $currentRow[0].scrollIntoView({
//                 block: "nearest",
//                 behavior: "auto"
//             });
//         }
//     }

//     // ==========================================
//     // SELECT EMPLOYEE
//     // ==========================================
//     function selectEmployee(employee) {

//         if (!employee) {
//             return;
//         }

//         $("#emp_id").val(employee.employee_id || "");
//         $("#emp_id").trigger("change"); 
//         $("#employeeSearch").val((employee.employee_id || "") + " - " + (employee.name || ""));
//         $("#employeeSearchResult").hide();

//         filteredEmployees = [];
//         activeIndex = -1;

//         $("#headSearch").trigger("focus");
//     }


//     // ==========================================
//     // CLICK OUTSIDE
//     // ==========================================
//     $(document).on("click", function (e) {

//         if (
//             !$(e.target).closest(
//                 "#employeeSearch, #employeeSearchResult"
//             ).length
//         ) {
//             $("#employeeSearchResult").hide();
//         }

//     });
// })