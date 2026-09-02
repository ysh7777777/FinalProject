
// DOMContentLoaded -> 載入 HTML 結構，可以開始操作網頁上的元素
document.addEventListener("DOMContentLoaded", async function () {
    const statusTabs = document.querySelectorAll(".order-tab");
    const orderCards = document.querySelectorAll(".order-card");

    // 檢查登入狀態
    const response = await fetch('/api/auth/me');
    const auth = await response.json();
    if (!auth.isAuthenticated) {
        window.location.href = '/Login';
        return;
    }
    // 取得乘客帳號
    const userId = auth.userId;

    // ===================== 訂單篩選 =====================
    // 舊版(沒有針對未有訂單的情況)
    /* 
    function filterOrders(status) {
        orderCards.forEach(function (card) {
            const orderStatus = card.dataset.orderStatus;

            // 進行中 processing + pending 
            if (status === "processing" && (orderStatus === "行程中" || orderStatus === "待執行"))
            { card.style.display = ""; }

            // 已完成 completed
            else if (status === "completed" && orderStatus === "已完成")
            { card.style.display = ""; }

            // 已取消 cancelled
            else if ( status === "cancelled" && orderStatus === "已取消" )
            { card.style.display = ""; }

            // 不符合 → 隱藏
            else { card.style.display = "none"; }
        });
    }
    */
    // 新版(增加無訂單的情況)
    function filterOrders(status) {
        let visibleCount = 0;

        orderCards.forEach(function (card) {
            const orderStatus = card.dataset.orderStatus;

            let shouldShow = false;

            // 進行中：行程中 + 待執行
            if ( status === "processing" && (orderStatus === "行程中" || orderStatus === "待執行") )
            { shouldShow = true; }

            // 已完成
            else if ( status === "completed" && orderStatus === "已完成" )
            { shouldShow = true; }

            // 已取消
            else if ( status === "cancelled" && orderStatus === "已取消" )
            { shouldShow = true; }

            // 顯示 / 隱藏
            if (shouldShow) { card.style.display = ""; visibleCount++; }
            else { card.style.display = "none"; }
        });

        // 顯示 / 隱藏「沒有訂單」訊息
        const noOrdersMessage = document.getElementById("noOrdersMessage");

        if (visibleCount === 0) { noOrdersMessage.style.display = ""; }
        else { noOrdersMessage.style.display = "none"; }
    }



    // ===================== 點擊頁籤 =====================
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

    // 第一次載入頁面 預設顯示「進行中」
    filterOrders("processing");
});


// ===================== 展開 / 收起訂單 =====================
function toggleOrder(button) {
    const orderCard = button.closest(".order-card");
    const orderExtra = orderCard.querySelector(".order-extra");
    const icon = button.querySelector("i");

    const isOpen = orderExtra.classList.contains("show");

    // 如果目前是展開 → 收起
    if (isOpen) {
        orderExtra.style.maxHeight = "0px";
        orderExtra.classList.remove("show");

        icon.classList.remove("bi-chevron-up");
        icon.classList.add("bi-chevron-down");
    }

    // 如果目前是收起 → 展開
    else {
        orderExtra.style.maxHeight = orderExtra.scrollHeight + "px";
        orderExtra.classList.add("show");

        icon.classList.remove("bi-chevron-down");
        icon.classList.add("bi-chevron-up");
    }
}


// ===================== 收起所有訂單 =====================
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


// ===================== 點擊頁面空白處 =====================
document.addEventListener("click", function (event) {
    const clickedOrderCard = event.target.closest(".order-card");

    // 點擊訂單卡片以外 → 收起所有訂單
    if (!clickedOrderCard) {
        closeAllOrderDetails();
    }
});



// =====================「前端」：點擊「取消訂單」=====================
let selectedOrderNumber = null;
function cancelOrder(orderNumber) {
    selectedOrderNumber = orderNumber;

    document.getElementById("cancelOrderNumber").textContent = orderNumber;

    const modalElement = document.getElementById("cancelOrderModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
}


// =====================「前端」：點擊 Modal 視窗的「確定取消」-> 確認取消訂單 =====================
function confirmCancelOrder() {
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

    if (modal) {
        modal.hide();
    }
}

// =====================「後端」：真的呼叫 Controller -> 會更改資料庫的狀態欄 =====================
async function confirmCancelOrder() {
    if (!selectedOrderNumber) {
        return;
    }

    try {
        const response = await fetch('/ClientHistory_New/CancelOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderNumber: selectedOrderNumber
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            alert(result.message || "取消訂單失敗");
            return;
        }

        alert("訂單取消成功");

        // 關閉 Modal
        const modalElement = document.getElementById("cancelOrderModal");
        const modal = bootstrap.Modal.getInstance(modalElement);

        if (modal) { modal.hide(); }

        // 重新載入訂單列表
        location.reload();

    } catch (error) {
        console.error("取消訂單錯誤：", error);
        alert("取消訂單時發生錯誤");
    }
}

// [ValidateAntiForgeryToken] 版本 -> 防止 CSRF(跨站請求偽造) 用
/* 
    async function confirmCancelOrder() {
        if (!selectedOrderNumber) 
        { return; }

        try {
            const token = document.querySelector( 'input[name="__RequestVerificationToken"]' ).value;

            const response = await fetch('/ClientHistory_New/CancelOrder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify({ orderNumber: selectedOrderNumber })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                alert(result.message || "取消訂單失敗");
                return;
            }

            alert("訂單取消成功");

            const modalElement = document.getElementById("cancelOrderModal");
            const modal = bootstrap.Modal.getInstance(modalElement);

            if (modal) { modal.hide(); }

            location.reload();

        } catch (error) {
            console.error("取消訂單錯誤：", error);
            alert("取消訂單時發生錯誤");
        }
    }
*/



// ========================================
// 司機狀態
// ========================================

// function showDriverStatus(orderNumber) {
//     console.log("查看司機狀態：", orderNumber);

//     const modalElement = document.getElementById("driverStatusModal");
//     const modal = bootstrap.Modal.getOrCreateInstance(modalElement);

//     modal.show();
// }



