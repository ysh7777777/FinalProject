// JavaScript for Navigation view

let driverRoutePolyline = null;
let headingToDestination = false;
let currentDriverLocation = null;
let canSendLocationToPassenger = false;
let driverLastRouteRequestAt = 0;
let driverRouteRequestVersion = 0;

let isTestRouteMode = false;
let testRouteTimer = null;
let testRouteRunVersion = 0;
let testRouteHandlerBound = false;
let driverConnectionRetryTimer = null;
let gpsShareScheduleTimer = null;
let gpsShareCountdownTimer = null;
let gpsShareDemoMode = false;

// 假 GPS 測試路線




const pickupLocation = {
    lat: window.tripData.pickupLat,
    lng: window.tripData.pickupLng
};

const destinationLocation = {
    lat: window.tripData.destinationLat,
    lng: window.tripData.destinationLng
};
const driverId =
    window.tripData.driverId;
const tripSignalId =
    `${driverId}|${window.tripData.orderNo}`;
const driverOnlineStorageKey =
    `driverOnline:${driverId}`;
const driverRouteUpdateIntervalMs = 3000;
const driverRoutePhaseStorageKey =
    `driverRoutePhase:${tripSignalId}`;
const driverShareStorageKey =
    `driverShareEnabled:${tripSignalId}`;
const gpsShareDemoModeStorageKey =
    `driverGpsShareDemoMode:${tripSignalId}`;
const gpsShareLeadTimeMs = 30 * 60 * 1000;
const maxGpsShareTimerDelayMs = 2147483647;

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



let driverMap = null;
let driverMarker = null;
let watchId = null;
let todayCompletedOrderNos = null;

function stopTestRoute() {
    ++testRouteRunVersion;

    if (testRouteTimer !== null) {
        clearInterval(testRouteTimer);
        testRouteTimer = null;
    }

    isTestRouteMode = false;
}

function stopDriverLocationWatch() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

function stopGpsShareSchedule() {
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
    const demoModeButton =
        document.getElementById("tempyshare-btn");

    demoModeButton.textContent = gpsShareDemoMode
        ? "Demo 5 秒模式：已啟用"
        : "啟用 Demo 5 秒模式";
}

function setGpsShareCountdownText(text) {
    const countdownElement =
        document.getElementById(
            "gps-share-demo-countdown"
        );

    if (countdownElement) {
        countdownElement.textContent = text;
    }
}

function stopGpsShareCountdown(resetText = false) {
    if (gpsShareCountdownTimer !== null) {
        clearInterval(gpsShareCountdownTimer);
        gpsShareCountdownTimer = null;
    }

    if (resetText) {
        setGpsShareCountdownText(
            "Demo 倒數尚未啟動"
        );
    }
}

