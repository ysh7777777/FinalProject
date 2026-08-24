let passengerMap = null;
let passengerDriverMarker = null;
let passengerTrackingStarted = false;
let passengerRoutePolyline = null;
let passengerTargetMarker = null;
let passengerCurrentDriverLocation = null;
let passengerRoutePhase = "pickup";
let passengerLastRouteRequestAt = 0;
let passengerRouteRequestVersion = 0;
let passengerRouteRefreshTimer = null;





const passengerConnection =
    new signalR.HubConnectionBuilder()
        .withUrl("/driverLocationHub")
        .build();
const passengerTripSignalId =
    `${window.passengerTripData.driverId}|${window.passengerTripData.orderNo}`;
const passengerRouteUpdateIntervalMs = 3000;
const passengerRouteStopDelayMs = 1000;

function setPassengerRouteText(elementId, text) {
    document.getElementById(elementId).textContent = text;
}

function formatPassengerDistance(distanceMeters) {
    if (distanceMeters < 1000) {
        return `${Math.max(0, Math.round(distanceMeters))} 公尺`;
    }

    const digits = distanceMeters < 10000 ? 1 : 0;
    return `${(distanceMeters / 1000).toFixed(digits)} 公里`;
}

function formatPassengerEta(durationMillis) {
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

function getPassengerRouteTarget() {
    if (passengerRoutePhase === "destination") {
        return {
            label: "目的地",
            position: {
                lat: window.passengerTripData.destinationLat,
                lng: window.passengerTripData.destinationLng
            }
        };
    }

    return {
        label: "乘客上車位置",
        position: {
            lat: window.passengerTripData.pickupLat,
            lng: window.passengerTripData.pickupLng
        }
    };
}

function getPassengerTargetIcon() {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor:
            passengerRoutePhase === "destination"
                ? "#fd7e14"
                : "#0d6efd",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeOpacity: 1,
        strokeWeight: 2
    };
}

