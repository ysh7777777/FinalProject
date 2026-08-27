// // ========================================
// // 訂單狀態 Tab
// // ========================================

// const orderTabs = document.querySelectorAll(".order-tab");
// const orderCards = document.querySelectorAll(".order-card");

// orderTabs.forEach(tab => {
//     tab.addEventListener("click", function () {
//         // 移除其他 active
//         orderTabs.forEach(item => {
//             item.classList.remove("active");
//         });

//         // 自己變 active
//         this.classList.add("active");

//         const selectedStatus = this.dataset.status;

//         // 顯示對應訂單
//         orderCards.forEach(card => {
//             const cardStatus = card.dataset.orderStatus;

//             if (cardStatus === selectedStatus) {
//                 card.style.display = "block";
//             } else {
//                 card.style.display = "none";
//             }
//         });
//     });
// });




document.addEventListener("DOMContentLoaded", function () {
    const statusTabs = document.querySelectorAll(".order-tab");
    const orderCards = document.querySelectorAll(".order-card");

    // ==========================================
    // 訂單篩選
    // ==========================================
    function filterOrders(status) {
        orderCards.forEach(function (card) {
            const orderStatus = card.dataset.orderStatus;

            // ==========================================
            // 進行中
            // processing + pending
            // ==========================================
            if (
                status === "processing" &&
                (
                    orderStatus === "processing" ||
                    orderStatus === "pending"
                )
            ) {
                card.style.display = "";
            }

            // ==========================================
            // 已完成
            // completed
            // ==========================================
            else if (
                status === "completed" &&
                orderStatus === "completed"
            ) {
                card.style.display = "";
            }

            // ==========================================
            // 已取消
            // cancelled
            // ==========================================
            else if (
                status === "cancelled" &&
                orderStatus === "cancelled"
            ) {
                card.style.display = "";
            }

            // ==========================================
            // 不符合 → 隱藏
            // ==========================================
            else {
                card.style.display = "none";
            }
        });
    }

    // ==========================================
    // 點擊頁籤
    // ==========================================
    statusTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            // 移除所有 active
            statusTabs.forEach(function (item) {
                item.classList.remove("active");
            });

            // 當前頁籤加入 active
            this.classList.add("active");

            // 取得目前狀態
            const status = this.dataset.status;

            // 執行篩選
            filterOrders(status);
        });
    });

    // ==========================================
    // 第一次載入頁面
    // 預設顯示「進行中」
    // ==========================================
    filterOrders("processing");
});



// // ========================================
// // 展開 / 收合訂單
// // ========================================

// function toggleOrder(button) {
//     const card = button.closest(".order-card");
//     const extra = card.querySelector(".order-extra");
//     const icon = button.querySelector("i");

//     card.classList.toggle("expanded");

//     if (card.classList.contains("expanded")) {
//         extra.style.maxHeight = extra.scrollHeight + "px";

//         icon.classList.remove("bi-chevron-down");
//         icon.classList.add("bi-chevron-up");
//     } else {
//         extra.style.maxHeight = "0px";

//         icon.classList.remove("bi-chevron-up");
//         icon.classList.add("bi-chevron-down");
//     }
// }


// ==========================================
// 展開 / 收起訂單
// ==========================================
function toggleOrder(button) {
    const orderCard = button.closest(".order-card");
    const orderExtra = orderCard.querySelector(".order-extra");
    const icon = button.querySelector("i");

    const isOpen = orderExtra.classList.contains("show");

    // ==========================================
    // 如果目前是展開 → 收起
    // ==========================================
    if (isOpen) {
        orderExtra.style.maxHeight = "0px";
        orderExtra.classList.remove("show");

        icon.classList.remove("bi-chevron-up");
        icon.classList.add("bi-chevron-down");
    }

    // ==========================================
    // 如果目前是收起 → 展開
    // ==========================================
    else {
        orderExtra.style.maxHeight = orderExtra.scrollHeight + "px";
        orderExtra.classList.add("show");

        icon.classList.remove("bi-chevron-down");
        icon.classList.add("bi-chevron-up");
    }
}


// ==========================================
// 收起所有訂單
// ==========================================
function closeAllOrderDetails() {
    const orderExtras = document.querySelectorAll(".order-extra");

    orderExtras.forEach(function (orderExtra) {
        orderExtra.style.maxHeight = "0px";
        orderExtra.classList.remove("show");

        const orderCard = orderExtra.closest(".order-card");
        const button = orderCard.querySelector(".expand-button");
        const icon = button.querySelector("i");

        icon.classList.remove("bi-chevron-up");
        icon.classList.add("bi-chevron-down");
    });
}


// ==========================================
// 點擊頁面空白處
// ==========================================
document.addEventListener("click", function (event) {
    const clickedOrderCard = event.target.closest(".order-card");

    // ==========================================
    // 點擊訂單卡片以外
    // → 收起所有訂單
    // ==========================================
    if (!clickedOrderCard) {
        closeAllOrderDetails();
    }
});












// ========================================
// 取消訂單
// ========================================

let selectedOrderNumber = null;

function cancelOrder(orderNumber) {
    selectedOrderNumber = orderNumber;

    document.getElementById("cancelOrderNumber").textContent = orderNumber;

    const modalElement = document.getElementById("cancelOrderModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


// ========================================
// 確認取消訂單
// ========================================

document.getElementById("confirmCancelButton").addEventListener("click", function () {
    if (!selectedOrderNumber) {
        return;
    }

    console.log("取消訂單：", selectedOrderNumber);

    /*
     * 未來 ASP.NET Core MVC 可以改成：
     *
     * fetch('/Order/CancelOrder', {
     *     method: 'POST',
     *     headers: {
     *         'Content-Type': 'application/json'
     *     },
     *     body: JSON.stringify({
     *         orderNumber: selectedOrderNumber
     *     })
     * });
     */

    const modalElement = document.getElementById("cancelOrderModal");
    const modal = bootstrap.Modal.getInstance(modalElement);

    modal.hide();
});


// ========================================
// 司機狀態
// ========================================

// function showDriverStatus(orderNumber) {
//     console.log("查看司機狀態：", orderNumber);

//     const modalElement = document.getElementById("driverStatusModal");
//     const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

//     modal.show();
// }
