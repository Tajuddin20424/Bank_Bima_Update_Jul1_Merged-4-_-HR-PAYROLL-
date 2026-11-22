$(document).ready(function () {

    let headList = [];       
    let activeIndex = -1;    
    let searchTimer = null;  


    // ==========================================
    // 1a. TYPE KORLE -> SEARCH
    // ==========================================
    $("#headSearch").on("input", function () {

        let search = $(this).val().trim();

        $("#head_id").val("");

        clearTimeout(searchTimer);

        searchTimer = setTimeout(function () {
            searchHead(search);
        }, 250);
    });


    // ==========================================
    // 1b. BOX E CLICK -> SHOB HEAD
    // ==========================================
    $("#headSearch").on("click", function () {

        if (!$("#head_id").val()) {
            searchHead($(this).val().trim());
        }
    });


    // ==========================================
    // SERVER THEKE HEAD ANO
    // search khali -> shob head
    // search ache  -> mile jaoa head
    // ==========================================
    function searchHead(search) {

        $.ajax({
            url: '/salary-setup/head-search/',
            type: "GET",
            data: { search: search },
            dataType: "json",

            success: function (response) {

                headList = response.results || [];
                activeIndex = -1;

                showHeads();
            },

            error: function (xhr) {
                console.log("Head search error:", xhr.responseText);
            }
        });
    }


    // ==========================================
    // 2. LIST DEKHAO
    // ==========================================
    function showHeads() {

        let html = "";

        if (headList.length === 0) {

            html = `
                <tr>
                    <td colspan="2" class="text-center">No Transaction Head Found</td>
                </tr>
            `;

        } else {

            $.each(headList, function (index, head) {

                html += `
                    <tr class="head-search-row" data-index="${index}" style="cursor:pointer;">
                        <td>${head.id || "-"}</td>
                        <td>${head.tran_head_name || "-"}</td>
                    </tr>
                `;
            });
        }

        $("#headSearchBody").html(html);
        $("#headSearchResult").show();
    }


    // ==========================================
    // 3a. MOUSE DIYE SELECT
    // ==========================================
    $(document).on("click", ".head-search-row", function () {

        let index = $(this).data("index");

        selectHead(headList[index]);
    });


    // ==========================================
    // 3b. KEYBOARD DIYE SELECT (↑ ↓ Enter Esc)
    // ==========================================
    $("#headSearch").on("keydown", function (e) {

        // Esc -> list bondho
        if (e.key === "Escape") {
            $("#headSearchResult").hide();
            return;
        }

        // List khali hole kichu korar nai
        if (headList.length === 0) {
            return;
        }

        // ↓ -> porer row
        if (e.key === "ArrowDown") {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % headList.length;
            highlightRow();
        }

        // ↑ -> ager row
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + headList.length) % headList.length;
            highlightRow();
        }

        // Enter -> select
        else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0) {
                selectHead(headList[activeIndex]);
            }
        }
    });


    // Keyboard e je row select, take rong dao
    function highlightRow() {

        let $rows = $("#headSearchBody .head-search-row");

        $rows.removeClass("table-primary");
        $rows.eq(activeIndex).addClass("table-primary")[0].scrollIntoView({ block: "nearest" });
    }


    // ==========================================
    // 4. HEAD SELECT HOLE
    // ==========================================
    function selectHead(head) {

        if (!head) {
            return;
        }

        // ID boshao (save e jabe)
        $("#head_id").val(head.id);

        // Box e ID + naam dekhao
        $("#headSearch").val(head.id + " - " + head.tran_head_name);

        // List bondho
        $("#headSearchResult").hide();

        // Reset
        headList = [];
        activeIndex = -1;

        // Porer ghor e jao
        $("#amount").trigger("focus");
    }


    // ==========================================
    // 5. BAIRE CLICK -> LIST BONDHO
    // ==========================================
    $(document).on("click", function (e) {

        if (!$(e.target).closest("#headSearch, #headSearchResult").length) {
            $("#headSearchResult").hide();
        }
    });

});







// /* ==========================================
//    TRANSACTION HEAD COMBO (SEARCH)
// ========================================== */

// $(document).ready(function () {

//     let filteredHeads = [];

//     let activeIndex = -1;
//     let searchTimer = null;
//     let searchRequest = null;

//     // ==========================================
//     // SEARCH HEADS THROUGH AJAX
//     // ==========================================
//     $("#headSearch").on("input", function () {

//         let search = $(this).val().trim();

