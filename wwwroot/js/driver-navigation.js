// 司機導航頁：管理定位、路線、行程階段與即時位置分享。

// 導航與定位的執行狀態。
// 目前顯示在地圖上的導航路線。
let driverRoutePolyline = null;
// 記錄目前是否已切換為前往目的地。
let headingToDestination = false;
// 保存最近一次取得的司機座標。
let currentDriverLocation = null;
// 控制是否允許將位置分享給乘客。
let canSendLocationToPassenger = false;
// 記錄上次要求重算路線的時間。
let driverLastRouteRequestAt = 0;
// 用版本號淘汰較舊的路線計算結果。
let driverRouteRequestVersion = 0;

// 標示目前是否由假 GPS 接管定位。
let isTestRouteMode = false;
// 保存假 GPS 路線的播放計時器。
let testRouteTimer = null;
// 用版本號使舊的測試路線失效。
let testRouteRunVersion = 0;
// 避免重複綁定測試路線按鈕。
let testRouteHandlerBound = false;
// 保存 SignalR 手動重連計時器。
let driverConnectionRetryTimer = null;
// 保存 GPS 分享啟用排程。
let gpsShareScheduleTimer = null;
// 保存 Demo 倒數畫面的更新計時器。
let gpsShareCountdownTimer = null;
// 記錄是否啟用五秒分享 Demo。
let gpsShareDemoMode = false;

// 假 GPS 測試路線




// 本次行程識別資料與座標。
// 乘客上車位置，取自伺服器提供的行程資料。
const pickupLocation = {
    lat: window.tripData.pickupLat,
    lng: window.tripData.pickupLng
};

// 行程目的地，取自伺服器提供的行程資料。
const destinationLocation = {
    lat: window.tripData.destinationLat,
    lng: window.tripData.destinationLng
};
// 目前登入的司機識別碼。
const driverId =
    window.tripData.driverId;
// 組合司機與訂單，作為即時通訊的行程識別碼。
const tripSignalId =
    `${driverId}|${window.tripData.orderNo}`;
// 保存司機上線狀態時使用的 sessionStorage 鍵。
const driverOnlineStorageKey =
    `driverOnline:${driverId}`;
// 限制路線最多每三秒重新計算一次。
const driverRouteUpdateIntervalMs = 3000;
// 保存行程階段時使用的 sessionStorage 鍵。
const driverRoutePhaseStorageKey =
    `driverRoutePhase:${tripSignalId}`;
// 保存 GPS 分享狀態時使用的 sessionStorage 鍵。
const driverShareStorageKey =
    `driverShareEnabled:${tripSignalId}`;
// 保存 Demo 模式時使用的 sessionStorage 鍵。
const gpsShareDemoModeStorageKey =
    `driverGpsShareDemoMode:${tripSignalId}`;
// 正式 GPS 分享會在出發前三十分鐘開始。
const gpsShareLeadTimeMs = 30 * 60 * 1000;
// 瀏覽器 setTimeout 可接受的最大延遲。
const maxGpsShareTimerDelayMs = 2147483647;

// 從分頁工作階段還原上線、分享與行程階段。
gpsShareDemoMode =
    sessionStorage.getItem(
        gpsShareDemoModeStorageKey
    ) === "true";

canSendLocationToPassenger =
    sessionStorage.getItem(
        driverShareStorageKey
    ) === "true";

headingToDestination =
    sessionStorage.getItem(
        driverRoutePhaseStorageKey
    ) === "destination";

console.log(
    "訂單出發時間：",
    window.tripData.departureTime
);
// SignalR 負責同步司機狀態與位置，斷線時依序重試。
// 建立司機位置 Hub 的 SignalR 連線。
const connection =
    new signalR.HubConnectionBuilder()
        .withUrl("/driverLocationHub")
        .withAutomaticReconnect([
            0,
            2000,
            5000,
            10000
        ])
        .build();



// Google Maps 地圖實例。
let driverMap = null;
// 地圖上的司機位置標記。
let driverMarker = null;
// 瀏覽器持續定位監聽的識別碼。
let watchId = null;
// 快取今日已完成訂單編號，避免重複查詢。
let todayCompletedOrderNos = null;

// --- 共用狀態與清理 ---

// 遞增版本號，使尚未完成的測試路線請求失效。
function stopTestRoute() {
    ++testRouteRunVersion;

    // 有測試計時器時才需要停止並清除。
    if (testRouteTimer !== null) {
        clearInterval(testRouteTimer);
        testRouteTimer = null;
    }

    isTestRouteMode = false;
}