async function updatePassengerRoute(
    currentLocation,
    force = false
) {
    if (
        !passengerMap ||
        passengerRoutePhase === "completed"
    ) {
        return;
    }

    const now = Date.now();

    if (
        !force &&
        now - passengerLastRouteRequestAt <
        passengerRouteUpdateIntervalMs
    ) {
        return;
    }

    passengerLastRouteRequestAt = now;
    const requestVersion =
        ++passengerRouteRequestVersion;
    const target = getPassengerRouteTarget();

    setPassengerRouteText(
        "passenger-route-target",
        `前往${target.label}`
    );

    try {
        const { Route } =
            await google.maps.importLibrary("routes");
        const response =
            await Route.computeRoutes({
                origin: currentLocation,
                destination: target.position,
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
            passengerRouteRequestVersion
        ) {
            return;
        }

        if (!response.routes.length) {
            throw new Error("找不到乘客端路線");
        }

        const route = response.routes[0];

        if (!passengerTargetMarker) {
            passengerTargetMarker =
                new google.maps.Marker({
                    map: passengerMap,
                    position: target.position,
                    title: target.label,
                    icon: getPassengerTargetIcon()
                });
        }
        else {
            passengerTargetMarker.setPosition(
                target.position
            );
            passengerTargetMarker.setTitle(
                target.label
            );
            passengerTargetMarker.setIcon(
                getPassengerTargetIcon()
            );
        }

        if (passengerRoutePolyline) {
            passengerRoutePolyline.setMap(null);
        }

        passengerRoutePolyline =
            new google.maps.Polyline({
                map: passengerMap,
                path: route.path,
                strokeColor: "#0d6efd",
                strokeOpacity: 0.85,
                strokeWeight: 5
            });

        const bounds =
            new google.maps.LatLngBounds();

        route.path.forEach(point => {
            bounds.extend(point);
        });

        if (!bounds.isEmpty()) {
            passengerMap.fitBounds(bounds, 60);
        }

        setPassengerRouteText(
            "passenger-route-distance",
            formatPassengerDistance(
                route.distanceMeters ?? 0
            )
        );
        setPassengerRouteText(
            "passenger-route-eta",
            formatPassengerEta(
                route.durationMillis ?? 0
            )
        );
    }
    catch (error) {
        if (
            requestVersion !==
            passengerRouteRequestVersion
        ) {
            return;
        }

        console.error("乘客端路線計算失敗：", error);
        setPassengerRouteText(
            "passenger-route-distance",
            "暫時無法取得"
        );
        setPassengerRouteText(
            "passenger-route-eta",
            "暫時無法取得"
        );
    }
}

function schedulePassengerRouteUpdate(
    currentLocation
) {
    updatePassengerRoute(currentLocation);

    if (passengerRouteRefreshTimer !== null) {
        clearTimeout(passengerRouteRefreshTimer);
    }

    passengerRouteRefreshTimer =
        setTimeout(() => {
            passengerRouteRefreshTimer = null;

            if (
                passengerCurrentDriverLocation &&
                passengerRoutePhase !== "completed"
            ) {
                updatePassengerRoute(
                    passengerCurrentDriverLocation,
                    true
                );
            }
        }, passengerRouteStopDelayMs);
}

passengerConnection.on(
    "ReceiveDriverLocation",
    function (tripSignalId, latitude, longitude) {

        // 只接受這張訂單指定司機的 GPS
        if (
            tripSignalId !==
            passengerTripSignalId
        ) {
            return;
        }

        console.log(
            "乘客收到司機位置：",
            tripSignalId,
            latitude,
            longitude
        );

        const savedTripSignalId =
            sessionStorage.getItem(
                "passengerTripSignalId"
            );

        if (savedTripSignalId !== tripSignalId) {
            passengerRoutePhase = "pickup";
            sessionStorage.setItem(
                "passengerRoutePhase",
                passengerRoutePhase
            );
        }

        passengerTrackingStarted = true;
        const statusText =
            passengerRoutePhase === "destination"
                ? "前往目的地"
                : "司機已上線";
        sessionStorage.setItem(
            "passengerTripSignalId",
            tripSignalId
        );

        sessionStorage.setItem(
            "passengerDriverLat",
            latitude
        );

        sessionStorage.setItem(
            "passengerDriverLng",
            longitude
        );

        sessionStorage.setItem(
            "passengerTripStatus",
            statusText
        );

        document.getElementById(
            "passenger-trip-status"
        ).textContent = statusText;

        const driverLocation = {
            lat: latitude,
            lng: longitude
        };
        passengerCurrentDriverLocation =
            driverLocation;

        document.getElementById(
            "last-update"
        ).textContent =
            new Date().toLocaleTimeString();

        if (!passengerMap) {
            return;
        }

        // 第一次收到 GPS
        if (!passengerDriverMarker) {

            passengerDriverMarker =
                new google.maps.Marker({
                    map: passengerMap,
                    position: driverLocation,
                    title: "司機目前位置"
                });
        }

        // 後續更新 GPS
        else {

            passengerDriverMarker.setPosition(
                driverLocation
            );
        }

        passengerMap.setCenter(
            driverLocation
        );

        schedulePassengerRouteUpdate(
            driverLocation
        );
    }
);




passengerConnection.start()
    .then(() => {
        console.log("乘客 SignalR 連線成功");
    })
    .catch(error => {
        console.error(
            "乘客 SignalR 連線失敗：",
            error
        );
    });

function initPassengerMap() {

    const defaultLocation = {
        lat: 24.1477,
        lng: 120.6736
    };

    passengerMap =
        new google.maps.Map(
            document.getElementById("passenger-map"),
            {
                center: defaultLocation,
                zoom: 15
            }
        );

    // =========================
    // F5 後恢復司機最後位置
    // =========================

    const savedTripSignalId =
        sessionStorage.getItem(
            "passengerTripSignalId"
        );

    const savedLat =
        sessionStorage.getItem(
            "passengerDriverLat"
        );

    const savedLng =
        sessionStorage.getItem(
            "passengerDriverLng"
        );

    const savedStatus =
        sessionStorage.getItem(
            "passengerTripStatus"
        );

    const savedRoutePhase =
        sessionStorage.getItem(
            "passengerRoutePhase"
        );


    // 必須是這張訂單與這位司機的位置
    if (
        savedTripSignalId ===
        passengerTripSignalId &&
        savedLat !== null &&
        savedLng !== null
    ) {

        passengerRoutePhase =
            savedRoutePhase === "destination"
                ? "destination"
                : savedRoutePhase === "completed"
                    ? "completed"
                    : "pickup";

        const driverLocation = {
            lat: Number(savedLat),
            lng: Number(savedLng)
        };
        passengerCurrentDriverLocation =
            driverLocation;

        passengerDriverMarker =
            new google.maps.Marker({
                map: passengerMap,
                position: driverLocation,
                title: "司機目前位置"
            });

        passengerMap.setCenter(
            driverLocation
        );

        passengerTrackingStarted = true;

        document.getElementById(
            "passenger-trip-status"
        ).textContent =
            savedStatus ?? "司機已上線";

        if (passengerRoutePhase === "completed") {
            setPassengerRouteText(
                "passenger-route-target",
                "已抵達目的地"
            );
            setPassengerRouteText(
                "passenger-route-distance",
                "0 公尺"
            );
            setPassengerRouteText(
                "passenger-route-eta",
                "已抵達"
            );
        }
        else {
            updatePassengerRoute(
                driverLocation,
                true
            );
        }
    }
}




passengerConnection.on(
    "DriverArrivedPassenger",
    function (tripSignalId) {
        if (
            tripSignalId !==
            passengerTripSignalId
        ) {
            return;
        }

        if (!passengerTrackingStarted) {
            return;
        }

        passengerRoutePhase = "destination";
        sessionStorage.setItem(
            "passengerRoutePhase",
            passengerRoutePhase
        );

        document.getElementById(
            "passenger-trip-status"
        ).textContent = "前往目的地";

        sessionStorage.setItem(
            "passengerTripStatus",
            "前往目的地"
        );

        setPassengerRouteText(
            "passenger-route-target",
            "前往目的地"
        );

        if (passengerCurrentDriverLocation) {
            updatePassengerRoute(
                passengerCurrentDriverLocation,
                true
            );
        }
    }
);

passengerConnection.on(
    "DriverArrivedDestination",
    function (tripSignalId) {
        if (
            tripSignalId !==
            passengerTripSignalId
        ) {
            return;
        }

        if (!passengerTrackingStarted) {
            return;
        }

        document.getElementById(
            "passenger-trip-status"
        ).textContent = "已完成";

        sessionStorage.setItem(
            "passengerTripStatus",
            "已完成"
        );

        passengerRoutePhase = "completed";
        ++passengerRouteRequestVersion;

        if (passengerRouteRefreshTimer !== null) {
            clearTimeout(passengerRouteRefreshTimer);
            passengerRouteRefreshTimer = null;
        }

        sessionStorage.setItem(
            "passengerRoutePhase",
            passengerRoutePhase
        );

        if (passengerRoutePolyline) {
            passengerRoutePolyline.setMap(null);
            passengerRoutePolyline = null;
        }

        setPassengerRouteText(
            "passenger-route-target",
            "已抵達目的地"
        );
        setPassengerRouteText(
            "passenger-route-distance",
            "0 公尺"
        );
        setPassengerRouteText(
            "passenger-route-eta",
            "已抵達"
        );

        passengerTrackingStarted = false;
    }
);




window.initPassengerMap =
    initPassengerMap;