//         // Notun type korle ager select kora head bad
//         $("#head_id").val("");

//         clearTimeout(searchTimer);

//         // Cancel the previous request, if still running
//         if (searchRequest) {
//             searchRequest.abort();
//             searchRequest = null;
//         }

//         filteredHeads = [];
//         activeIndex = -1;

//         // Require at least 1 characters
//         // if (search.length < 1) {
//         //     $("#headSearchBody").empty();
//         //     $("#headSearchResult").hide();
//         //     return;
//         // }


//         // Wait until typing pauses before sending AJAX
//         searchTimer = setTimeout(function () {

//             let request;

//             request = $.ajax({
//                 url: '/salary-setup/head-search/',
//                 type: "GET",

//                 // Send the user's search text to Django
//                 data: {
//                     search: search
//                 },

//                 dataType: "json",

//                 success: function (response) {

//                     console.log("Head search response:", response);

//                     // Ignore results for an older search
//                     if (
//                         $("#headSearch").val().trim()
//                         !== search
//                     ) {
//                         return;
//                     }

//                     if (response.status === "success") {
//                         filteredHeads = response.results || [];
//                     } else {
//                         filteredHeads = [];
//                     }

//                     activeIndex = -1;
//                     showHeads();
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


//     $("#headSearch").on("focus click", function () {

//         if ($("#headSearchResult").is(":hidden") && !$("#head_id").val()) {
//             $(this).trigger("input");
//         }

//     });


//     // ==========================================
//     // SHOW SEARCH RESULTS
//     // ==========================================
//     function showHeads() {

//         let html = "";

//         if (filteredHeads.length === 0) {

//             html = `
//                 <tr>
//                     <td colspan="2" class="text-center">
//                         No Transaction Head Found
//                     </td>
//                 </tr>
//             `;

//         } else {

//             filteredHeads.forEach(function (head, index) {

//                 html += `
//                     <tr class="head-search-row"
//                         data-index="${index}"
//                         style="cursor:pointer;">

//                         <td>${escapeHtml(head.id)}</td>
//                         <td>${escapeHtml(head.tran_head_name)}</td>

//                     </tr>
//                 `;

//             });

//         }

//         $("#headSearchBody").html(html);
//         $("#headSearchResult").show();
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
//     // CLICK A HEAD
//     // ==========================================

//     $(document).on("click", ".head-search-row", function () {

//         let index = $(this).data("index");

//         selectHead(filteredHeads[index]);

//     });


//     // ==========================================
//     // KEYBOARD NAVIGATION
//     // ==========================================
//     $("#headSearch").on("keydown", function (e) {

//         if (e.key === "Escape") {
//             $("#headSearchResult").hide();
//             return;
//         }

//         if (filteredHeads.length === 0) {
//             return;
//         }

//         // DOWN ARROW
//         if (e.key === "ArrowDown") {
//             e.preventDefault();

//             activeIndex++;

//             if (activeIndex >= filteredHeads.length) {
//                 activeIndex = 0;
//             }

//             activeRow();
//         }

//         // UP ARROW
//         else if (e.key === "ArrowUp") {
//             e.preventDefault();

//             activeIndex--;

//             if (activeIndex < 0) {
//                 activeIndex = filteredHeads.length - 1;
//             }

//             activeRow();
//         }

//         // ENTER
//         else if (e.key === "Enter") {
//             e.preventDefault();

//             if (activeIndex >= 0) {
//                 selectHead(filteredHeads[activeIndex]);
//             }

//         }

//     });


//     // ==========================================
//     // HIGHLIGHT ACTIVE ROW
//     // ==========================================
//     function activeRow() {

//         let $rows = $("#headSearchBody .head-search-row");

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
//     // SELECT HEAD
//     // ==========================================
//     function selectHead(head) {

//         if (!head) {
//             return;
//         }

//         $("#head_id").val(head.id || "");

//         $("#headSearch").val(
//             (head.id || "") + " - " + (head.tran_head_name || "")
//         );

//         $("#headSearchResult").hide();

//         filteredHeads = [];
//         activeIndex = -1;

//         // Move focus to the next field
//         $("#amount").trigger("focus");
//     }


//     // ==========================================
//     // CLICK OUTSIDE
//     // ==========================================
//     $(document).on("click", function (e) {

//         if (
//             !$(e.target).closest(
//                 "#headSearch, #headSearchResult"
//             ).length
//         ) {
//             $("#headSearchResult").hide();
//         }

//     });
// })