// 停止瀏覽器的持續定位監聽。
function stopDriverLocationWatch() {
    // 有定位監聽時才呼叫 clearWatch。
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

// --- GPS 分享排程 ---

function stopGpsShareSchedule() {
    // 有待執行的分享排程時才需要取消。
    if (gpsShareScheduleTimer !== null) {
        clearTimeout(gpsShareScheduleTimer);
        gpsShareScheduleTimer = null;
    }
}

function disableGpsSharing() {
    canSendLocationToPassenger = false;
    sessionStorage.setItem(
        driverShareStorageKey,
        "false"
    );
}

function canScheduleGpsSharing() {
    return sessionStorage.getItem(driverOnlineStorageKey) === "true" &&
        !window.tripData.isHistory &&
        window.tripData.tripStatus !== "已完成" &&
        sessionStorage.getItem(
            driverRoutePhaseStorageKey
        ) !== "completed";
}

function updateGpsShareDemoModeButton() {
    // 取得 Demo 模式切換按鈕。
    const demoModeButton =
        document.getElementById("tempyshare-btn");

    demoModeButton.textContent = gpsShareDemoMode
        ? "Demo 5 秒模式：已啟用"
        : "啟用 Demo 5 秒模式";
}

function setGpsShareCountdownText(text) {
    // 取得顯示 GPS 分享倒數的元素。
    const countdownElement =
        document.getElementById(
            "gps-share-demo-countdown"
        );

    // 倒數元素存在時才更新文字。
    if (countdownElement) {
        countdownElement.textContent = text;
    }
}

function stopGpsShareCountdown(resetText = false) {
    // 避免同時存在多個倒數更新計時器。
    if (gpsShareCountdownTimer !== null) {
        clearInterval(gpsShareCountdownTimer);
        gpsShareCountdownTimer = null;
    }

    // 呼叫端要求重設時，恢復尚未啟動的提示。
    if (resetText) {
        setGpsShareCountdownText(
            "Demo 倒數尚未啟動"
        );
    }
}

function startGpsShareCountdown(shareStartTime) {
    stopGpsShareCountdown();

    // 將分享開始時間轉為可計算的時間戳。
    const shareStartTimestamp =
        new Date(shareStartTime).getTime();

    // 集中計算並更新倒數顯示。
    const updateCountdown = () => {
        // 計算距離分享開始還剩多少整秒。
        const remainingSeconds = Math.max(
            0,
            Math.ceil(
                (shareStartTimestamp - Date.now()) /
                1000
            )
        );

        // 倒數結束時停止計時並顯示分享已開始。
        if (remainingSeconds <= 0) {
            stopGpsShareCountdown();
            setGpsShareCountdownText(
                "GPS 分享已開始"
            );
            return;
        }

        setGpsShareCountdownText(
            `GPS 分享將於 ${remainingSeconds} 秒後開始`
        );
    };

    updateCountdown();
    gpsShareCountdownTimer =
        setInterval(updateCountdown, 250);
}

// 啟用分享後，視需要立即送出最後已知位置。
async function activateGpsSharing(
    sourceLabel,
    sendCurrentLocation = true
) {
    stopGpsShareSchedule();

    // 行程狀態不允許分享時，立即關閉分享。
    if (!canScheduleGpsSharing()) {
        disableGpsSharing();
        return;
    }

    canSendLocationToPassenger = true;
    sessionStorage.setItem(
        driverShareStorageKey,
        "true"
    );

    // Demo 模式下同步更新倒數提示。
    if (gpsShareDemoMode) {
        stopGpsShareCountdown();
        setGpsShareCountdownText(
            "GPS 分享已開始"
        );
    }

    console.log(`${sourceLabel}：GPS 分享已開始`);

    // 已有位置且 SignalR 已連線時，立即送出目前位置。
    if (
        sendCurrentLocation &&
        currentDriverLocation &&
        connection.state ===
        signalR.HubConnectionState.Connected
    ) {
        try {
            await connection.invoke(
                "SendDriverLocation",
                tripSignalId,
                currentDriverLocation.lat,
                currentDriverLocation.lng
            );

            console.log(
                "GPS 分享啟用，已立即送出目前位置：",
                currentDriverLocation
            );
        }
        catch (error) {
            console.error(
                "GPS 分享啟用時傳送位置失敗：",
                error
            );
        }
    }
}

// 依指定時間啟用分享；超長延遲會分段重新排程。
async function scheduleGpsSharing(
    shareStartTime,
    sourceLabel,
    sendCurrentLocationOnImmediateStart = true
) {
    stopGpsShareSchedule();

    // 不可排程的行程必須保持停止分享。
    if (!canScheduleGpsSharing()) {
        disableGpsSharing();
        return;
    }

    // 解析預定的 GPS 分享開始時間。
    const shareStartTimestamp =
        new Date(shareStartTime).getTime();

    // 無效時間無法建立排程，因此停止分享。
    if (!Number.isFinite(shareStartTimestamp)) {
        disableGpsSharing();
        console.error(
            `${sourceLabel}：無法解析 GPS 分享開始時間`,
            shareStartTime
        );
        return;
    }

    // 計算距離預定開始時間的毫秒數。
    const remainingMs =
        shareStartTimestamp - Date.now();

    // 開始時間已到時直接啟用，不再建立計時器。
    if (remainingMs <= 0) {
        await activateGpsSharing(
            sourceLabel,
            sendCurrentLocationOnImmediateStart
        );
        return;
    }

    disableGpsSharing();

    console.log(
        `${sourceLabel}：GPS 分享將於 ${Math.ceil(remainingMs / 1000)} 秒後開始`
    );

    gpsShareScheduleTimer = setTimeout(() => {
        gpsShareScheduleTimer = null;

        void scheduleGpsSharing(
            new Date(shareStartTimestamp),
            sourceLabel,
            true
        );
    }, Math.min(remainingMs, maxGpsShareTimerDelayMs));
}

async function scheduleOfficialGpsSharing(
    sendCurrentLocationOnImmediateStart = true
) {
    // 解析本次行程的正式出發時間。
    const departureTimestamp =
        new Date(window.tripData.departureTime)
            .getTime();
    // 正式分享時間為出發時間往前推三十分鐘。
    const shareStartTime =
        new Date(
            departureTimestamp - gpsShareLeadTimeMs
        );

    await scheduleGpsSharing(
        shareStartTime,
        "正式排程（出發前 30 分鐘）",
        sendCurrentLocationOnImmediateStart
    );
}

// --- SignalR 狀態同步與連線生命週期 ---

// SignalR 完全斷線後，延遲嘗試恢復原有行程狀態。
function scheduleDriverConnectionRestart() {
    // 已有重連排程時不重複建立。
    if (driverConnectionRetryTimer !== null) {
        return;
    }

    driverConnectionRetryTimer =
        setTimeout(async () => {
            driverConnectionRetryTimer = null;

            // 司機已下線或連線不再中斷時，取消本次重連。
            if (
                sessionStorage.getItem(
                    driverOnlineStorageKey
                ) !== "true" ||
                connection.state !==
                signalR.HubConnectionState.Disconnected
            ) {
                return;
            }

            document.getElementById(
                "online-btn"
            ).disabled = false;

            // 已完成行程只需恢復完成狀態，不重新啟動定位。
            if (
                sessionStorage.getItem(
                    driverRoutePhaseStorageKey
                ) === "completed"
            ) {
                try {
                    await connection.start();
                    await restoreDriverSignalRState();
                    document.getElementById(
                        "driver-status"
                    ).textContent = "行程已完成";
                }
                catch (error) {
                    console.error(
                        "完成階段重連失敗：",
                        error
                    );
                    scheduleDriverConnectionRestart();
                }

                return;
            }

            await startDriverOnline();
        }, 5000);
}

// 重連後依 sessionStorage 重送上線與行程階段。
async function restoreDriverSignalRState() {
    // 讀取頁面重新整理前保存的上線狀態。
    const shouldBeOnline =
        sessionStorage.getItem(
            driverOnlineStorageKey
        ) === "true";

    // 僅在線上、非歷史頁且連線完成時恢復 Hub 狀態。
    if (
        !shouldBeOnline ||
        window.tripData.isHistory ||
        connection.state !==
        signalR.HubConnectionState.Connected
    ) {
        return;
    }

    await connection.invoke(
        "DriverOnline",
        driverId
    );

    // 讀取重新整理前保存的行程階段。
    const savedPhase =
        sessionStorage.getItem(
            driverRoutePhaseStorageKey
        );

    // 已接到乘客時，向 Hub 恢復前往目的地狀態。
    if (savedPhase === "destination") {
        await connection.invoke(
            "DriverArrivedPassenger",
            tripSignalId
        );
    }
    else if (savedPhase === "completed") {
        await connection.invoke(
            "DriverArrivedDestination",
            tripSignalId
        );
        return;
    }

    // 分享已啟用且有座標時，補送最近位置。
    if (
        canSendLocationToPassenger &&
        currentDriverLocation
    ) {
        await connection.invoke(
            "SendDriverLocation",
            tripSignalId,
            currentDriverLocation.lat,
            currentDriverLocation.lng
        );
    }
}

connection.onreconnecting(() => {
    // 只有原本在線的司機需要顯示重連狀態。
    if (
        sessionStorage.getItem(
            driverOnlineStorageKey
        ) === "true"
    ) {
        document.getElementById(
            "driver-status"
        ).textContent = "連線恢復中";
    }
});

connection.onreconnected(async () => {
    try {
        await restoreDriverSignalRState();

        // 重連後重新讀取目前行程階段。
        const savedPhase =
            sessionStorage.getItem(
                driverRoutePhaseStorageKey
            );

        // 完成階段保持完成畫面，不再套用上線操作介面。
        if (savedPhase === "completed") {
            document.getElementById(
                "driver-status"
            ).textContent = "行程已完成";
            return;
        }

        // 目的地階段需同步更新本機導航目標。
        if (savedPhase === "destination") {
            headingToDestination = true;
        }

        applyOnlineTripPhaseUI();
    }
    catch (error) {
        console.error(
            "SignalR 狀態恢復失敗：",
            error
        );
    }
});

connection.onclose(error => {
    // 司機主動下線後的關閉事件不需要自動重連。
    if (
        sessionStorage.getItem(
            driverOnlineStorageKey
        ) !== "true"
    ) {
        return;
    }

    console.error("SignalR 連線已中斷：", error);
    document.getElementById(
        "driver-status"
    ).textContent = "連線中斷，請重新上線";
    document.getElementById(
        "online-btn"
    ).disabled = false;
    scheduleDriverConnectionRestart();
});

// --- 地圖與路線 ---

// 限制請求頻率，並以版本號忽略過期的非同步結果。
function setDriverRouteText(elementId, text) {
    document.getElementById(elementId).textContent = text;
}

function formatDriverDistance(distanceMeters) {
    // 未滿一公里時以公尺顯示。
    if (distanceMeters < 1000) {
        return `${Math.max(0, Math.round(distanceMeters))} 公尺`;
    }

    // 十公里內保留一位小數，較長距離顯示整數公里。
    const digits = distanceMeters < 10000 ? 1 : 0;
    return `${(distanceMeters / 1000).toFixed(digits)} 公里`;
}

function formatDriverEta(durationMillis) {
    // 剩餘時間為零時直接顯示已抵達。
    if (durationMillis <= 0) {
        return "已抵達";
    }

    // 將毫秒換算為至少一分鐘的預估時間。
    const minutes = Math.max(
        1,
        Math.ceil(durationMillis / 60000)
    );
    // 計算預估抵達的實際時刻。
    const arrivalTime =
        new Date(Date.now() + durationMillis)
            .toLocaleTimeString(
                "zh-TW",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    return `約 ${minutes} 分鐘（${arrivalTime} 抵達）`;
}

async function drawDriverRoute(
    currentLocation,
    targetLocation,
    targetLabel,
    force = false
) {
    // 地圖尚未建立時無法繪製路線。
    if (!driverMap) {
        return;
    }

    // 取得本次路線請求的時間。
    const now = Date.now();

    // 非強制更新且間隔過短時略過重算。
    if (
        !force &&
        now - driverLastRouteRequestAt <
        driverRouteUpdateIntervalMs
    ) {
        return;
    }

    driverLastRouteRequestAt = now;
    // 為本次路線請求配置唯一版本。
    const requestVersion =
        ++driverRouteRequestVersion;

    setDriverRouteText(
        "driver-route-target",
        targetLabel
    );

    try {
        // 載入 Google Maps 路線功能。
        const { Route } =
            await google.maps.importLibrary("routes");
        // 向 Google Maps 取得含交通資訊的行車路線。
        const response =
            await Route.computeRoutes({
                origin: currentLocation,
                destination: targetLocation,
                travelMode: "DRIVING",
                routingPreference: "TRAFFIC_AWARE",
                fields: [
                    "path",
                    "distanceMeters",
                    "durationMillis"
                ]
            });

        // 已有較新的請求時忽略這份舊結果。
        if (
            requestVersion !==
            driverRouteRequestVersion
        ) {
            return;
        }

        // 沒有任何候選路線時交由錯誤流程處理。
        if (!response.routes.length) {
            throw new Error("找不到司機端路線");
        }

        // 採用回傳結果中的第一條路線。
        const route = response.routes[0];

        // 繪製新路線前先移除舊折線。
        if (driverRoutePolyline) {
            driverRoutePolyline.setMap(null);
        }

        driverRoutePolyline =
            new google.maps.Polyline({
                map: driverMap,
                path: route.path,
                strokeColor: "#198754",
                strokeOpacity: 0.85,
                strokeWeight: 5
            });

        // 建立涵蓋整條路線的地圖邊界。
        const bounds =
            new google.maps.LatLngBounds();

        route.path.forEach(point => {
            bounds.extend(point);
        });

        // 有效邊界才可用來調整地圖視野。
        if (!bounds.isEmpty()) {
            driverMap.fitBounds(bounds, 60);
        }

        setDriverRouteText(
            "driver-route-distance",
            formatDriverDistance(
                route.distanceMeters ?? 0
            )
        );
        setDriverRouteText(
            "driver-route-eta",
            formatDriverEta(
                route.durationMillis ?? 0
            )
        );
    }
    catch (error) {
        // 舊請求的錯誤不應覆蓋新請求的畫面。
        if (
            requestVersion !==
            driverRouteRequestVersion
        ) {
            return;
        }

        console.error("司機端路線計算失敗：", error);
        setDriverRouteText(
            "driver-route-distance",
            "暫時無法取得"
        );
        setDriverRouteText(
            "driver-route-eta",
            "暫時無法取得"
        );
    }
}

async function drawRouteToPickup(
    currentLocation,
    force = false
) {
    await drawDriverRoute(
        currentLocation,
        pickupLocation,
        "乘客上車位置",
        force
    );
}

async function drawRouteToDestination(
    currentLocation,
    force = false
) {
    await drawDriverRoute(
        currentLocation,
        destinationLocation,
        "目的地",
        force
    );
}


// 建立地圖並顯示本次行程費用。
function initDriverMap() {

    // 地圖初始中心點，尚未定位前使用。
    const defaultLocation = {
        lat: 24.1477,
        lng: 120.6736
    };


    driverMap =
        new google.maps.Map(
            document.getElementById("driver-map"),
            {
                center: defaultLocation,
                zoom: 15
            }
        );

    window.updateTripFareDisplay(
        window.tripData,
        "driver-trip-fare"
    );

}

// --- 訂單導覽 ---

// 今日完成訂單僅在本頁載入一次，完成新訂單後再清除快取。
async function getTodayCompletedOrderNos() {
    // 已有完成訂單快取時直接回傳。
    if (todayCompletedOrderNos !== null) {
        return todayCompletedOrderNos;
    }

    // 向後端查詢今日完成的訂單。
    const response = await fetch(
        "/DriverNavigation/TodayCompletedOrders",
        {
            headers: {
                Accept: "application/json"
            }
        }
    );

    // 後端回應失敗時交由呼叫端處理。
    if (!response.ok) {
        throw new Error("無法取得今日完成訂單");
    }

    // 解析後端回傳的訂單資料。
    const result = await response.json();

    todayCompletedOrderNos = Array.isArray(result.orders)
        ? result.orders
        : [];

    return todayCompletedOrderNos;
}

function openHistoryOrder(orderNo, replace = false) {
    // 產生指定歷史訂單的頁面網址。
    const url =
        `/DriverNavigation/HistoryOrder?orderNo=${encodeURIComponent(orderNo)}`;

    // 需要取代目前歷史項目時使用 replace 導航。
    if (replace) {
        window.location.replace(url);
        return;
    }

    window.location.href = url;
}

// 依目前訂單位置設定「上一筆／下一筆」按鈕狀態。
async function initializeOrderNavigation() {
    try {
        // 取得按時間排序的今日完成訂單。
        const orders = await getTodayCompletedOrderNos();
        // 取得「上一筆」按鈕以更新可用狀態。
        const lastOrderButton =
            document.getElementById("last-order-btn");
        // 取得「下一頁」按鈕以更新可用狀態。
        const nextPageButton =
            document.getElementById("nextpage-order-btn");

        // 歷史頁需依目前訂單位置控制前後導覽。
        if (window.tripData.isHistory) {
            // 取得目前網址路徑以識別舊版入口。
            const path = window.location.pathname.toLowerCase();

            // 將舊的 offset 頁面導向固定排序後的同一筆訂單。
            // 舊版 offset 網址需轉換為固定訂單網址。
            if (path.endsWith("/lastorder") && orders.length > 0) {
                // 讀取舊網址要求的訂單位移量。
                const requestedOffset = Number.parseInt(
                    new URLSearchParams(window.location.search)
                        .get("offset") ?? "0",
                    10
                );
                // 將位移量限制在有效訂單範圍內。
                const safeOffset =
                    Number.isInteger(requestedOffset) &&
                        requestedOffset >= 0 &&
                        requestedOffset < orders.length
                        ? requestedOffset
                        : 0;
                // 取得位移量對應的正式訂單編號。
                const canonicalOrderNo = orders[safeOffset];

                // 網址訂單不同時導向正確的固定訂單頁。
                if (canonicalOrderNo !== window.tripData.orderNo) {
                    openHistoryOrder(canonicalOrderNo, true);
                    return;
                }
            }

            // 找出目前歷史訂單在完成清單中的位置。
            const currentIndex =
                orders.indexOf(window.tripData.orderNo);

            lastOrderButton.disabled =
                currentIndex < 0 ||
                currentIndex >= orders.length - 1;
            nextPageButton.disabled = currentIndex < 0;
            return;
        }

        // 目前訂單已完成時，只需設定歷史導覽入口。
        if (window.tripData.tripStatus === "已完成") {
            // 找出已完成的目前訂單位置。
            const currentIndex =
                orders.indexOf(window.tripData.orderNo);

            lastOrderButton.disabled =
                currentIndex < 0 ||
                currentIndex >= orders.length - 1;
            return;
        }

        lastOrderButton.disabled = orders.length === 0;
    }
    catch (error) {
        console.error("初始化今日完成訂單導覽失敗：", error);
    }
}

// 歷史模式只提供查閱，不允許定位或變更行程。
function applyHistoryModeUI() {
    // 非歷史頁不套用唯讀介面。
    if (!window.tripData.isHistory) {
        return;
    }

    document.getElementById("online-btn").disabled = true;
    document.getElementById("offline-btn").disabled = true;
    document.getElementById("arrived-passenger-btn").disabled = true;
    document.getElementById("arrived-destination-btn").disabled = true;
    document.getElementById("next-order-btn").disabled = true;
    document.getElementById("next-order-btn").style.display = "none";
    document.getElementById("nextpage-order-btn").style.display = "inline-block";
    document.getElementById("driver-status").textContent = "歷史模式";
    setDriverRouteText(
        "driver-route-target",
        "歷史訂單"
    );
    setDriverRouteText(
        "driver-route-distance",
        "不適用"
    );
    setDriverRouteText(
        "driver-route-eta",
        "不適用"
    );
}

// 依「前往乘客／前往目的地」階段更新操作按鈕。
function applyOnlineTripPhaseUI() {
    document.getElementById(
        "online-btn"
    ).disabled = true;

    // 前往目的地階段需停用回頭或下線操作。
    if (headingToDestination) {
        document.getElementById(
            "offline-btn"
        ).disabled = true;
        document.getElementById(
            "arrived-passenger-btn"
        ).disabled = true;
        document.getElementById(
            "arrived-destination-btn"
        ).disabled = false;
        document.getElementById(
            "driver-status"
        ).textContent = "前往目的地";
        return;
    }

    document.getElementById(
        "offline-btn"
    ).disabled = false;
    document.getElementById(
        "arrived-passenger-btn"
    ).disabled = window.tripData.isHistory;
    document.getElementById(
        "arrived-destination-btn"
    ).disabled = true;
    document.getElementById(
        "driver-status"
    ).textContent = "上線中";
}


// --- 司機上線與定位 ---

// 建立連線、安排 GPS 分享，並啟動真實或測試定位。
async function startDriverOnline() {
    // 歷史訂單不能重新上線。
    if (window.tripData.isHistory) {
        applyHistoryModeUI();
        return;
    }

    // 取得上線按鈕以控制重複操作。
    const onlineButton =
        document.getElementById("online-btn");

    // 按鈕已停用表示上線流程正在執行或已完成。
    if (onlineButton.disabled) {
        return;
    }

    // 重新上線時取消先前尚未執行的重連排程。
    if (driverConnectionRetryTimer !== null) {
        clearTimeout(driverConnectionRetryTimer);
        driverConnectionRetryTimer = null;
    }

    onlineButton.disabled = true;

    headingToDestination =
        sessionStorage.getItem(
            driverRoutePhaseStorageKey
        ) === "destination";

    setDriverRouteText(
        "driver-route-target",
        headingToDestination
            ? "目的地"
            : "乘客上車位置"
    );
    setDriverRouteText(
        "driver-route-distance",
        "計算中"
    );
    setDriverRouteText(
        "driver-route-eta",
        "計算中"
    );




    // 如果 SignalR 已經斷線，重新連線
    // SignalR 處於斷線狀態時才重新啟動連線。
    if (
        connection.state ===
        signalR.HubConnectionState.Disconnected
    ) {
        try {
            await connection.start();
            console.log("SignalR 連線成功");
        }
        catch (error) {
            console.error(
                "SignalR 連線失敗：",
                error
            );

            onlineButton.disabled = false;
            return;
        }
    }




    sessionStorage.setItem(
        driverOnlineStorageKey,
        "true"
    );

    // Demo 模式使用手動五秒排程，不啟動正式排程。
    if (gpsShareDemoMode) {
        stopGpsShareSchedule();

        // 尚未開始分享時顯示等待測試按鈕。
        if (!canSendLocationToPassenger) {
            disableGpsSharing();
            setGpsShareCountdownText(
                "等待按下 5 秒自動分享按鈕"
            );
        }
        else {
            setGpsShareCountdownText(
                "GPS 分享已開始"
            );
        }

        console.log(
            "Demo 5 秒模式：等待測試按鈕啟動排程"
        );
    }
    else {
        stopGpsShareCountdown(true);

        // F5 恢復與一般上線都重新依真實出發時間安排。
        // 此處由 restoreDriverSignalRState 負責送出當下位置，
        // 避免重連流程重複傳送同一筆 GPS。
        await scheduleOfficialGpsSharing(false);
    }

    try {
        await restoreDriverSignalRState();
    }
    catch (error) {
        console.error(
            "SignalR 上線狀態傳送失敗：",
            error
        );
        stopGpsShareSchedule();
        stopGpsShareCountdown(true);
        disableGpsSharing();
        document.getElementById(
            "driver-status"
        ).textContent = "連線失敗，請重新上線";
        onlineButton.disabled = false;
        return;
    }


    // 瀏覽器不支援定位時停止上線流程。
    if (!navigator.geolocation) {

        alert("目前瀏覽器不支援定位功能");

        stopGpsShareSchedule();
        stopGpsShareCountdown(true);
        disableGpsSharing();
        onlineButton.disabled = false;
        return;
    }
    // 沿 Google 計算的路徑模擬司機移動。
    async function startTestRoute() {
        stopTestRoute();
        isTestRouteMode = true;
        // 記錄此次測試執行版本，以識別過期結果。
        const runVersion = testRouteRunVersion;

        try {
            // 載入測試路線所需的 Google Maps 功能。
            const { Route } =
                await google.maps.importLibrary("routes");

            // 假設司機一開始在台大醫院南方一點
            // 設定假 GPS 的模擬起點。
            const testStartLocation = {
                lat: 25.0388,
                lng: 121.5152
            };

            // 先請 Google 算出
            // 測試起點 → 台大醫院 的真正行車路線
            // 計算模擬起點到乘客位置的實際行車路線。
            const response =
                await Route.computeRoutes({
                    origin: testStartLocation,
                    destination: pickupLocation,
                    travelMode: "DRIVING",
                    fields: ["path"]
                });

            // 測試已被停止或重開時忽略舊路線結果。
            if (runVersion !== testRouteRunVersion) {
                return;
            }

            // 找不到測試路線時結束模擬。
            if (!response.routes.length) {
                console.log("找不到測試路線");
                stopTestRoute();
                return;
            }

            // 取得模擬移動所使用的路徑點。
            const testPath =
                response.routes[0].path;

            // 記錄目前播放到的路徑點位置。
            let testIndex = 0;

            testRouteTimer =
                setInterval(() => {

                    // 所有路徑點播放完畢時結束測試。
                    if (testIndex >= testPath.length) {

                        clearInterval(testRouteTimer);
                        testRouteTimer = null;
                        isTestRouteMode = false;

                        // 有最後位置時恢復正式導航路線。
                        if (currentDriverLocation) {
                            // 依目前行程階段選擇恢復的導航目標。
                            if (headingToDestination) {
                                drawRouteToDestination(
                                    currentDriverLocation,
                                    true
                                );
                            }
                            else {
                                drawRouteToPickup(
                                    currentDriverLocation,
                                    true
                                );
                            }
                        }

                        console.log(
                            "測試司機已抵達台大醫院"
                        );

                        return;
                    }

                    // 取得本次模擬要移動到的路徑點。
                    const point =
                        testPath[testIndex];

                    // 取出模擬路徑點的緯度。
                    const lat = point.lat;
                    // 取出模擬路徑點的經度。
                    const lng = point.lng;

                    // 組成本次模擬的司機座標。
                    const currentLocation = {
                        lat: lat,
                        lng: lng
                    };

                    currentDriverLocation =
                        currentLocation;

                    document.getElementById(
                        "driver-lat"
                    ).textContent = lat;

                    document.getElementById(
                        "driver-lng"
                    ).textContent = lng;


                    // 移動司機 Marker
                    // 尚無司機標記時建立新的 Marker。
                    if (!driverMarker) {

                        driverMarker =
                            new google.maps.Marker({
                                map: driverMap,
                                position: currentLocation,
                                title: "司機位置"
                            });

                    }
                    else {

                        driverMarker.setPosition(
                            currentLocation
                        );

                    }


                    driverMap.setCenter(
                        currentLocation
                    );


                    // 依行程階段更新前往乘客或目的地的路線。
                    if (headingToDestination) {
                        drawRouteToDestination(
                            currentLocation
                        );
                    }
                    else {
                        drawRouteToPickup(
                            currentLocation
                        );
                    }


                    // 傳給乘客
                    // 允許分享且連線正常時送出模擬位置。
                    if (
                        canSendLocationToPassenger &&
                        connection.state ===
                        signalR.HubConnectionState.Connected
                    ) {

                        connection.invoke(
                            "SendDriverLocation",
                            tripSignalId,
                            lat,
                            lng
                        ).catch(error => {
                            console.error(
                                "測試 GPS 傳送失敗：",
                                error
                            );
                        });

                    }


                    testIndex++;

                }, 500);
        }
        catch (error) {
            // 只有目前仍有效的測試發生錯誤時才停止它。
            if (runVersion === testRouteRunVersion) {
                stopTestRoute();
            }

            console.error("測試路線啟動失敗：", error);
        }
    }


    // 避免每次重新上線都重複綁定測試按鈕。
    // 測試按鈕只綁定一次，避免一次點擊啟動多條路線。
    if (!testRouteHandlerBound) {
        document
            .getElementById("temproute-btn")
            .addEventListener("click", function () {
                // 司機必須先上線才能執行測試路線。
                if (
                    sessionStorage.getItem(
                        driverOnlineStorageKey
                    ) !== "true"
                ) {
                    alert("請先按下上線，再執行測試路線");
                    return;
                }

                // 已完成的訂單禁止再次執行測試。
                if (
                    sessionStorage.getItem(
                        driverRoutePhaseStorageKey
                    ) === "completed"
                ) {
                    alert("此訂單已完成，無法再次執行測試路線");
                    return;
                }

                startTestRoute();
            });

        testRouteHandlerBound = true;
    }
    // 切回真實 GPS 前，先移除既有監聽。
    stopDriverLocationWatch();

    watchId =
        navigator.geolocation.watchPosition(

            function (position) {
                // 假 GPS 執行期間忽略真實定位回報。
                if (isTestRouteMode) {
                    return;
                }

                // 讀取裝置回報的緯度。
                const lat =
                    position.coords.latitude;

                // 讀取裝置回報的經度。
                const lng =
                    position.coords.longitude;

                // 組成最新的真實司機座標。
                const currentLocation = {
                    lat: lat,
                    lng: lng
                };

                currentDriverLocation = currentLocation;

                // 依行程階段更新真實位置的導航目標。
                if (headingToDestination) {
                    drawRouteToDestination(currentLocation);
                }
                else {
                    drawRouteToPickup(currentLocation);
                }






                document.getElementById(
                    "driver-lat"
                ).textContent = lat;


                document.getElementById(
                    "driver-lng"
                ).textContent = lng;


                // 第一次取得真實位置時建立司機標記。
                if (!driverMarker) {

                    driverMarker =
                        new google.maps.Marker({
                            map: driverMap,
                            position: currentLocation,
                            title: "司機位置"
                        });

                }
                else {

                    driverMarker.setPosition(
                        currentLocation
                    );

                }


                driverMap.setCenter(
                    currentLocation
                );


                // =========================
                // SignalR 傳送司機 GPS
                // =========================

                // 允許分享且連線正常時送出真實位置。
                if (
                    canSendLocationToPassenger && connection.state ===
                    signalR.HubConnectionState.Connected
                ) {

                    connection.invoke(
                        "SendDriverLocation",
                        tripSignalId,
                        lat,
                        lng
                    )
                        .then(() => {

                            console.log(
                                "GPS 已傳送到 SignalR：",
                                driverId,
                                lat,
                                lng
                            );

                        })
                        .catch(error => {

                            console.error(
                                "GPS 傳送失敗：",
                                error
                            );

                        });

                }
                else {

                    console.log(
                        "SignalR 尚未連線，暫時不傳 GPS"
                    );

                }

            },


            function (error) {

                console.error(
                    "定位失敗：",
                    error
                );

            },


            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        );


    applyOnlineTripPhaseUI();


    sessionStorage.setItem(
        driverOnlineStorageKey,
        "true"
    );

}

// --- 事件綁定 ---

// Demo：驗證共用排程會在 5 秒後自動啟用 GPS 分享
// 取得五秒後自動分享 GPS 的測試按鈕。
const demoAutoShareButton =
    document.getElementById("tempnshare-btn");

demoAutoShareButton.textContent =
    "測試 5 秒後自動分享 GPS";

demoAutoShareButton.addEventListener(
    "click",
    async function () {
        // 測試分享前必須確認司機已上線。
        if (
            sessionStorage.getItem(driverOnlineStorageKey) !==
            "true"
        ) {
            alert("請先按下上線，再測試自動分享 GPS");
            return;
        }

        // 五秒測試只允許在 Demo 模式執行。
        if (!gpsShareDemoMode) {
            alert("請先下線並啟用 Demo 5 秒模式");
            return;
        }

        // 已完成或不可用的行程不能啟動分享排程。
        if (!canScheduleGpsSharing()) {
            alert("此訂單已完成，無法再次分享 GPS");
            return;
        }

        // 設定五秒後的測試分享時間。
        const testShareStartTime =
            new Date(Date.now() + 5 * 1000);

        await scheduleGpsSharing(
            testShareStartTime,
            "Demo 5 秒排程"
        );

        startGpsShareCountdown(
            testShareStartTime
        );
    }
);

// Demo 模式必須在上線前啟用，避免正式排程先送出 GPS。
// 取得 Demo 模式切換按鈕。
const gpsShareDemoModeButton =
    document.getElementById("tempyshare-btn");

updateGpsShareDemoModeButton();

gpsShareDemoModeButton.addEventListener(
    "click",
    function () {
        // 上線期間禁止切換 Demo 模式。
        if (
            sessionStorage.getItem(driverOnlineStorageKey) ===
            "true"
        ) {
            alert("請先下線，再切換 Demo 模式");
            return;
        }

        gpsShareDemoMode = !gpsShareDemoMode;
        sessionStorage.setItem(
            gpsShareDemoModeStorageKey,
            gpsShareDemoMode ? "true" : "false"
        );

        stopGpsShareSchedule();
        stopGpsShareCountdown(true);
        disableGpsSharing();
        updateGpsShareDemoModeButton();

        console.log(
            gpsShareDemoMode
                ? "Demo 5 秒模式已啟用；上線後不執行正式排程"
                : "Demo 5 秒模式已停用；下次上線恢復正式排程"
        );
    }
);

document
    .getElementById("online-btn")
    .addEventListener("click", async function () {
        await startDriverOnline();
    });

// 抵達乘客後，將導航目標切換為目的地。
document
    .getElementById("arrived-passenger-btn")
    .addEventListener("click", async function () {

        headingToDestination = true;
        sessionStorage.setItem(
            driverRoutePhaseStorageKey,
            "destination"
        );

        // 已有司機位置時立即改畫目的地路線。
        if (currentDriverLocation) {
            drawRouteToDestination(
                currentDriverLocation,
                true
            );
        }

        try {
            // SignalR 已連線時立即通知乘客端行程階段變更。
            if (
                connection.state ===
                signalR.HubConnectionState.Connected
            ) {
                await connection.invoke(
                    "DriverArrivedPassenger",
                    tripSignalId
                );
            }
        }
        catch (error) {
            console.error(
                "抵達乘客事件傳送失敗，重連後會重送：",
                error
            );
        }

        document.getElementById(
            "driver-status"
        ).textContent = "前往目的地";
        document.getElementById(
            "arrived-passenger-btn"
        ).disabled = true;
        document.getElementById(
            "arrived-destination-btn"
        ).disabled = false;

        document.getElementById(
            "offline-btn"
        ).disabled = true;
    });

// 抵達目的地後，先完成後端訂單，再停止定位與分享。
document
    .getElementById("arrived-destination-btn")
    .addEventListener("click", async function () {
        // 保存被點擊的完成按鈕，供失敗時恢復。
        const completeButton = this;
        // 取得完成訂單 POST 所需的防偽權杖。
        const antiForgeryToken =
            document.querySelector(
                "#driver-antiforgery-form " +
                "input[name='__RequestVerificationToken']"
            )?.value;

        // 缺少權杖時禁止送出完成訂單請求。
        if (!antiForgeryToken) {
            alert("缺少安全驗證資料，請重新整理頁面");
            return;
        }

        completeButton.disabled = true;

        // 預先宣告回應，供請求完成後統一檢查。
        let response;

        try {
            // 組成後端完成訂單端點需要的表單資料。
            const requestBody =
                new URLSearchParams({
                    orderNo:
                        window.tripData.orderNo,
                    __RequestVerificationToken:
                        antiForgeryToken
                });

            response = await fetch(
                "/DriverNavigation/CompleteTrip",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },
                    body: requestBody.toString()
                }
            );
        }
        catch (error) {
            console.error("完成訂單請求失敗：", error);
            alert("訂單完成狀態更新失敗");
            completeButton.disabled = false;
            return;
        }

        // 後端未成功完成訂單時恢復按鈕。
        if (!response.ok) {
            alert("訂單完成狀態更新失敗");
            completeButton.disabled = false;
            return;
        }

        window.tripData.tripStatus = "已完成";

        document.getElementById(
            "order-status"
        ).textContent = "已完成";

        stopGpsShareSchedule();
        stopGpsShareCountdown(true);
        disableGpsSharing();
        stopTestRoute();
        stopDriverLocationWatch();
        ++driverRouteRequestVersion;
        sessionStorage.setItem(
            driverRoutePhaseStorageKey,
            "completed"
        );

        // 行程完成後移除地圖上的導航折線。
        if (driverRoutePolyline) {
            driverRoutePolyline.setMap(null);
            driverRoutePolyline = null;
        }

        setDriverRouteText(
            "driver-route-target",
            "已抵達目的地"
        );
        setDriverRouteText(
            "driver-route-distance",
            "0 公尺"
        );
        setDriverRouteText(
            "driver-route-eta",
            "已抵達"
        );

        try {
            // 連線正常時通知乘客端已抵達目的地。
            if (
                connection.state ===
                signalR.HubConnectionState.Connected
            ) {
                await connection.invoke(
                    "DriverArrivedDestination",
                    tripSignalId
                );
            }
        }
        catch (error) {
            console.error(
                "送達事件傳送失敗，重連後會重送：",
                error
            );
        }

        document.getElementById(
            "driver-status"
        ).textContent = "行程已完成";
        document.getElementById(
            "arrived-destination-btn"
        ).disabled = true;

        document.getElementById(
            "offline-btn"
        ).disabled = false;

        document.getElementById(
            "next-order-btn"
        ).disabled = false;

        todayCompletedOrderNos = null;
        await initializeOrderNavigation();












    });

