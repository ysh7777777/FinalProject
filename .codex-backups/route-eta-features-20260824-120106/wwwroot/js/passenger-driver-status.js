let passengerMap = null;
let passengerDriverMarker = null;
let passengerTrackingStarted = false;





const passengerConnection =
    new signalR.HubConnectionBuilder()
        .withUrl("/driverLocationHub")
        .build();
const passengerTripSignalId =
    `${window.passengerTripData.driverId}|${window.passengerTripData.orderNo}`;

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

        passengerTrackingStarted = true;
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
            "司機已上線"
        );

        document.getElementById(
            "passenger-trip-status"
        ).textContent = "司機已上線";

        const driverLocation = {
            lat: latitude,
            lng: longitude
        };

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

        document.getElementById(
            "last-update"
        ).textContent =
            new Date().toLocaleTimeString();
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


    // 必須是這張訂單與這位司機的位置
    if (
        savedTripSignalId ===
        passengerTripSignalId &&
        savedLat !== null &&
        savedLng !== null
    ) {

        const driverLocation = {
            lat: Number(savedLat),
            lng: Number(savedLng)
        };

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

        document.getElementById(
            "passenger-trip-status"
        ).textContent = "司機已抵達";

        sessionStorage.setItem(
            "passengerTripStatus",
            "司機已抵達"
        );


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

        passengerTrackingStarted = false;
    }
);




window.initPassengerMap =
    initPassengerMap;
