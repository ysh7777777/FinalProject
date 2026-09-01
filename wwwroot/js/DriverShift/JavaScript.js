const scheduleRows = document.querySelector("#scheduleRows");
const shiftDialog = document.querySelector("#shiftDialog");
const deleteDialog = document.querySelector("#deleteDialog");
const shiftForm = document.querySelector("#shiftForm");
const dialogTitle = document.querySelector("#dialogTitle");
const editingShiftId = document.querySelector("#editingShiftId");
const shiftDate = document.querySelector("#shiftDate");
const startTime = document.querySelector("#startTime");
const endTime = document.querySelector("#endTime");
const vehicle = document.querySelector("#vehicle");
const formMessage = document.querySelector("#formMessage");
const createOnlyField = document.querySelector(".create-only-field");
const emptyState = document.querySelector("#emptyState");
const tableWrap = document.querySelector(".table-wrap");
const toast = document.querySelector("#toast");
const deleteShiftId = document.querySelector("#deleteShiftId");


let toastTimer = null;

document.querySelector("#openCreateDialog").addEventListener("click", openCreateDialog);
document.querySelector("#closeDialog").addEventListener("click", () => shiftDialog.close());
document.querySelector("#cancelDialog").addEventListener("click", () => shiftDialog.close());
document.querySelector("#cancelDelete").addEventListener("click", () => deleteDialog.close());


scheduleRows.addEventListener("click", (event) => {
    const row = event.target.closest("tr");
    if (!row) return;

    if (event.target.closest(".edit-button")) {
        openEditDialog(row);
    }

    if (event.target.closest(".delete-button")) {
        deleteShiftId.value = row.dataset.shiftId;
        deleteDialog.showModal();
    }
});

// shiftForm.addEventListener("submit", (event) => {
//     event.preventDefault();
//     formMessage.textContent = "";

//     if (startTime.value >= endTime.value) {
//         formMessage.textContent = "下班時間必須晚於上班時間。";
//         return;
//     }

//     if (editingShiftId.value) {
//         updatePreviewRow();
//         showToast("班表時間已更新（預覽）");
//     } else {
//         addPreviewRow();
//         showToast("班表已新增，工作狀態為待命（預覽）");
//     }

//     shiftDialog.close();
//     refreshEmptyState();
// });

function openCreateDialog() {
    shiftForm.reset();
    editingShiftId.value = "";
    dialogTitle.textContent = "新增班表";
    shiftForm.action = shiftForm.dataset.createUrl;
    shiftDate.disabled = false;
    vehicle.disabled = false;
    createOnlyField.hidden = false;
    formMessage.textContent = "";

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    shiftDate.value = toDateInputValue(tomorrow);
    startTime.value = "08:00";
    endTime.value = "17:00";
    shiftDialog.showModal();
}

function openEditDialog(row) {
    if (row.dataset.canEdit !== "true") {
        showToast("這筆班表已有訂單，不能修改");
        return;
    }

    editingShiftId.value = row.dataset.shiftId;
    dialogTitle.textContent = "編輯上下班時間";
    shiftForm.action = shiftForm.dataset.editUrl;
    shiftDate.value = row.querySelector(".date-main").textContent.replaceAll(" ", "").replaceAll("/", "-");
    shiftDate.disabled = true;
    startTime.value = row.querySelector(".start-time").textContent.trim();
    endTime.value = row.querySelector(".end-time").textContent.trim();
    vehicle.disabled = true;
    createOnlyField.hidden = true;
    formMessage.textContent = "";
    shiftDialog.showModal();
}

function updatePreviewRow() {
    const row = scheduleRows.querySelector(`[data-shift-id="${editingShiftId.value}"]`);
    if (!row) return;

    row.querySelector(".start-time").textContent = startTime.value;
    row.querySelector(".end-time").textContent = endTime.value;
}

function addPreviewRow() {
    const selectedOption = vehicle.options[vehicle.selectedIndex];

    const plateNumber = vehicle.value;

    const vehicleType = selectedOption.dataset.vehicleType;
    const date = new Date(`${shiftDate.value}T00:00:00`);
    const row = document.createElement("tr");

    row.dataset.shiftId = `PREVIEW-${Date.now()}`;
    row.dataset.canEdit = "true";
    row.innerHTML = `
        <td data-label="值班日期">
            <strong class="date-main">${formatDate(date)}</strong>
            <small>${formatWeekday(date)}</small>
        </td>
        <td data-label="上班時間" class="start-time">${startTime.value}</td>
        <td data-label="下班時間" class="end-time">${endTime.value}</td>
        <td data-label="車牌號碼"><span class="plate">${plateNumber}</span></td>
        <td data-label="車輛種類">${vehicleType}</td>
        <td data-label="工作狀態"><span class="status status-ready">待命</span></td>
        <td data-label="派單狀態"><span class="dispatch dispatch-free">尚無訂單</span></td>
        <td data-label="操作" class="row-actions">
            <button class="link-button edit-button" type="button">編輯</button>
            <button class="link-button delete-button" type="button">刪除</button>
        </td>`;

    scheduleRows.append(row);
}



function refreshEmptyState() {
    const hasRows = scheduleRows.querySelector("tr") !== null;
    emptyState.hidden = hasRows;
    tableWrap.hidden = !hasRows;
}

function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function toDateInputValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()} / ${month} / ${day}`;
}

function formatWeekday(date) {
    return new Intl.DateTimeFormat("zh-TW", { weekday: "long" }).format(date);
}