// 下線時停止所有排程、測試、定位與即時連線。
document
    .getElementById("offline-btn")
    .addEventListener("click", async function () {
        sessionStorage.setItem(
            driverOnlineStorageKey,
            "false"
        );

        stopGpsShareSchedule();
        stopGpsShareCountdown(true);
        disableGpsSharing();
        stopTestRoute();
        stopDriverLocationWatch();

        try {
            await connection.stop();
        }
        catch (error) {
            console.error("SignalR 下線失敗：", error);
        }

        document.getElementById(
            "driver-status"
        ).textContent = "已下線";

        ++driverRouteRequestVersion;
        setDriverRouteText(
            "driver-route-distance",
            "暫停更新"
        );
        setDriverRouteText(
            "driver-route-eta",
            "暫停更新"
        );

        document.getElementById(
            "online-btn"
        ).disabled = false;

        document.getElementById(
            "offline-btn"
        ).disabled = true;

        document.getElementById(
            "next-order-btn"
        ).disabled = true;
        document.getElementById(
            "arrived-passenger-btn"
        ).disabled = true;
        document.getElementById(
            "arrived-destination-btn"
        ).disabled = true;
    });


document
    .getElementById("next-order-btn")
    .addEventListener("click", async function () {

        // 查詢是否還有下一筆待執行訂單。
        const response =
            await fetch(
                "/DriverNavigation/HasNextOrder"
            );

        // 解析下一筆訂單查詢結果。
        const result =
            await response.json();

        // 沒有下一筆訂單時留在目前頁面。
        if (!result.hasNextOrder) {

            alert("今日已無訂單");

            return;
        }

        window.location.href =
            "/DriverNavigation/Navigation";
    });

