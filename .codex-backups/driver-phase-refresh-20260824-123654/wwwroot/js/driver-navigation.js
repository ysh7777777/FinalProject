// JavaScript for Navigation view

let driverRoutePolyline = null;
let headingToDestination = false;
let currentDriverLocation = null;
let canSendLocationToPassenger = false;
let driverLastRouteRequestAt = 0;
let driverRouteRequestVersion = 0;

let isTestRouteMode = false;

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
const driverRouteUpdateIntervalMs = 3000;
const driverRoutePhaseStorageKey =
    `driverRoutePhase:${tripSignalId}`;

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
        .build();



let driverMap = null;
let driverMarker = null;
let watchId = null;
let todayCompletedOrderNos = null;

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

}

//測試前40分鐘
document
    .getElementById("tempnshare-btn")
    .addEventListener("click", function () {

        const departureTime =
            new Date(window.tripData.departureTime);

        const testNow =
            new Date(
                departureTime.getTime()
                - 40 * 60 * 1000
            );

        const shareStartTime =
            new Date(
                departureTime.getTime()
                - 30 * 60 * 1000
            );

        canSendLocationToPassenger =
            testNow >= shareStartTime;

        console.log(
            "測試：出發前40分鐘"
        );

        console.log(
            "是否分享 GPS：",
            canSendLocationToPassenger
        );

    });

//測試前20分鐘
document
    .getElementById("tempyshare-btn")
    .addEventListener("click", function () {

        const departureTime =
            new Date(window.tripData.departureTime);

        const testNow =
            new Date(
                departureTime.getTime()
                - 20 * 60 * 1000
            );

        const shareStartTime =
            new Date(
                departureTime.getTime()
                - 30 * 60 * 1000
            );

        canSendLocationToPassenger =
            testNow >= shareStartTime;

        console.log(
            "測試：出發前20分鐘"
        );

        console.log(
            "是否分享 GPS：",
            canSendLocationToPassenger
        );

        if (
            canSendLocationToPassenger &&
            currentDriverLocation &&
            connection.state ===
            signalR.HubConnectionState.Connected
        ) {

            connection.invoke(
                "SendDriverLocation",
                tripSignalId,
                currentDriverLocation.lat,
                currentDriverLocation.lng
            );

            console.log(
                "開始分享 GPS，立即送出目前位置：",
                currentDriverLocation
            );
        }
    });

async function startDriverOnline() {
    if (window.tripData.isHistory) {
        applyHistoryModeUI();
        return;
    }

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

            return;
        }
    }




    // 確定連線成功後才通知上線
    await connection.invoke(
        "DriverOnline",
        driverId
    );


    if (!navigator.geolocation) {

        alert("目前瀏覽器不支援定位功能");

        return;
    }
    // 假 GPS 測試
    async function startTestRoute() {
        isTestRouteMode = true;

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

        if (!response.routes.length) {
            console.log("找不到測試路線");
            return;
        }

        const testPath =
            response.routes[0].path;

        let testIndex = 0;

        const testTimer =
            setInterval(() => {

                if (testIndex >= testPath.length) {

                    clearInterval(testTimer);

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


                // 重新畫目前位置 → 台大醫院
                drawRouteToPickup(
                    currentLocation
                );


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
                    );

                }


                testIndex++;

            }, 500);
    }


    document
        .getElementById("temproute-btn")
        .addEventListener("click", function () {

            startTestRoute();

        });
    //假 GPS 測試
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

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


    document.getElementById(
        "online-btn"
    ).disabled = true;


    document.getElementById(
        "offline-btn"
    ).disabled = false;


    document.getElementById(
        "arrived-passenger-btn"
    ).disabled = window.tripData.isHistory;


    document.getElementById(
        "driver-status"
    ).textContent = "上線中";


    sessionStorage.setItem(
        "driverOnline",
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
    .addEventListener("click", function () {

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

        connection.invoke(
            "DriverArrivedPassenger",
            tripSignalId
        );

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

        const response = await fetch(
            `/DriverNavigation/CompleteTrip?orderNo=${encodeURIComponent(window.tripData.orderNo)}`,
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            alert("訂單完成狀態更新失敗");
            return;
        }

        window.tripData.tripStatus = "已完成";

        document.getElementById(
            "order-status"
        ).textContent = "已完成";

        canSendLocationToPassenger = false;
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

        connection.invoke(
            "DriverArrivedDestination",
            tripSignalId
        );

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
    .addEventListener("click", function () {

        navigator.geolocation.clearWatch(watchId);
        watchId = null;

        connection.stop();

        sessionStorage.setItem(
            "driverOnline",
            "false"
        );

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
                "driverOnline"
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