function startGpsShareCountdown(shareStartTime) {
    stopGpsShareCountdown();

    const shareStartTimestamp =
        new Date(shareStartTime).getTime();

    const updateCountdown = () => {
        const remainingSeconds = Math.max(
            0,
            Math.ceil(
                (shareStartTimestamp - Date.now()) /
                1000
            )
        );

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

async function activateGpsSharing(
    sourceLabel,
    sendCurrentLocation = true
) {
    stopGpsShareSchedule();

    if (!canScheduleGpsSharing()) {
        disableGpsSharing();
        return;
    }

    canSendLocationToPassenger = true;
    sessionStorage.setItem(
        driverShareStorageKey,
        "true"
    );

    if (gpsShareDemoMode) {
        stopGpsShareCountdown();
        setGpsShareCountdownText(
            "GPS 分享已開始"
        );
    }

    console.log(`${sourceLabel}：GPS 分享已開始`);

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

async function scheduleGpsSharing(
    shareStartTime,
    sourceLabel,
    sendCurrentLocationOnImmediateStart = true
) {
    stopGpsShareSchedule();

    if (!canScheduleGpsSharing()) {
        disableGpsSharing();
        return;
    }

    const shareStartTimestamp =
        new Date(shareStartTime).getTime();

    if (!Number.isFinite(shareStartTimestamp)) {
        disableGpsSharing();
        console.error(
            `${sourceLabel}：無法解析 GPS 分享開始時間`,
            shareStartTime
        );
        return;
    }

    const remainingMs =
        shareStartTimestamp - Date.now();

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
    const departureTimestamp =
        new Date(window.tripData.departureTime)
            .getTime();
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

function scheduleDriverConnectionRestart() {
    if (driverConnectionRetryTimer !== null) {
        return;
    }

    driverConnectionRetryTimer =
        setTimeout(async () => {
            driverConnectionRetryTimer = null;

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

async function restoreDriverSignalRState() {
    const shouldBeOnline =
        sessionStorage.getItem(
            driverOnlineStorageKey
        ) === "true";

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

    const savedPhase =
        sessionStorage.getItem(
            driverRoutePhaseStorageKey
        );

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

        const savedPhase =
            sessionStorage.getItem(
                driverRoutePhaseStorageKey
            );

        if (savedPhase === "completed") {
            document.getElementById(
                "driver-status"
            ).textContent = "行程已完成";
            return;
        }

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

function setDriverRouteText(elementId, text) {
    document.getElementById(elementId).textContent = text;
}

function formatDriverDistance(distanceMeters) {
    if (distanceMeters < 1000) {
        return `${Math.max(0, Math.round(distanceMeters))} 公尺`;
    }

    const digits = distanceMeters < 10000 ? 1 : 0;
    return `${(distanceMeters / 1000).toFixed(digits)} 公里`;
}

function formatDriverEta(durationMillis) {
    if (durationMillis <= 0) {
        return "已抵達";
    }

    const minutes = Math.max(
        1,
        Math.ceil(durationMillis / 60000)
    );
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
    if (!driverMap) {
        return;
    }

    const now = Date.now();

    if (
        !force &&
        now - driverLastRouteRequestAt <
        driverRouteUpdateIntervalMs
    ) {
        return;
    }

    driverLastRouteRequestAt = now;
    const requestVersion =
        ++driverRouteRequestVersion;

    setDriverRouteText(
        "driver-route-target",
        targetLabel
    );

    try {
        const { Route } =
            await google.maps.importLibrary("routes");
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

        if (
            requestVersion !==
            driverRouteRequestVersion
        ) {
            return;
        }

        if (!response.routes.length) {
            throw new Error("找不到司機端路線");
        }

        const route = response.routes[0];

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

        const bounds =
            new google.maps.LatLngBounds();

        route.path.forEach(point => {
            bounds.extend(point);
        });

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

async function getTodayCompletedOrderNos() {
    if (todayCompletedOrderNos !== null) {
        return todayCompletedOrderNos;
    }

    const response = await fetch(
        "/DriverNavigation/TodayCompletedOrders",
        {
            headers: {
                Accept: "application/json"
            }
        }
    );

    if (!response.ok) {
        throw new Error("無法取得今日完成訂單");
    }

    const result = await response.json();

    todayCompletedOrderNos = Array.isArray(result.orders)
        ? result.orders
        : [];

    return todayCompletedOrderNos;
}

function openHistoryOrder(orderNo, replace = false) {
    const url =
        `/DriverNavigation/HistoryOrder?orderNo=${encodeURIComponent(orderNo)}`;

    if (replace) {
        window.location.replace(url);
        return;
    }

    window.location.href = url;
}

async function initializeOrderNavigation() {
    try {
        const orders = await getTodayCompletedOrderNos();
        const lastOrderButton =
            document.getElementById("last-order-btn");
        const nextPageButton =
            document.getElementById("nextpage-order-btn");

        if (window.tripData.isHistory) {
            const path = window.location.pathname.toLowerCase();

            // 將舊的 offset 頁面導向固定排序後的同一筆訂單。
            if (path.endsWith("/lastorder") && orders.length > 0) {
                const requestedOffset = Number.parseInt(
                    new URLSearchParams(window.location.search)
                        .get("offset") ?? "0",
                    10
                );
                const safeOffset =
                    Number.isInteger(requestedOffset) &&
                    requestedOffset >= 0 &&
                    requestedOffset < orders.length
                        ? requestedOffset
                        : 0;
                const canonicalOrderNo = orders[safeOffset];

                if (canonicalOrderNo !== window.tripData.orderNo) {
                    openHistoryOrder(canonicalOrderNo, true);
                    return;
                }
            }

            const currentIndex =
                orders.indexOf(window.tripData.orderNo);

            lastOrderButton.disabled =
                currentIndex < 0 ||
                currentIndex >= orders.length - 1;
            nextPageButton.disabled = currentIndex < 0;
            return;
        }

        if (window.tripData.tripStatus === "已完成") {
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

function applyHistoryModeUI() {
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

function applyOnlineTripPhaseUI() {
    document.getElementById(
        "online-btn"
    ).disabled = true;

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


function initDriverMap() {

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

// Demo：驗證共用排程會在 5 秒後自動啟用 GPS 分享
const demoAutoShareButton =
    document.getElementById("tempnshare-btn");

demoAutoShareButton.textContent =
    "測試 5 秒後自動分享 GPS";

demoAutoShareButton.addEventListener(
    "click",
    async function () {
        if (
            sessionStorage.getItem(driverOnlineStorageKey) !==
            "true"
        ) {
            alert("請先按下上線，再測試自動分享 GPS");
            return;
        }

        if (!gpsShareDemoMode) {
            alert("請先下線並啟用 Demo 5 秒模式");
            return;
        }

        if (!canScheduleGpsSharing()) {
            alert("此訂單已完成，無法再次分享 GPS");
            return;
        }

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
const gpsShareDemoModeButton =
    document.getElementById("tempyshare-btn");

updateGpsShareDemoModeButton();

gpsShareDemoModeButton.addEventListener(
    "click",
    function () {
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

async function startDriverOnline() {
    if (window.tripData.isHistory) {
        applyHistoryModeUI();
        return;
    }

    const onlineButton =
        document.getElementById("online-btn");

    if (onlineButton.disabled) {
        return;
    }

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

    if (gpsShareDemoMode) {
        stopGpsShareSchedule();

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


    if (!navigator.geolocation) {

        alert("目前瀏覽器不支援定位功能");

        stopGpsShareSchedule();
        stopGpsShareCountdown(true);
        disableGpsSharing();
        onlineButton.disabled = false;
        return;
    }
    // 假 GPS 測試
    async function startTestRoute() {
        stopTestRoute();
        isTestRouteMode = true;
        const runVersion = testRouteRunVersion;

        try {
            const { Route } =
                await google.maps.importLibrary("routes");

        // 假設司機一開始在台大醫院南方一點
        const testStartLocation = {
            lat: 25.0388,
            lng: 121.5152
        };

        // 先請 Google 算出
        // 測試起點 → 台大醫院 的真正行車路線
            const response =
                await Route.computeRoutes({
                    origin: testStartLocation,
                    destination: pickupLocation,
                    travelMode: "DRIVING",
                    fields: ["path"]
                });

            if (runVersion !== testRouteRunVersion) {
                return;
            }

            if (!response.routes.length) {
                console.log("找不到測試路線");
                stopTestRoute();
                return;
            }

            const testPath =
                response.routes[0].path;

            let testIndex = 0;

            testRouteTimer =
            setInterval(() => {

                if (testIndex >= testPath.length) {

                    clearInterval(testRouteTimer);
                    testRouteTimer = null;
                    isTestRouteMode = false;

                    if (currentDriverLocation) {
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

                const point =
                    testPath[testIndex];

                const lat = point.lat;
                const lng = point.lng;

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
            if (runVersion === testRouteRunVersion) {
                stopTestRoute();
            }

            console.error("測試路線啟動失敗：", error);
        }
    }


    if (!testRouteHandlerBound) {
        document
            .getElementById("temproute-btn")
            .addEventListener("click", function () {
                if (
                    sessionStorage.getItem(
                        driverOnlineStorageKey
                    ) !== "true"
                ) {
                    alert("請先按下上線，再執行測試路線");
                    return;
                }

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
    //假 GPS 測試
    stopDriverLocationWatch();

    watchId =
        navigator.geolocation.watchPosition(

            function (position) {
                if (isTestRouteMode) {
                    return;
                }

                const lat =
                    position.coords.latitude;

                const lng =
                    position.coords.longitude;

                const currentLocation = {
                    lat: lat,
                    lng: lng
                };

                currentDriverLocation = currentLocation;

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

document
    .getElementById("online-btn")
    .addEventListener("click", async function ()
    {
        await startDriverOnline();
    });

document
    .getElementById("arrived-passenger-btn")
    .addEventListener("click", async function () {

        headingToDestination = true;
        sessionStorage.setItem(
            driverRoutePhaseStorageKey,
            "destination"
        );

        if (currentDriverLocation) {
            drawRouteToDestination(
                currentDriverLocation,
                true
            );
        }

        try {
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


document
    .getElementById("arrived-destination-btn")
    .addEventListener("click", async function () {
        const completeButton = this;
        const antiForgeryToken =
            document.querySelector(
                "#driver-antiforgery-form " +
                "input[name='__RequestVerificationToken']"
            )?.value;

        if (!antiForgeryToken) {
            alert("缺少安全驗證資料，請重新整理頁面");
            return;
        }

        completeButton.disabled = true;

        let response;

        try {
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

        const response =
            await fetch(
                "/DriverNavigation/HasNextOrder"
            );

        const result =
            await response.json();

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
            const orders = await getTodayCompletedOrderNos();

            if (orders.length === 0) {
                alert("今日尚無已完成訂單");
                return;
            }

            if (
                window.tripData.isHistory ||
                window.tripData.tripStatus === "已完成"
            ) {
                const currentIndex =
                    orders.indexOf(window.tripData.orderNo);
                const olderIndex = currentIndex + 1;

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

applyHistoryModeUI();
initializeOrderNavigation();

window.addEventListener(
    "load",
    async function () {

        const wasOnline =
            sessionStorage.getItem(
                driverOnlineStorageKey
            ) === "true";

        if (wasOnline && !window.tripData.isHistory) {

            console.log(
                "偵測到司機原本在線，自動恢復上線"
            );

            await startDriverOnline();

        }

    }
);

document
    .getElementById("nextpage-order-btn")
    .addEventListener("click", async function () {

        try {
            const orders = await getTodayCompletedOrderNos();
            const currentIndex =
                orders.indexOf(window.tripData.orderNo);

            if (currentIndex < 0) {
                alert("目前訂單不在今日完成訂單中");
                return;
            }

            if (currentIndex > 0) {
                openHistoryOrder(orders[currentIndex - 1]);
                return;
            }

            const response =
                await fetch(
                    "/DriverNavigation/HasNextOrder"
                );

            const result =
                await response.json();

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

window.initDriverMap =
    initDriverMap;