document
    .getElementById("last-order-btn")
    .addEventListener("click", async function () {

        try {
            // 取得今日完成訂單供向前查閱。
            const orders = await getTodayCompletedOrderNos();

            // 沒有完成訂單時無法開啟上一筆。
            if (orders.length === 0) {
                alert("今日尚無已完成訂單");
                return;
            }

            // 歷史頁或已完成頁需從目前位置往更早訂單移動。
            if (
                window.tripData.isHistory ||
                window.tripData.tripStatus === "已完成"
            ) {
                // 找出目前訂單在完成清單中的位置。
                const currentIndex =
                    orders.indexOf(window.tripData.orderNo);
                // 較早一筆位於目前項目的下一個索引。
                const olderIndex = currentIndex + 1;

                // 目前已是最早訂單時停止導覽。
                if (
                    currentIndex < 0 ||
                    olderIndex >= orders.length
                ) {
                    alert("今日已無更早的完成訂單");
                    return;
                }

                openHistoryOrder(orders[olderIndex]);
                return;
            }

            openHistoryOrder(orders[0]);
        }
        catch (error) {
            console.error("查詢上一筆今日完成訂單失敗：", error);
            alert("查詢今日完成訂單失敗，請稍後再試");
        }
    });

document
    .getElementById("nextpage-order-btn")
    .addEventListener("click", async function () {

        try {
            // 取得完成訂單清單供向較新方向導覽。
            const orders = await getTodayCompletedOrderNos();
            // 找出目前歷史訂單的位置。
            const currentIndex =
                orders.indexOf(window.tripData.orderNo);

            // 目前訂單不在清單時無法判斷下一頁。
            if (currentIndex < 0) {
                alert("目前訂單不在今日完成訂單中");
                return;
            }

            // 清單中有較新的完成訂單時直接開啟。
            if (currentIndex > 0) {
                openHistoryOrder(orders[currentIndex - 1]);
                return;
            }

            // 已到最新完成訂單時，再查詢是否有待執行訂單。
            const response =
                await fetch(
                    "/DriverNavigation/HasNextOrder"
                );

            // 解析待執行訂單查詢結果。
            const result =
                await response.json();

            // 有待執行訂單時返回即時導航頁。
            if (result.hasNextOrder) {

                window.location.href =
                    "/DriverNavigation/Navigation";

                return;
            }

            alert("今日已無訂單");
        }
        catch (error) {
            console.error("查詢下一筆今日完成訂單失敗：", error);
            alert("查詢今日完成訂單失敗，請稍後再試");
        }
    });

// 重新整理頁面後，自動恢復先前的上線狀態。
window.addEventListener(
    "load",
    async function () {

        // 讀取頁面重新整理前的司機上線狀態。
        const wasOnline =
            sessionStorage.getItem(
                driverOnlineStorageKey
            ) === "true";

        // 原本在線且非歷史頁時自動恢復上線。
        if (wasOnline && !window.tripData.isHistory) {

            console.log(
                "偵測到司機原本在線，自動恢復上線"
            );

            await startDriverOnline();

        }

    }
);

// --- 初始化 ---

// 初始化目前模式與訂單導覽。
applyHistoryModeUI();
initializeOrderNavigation();

// 提供給 Google Maps callback 呼叫。
window.initDriverMap =
    initDriverMap;




