let passengerMap = null;
let passengerDriverMarker = null;
let passengerTrackingStarted = false;

const passengerConnection =
    new signalR.HubConnectionBuilder()
        .withUrl("/driverLocationHub")
        .build();


passengerConnection.on(
    "ReceiveDriverLocation",
    function (driverId, latitude, longitude) {

        console.log(
            "乘客收到司機位置：",
            driverId,
            latitude,
            longitude
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
}
passengerConnection.on(
    "ReceiveDriverLocation",
    function (driverId, latitude, longitude) {

        console.log(
            "乘客收到司機位置：",
            driverId,
            latitude,
            longitude
        );


        const driverLocation = {
            lat: latitude,
            lng: longitude
        };


        // 第一次收到位置
        if (!passengerDriverMarker) {

            passengerDriverMarker =
                new google.maps.Marker({
                    map: passengerMap,
                    position: driverLocation,
                    title: "司機目前位置"
                });

        }

        // 後續收到新位置
        else {

            passengerDriverMarker.setPosition(
                driverLocation
            );

        }


        // 讓地圖中心跟著司機
        passengerMap.setCenter(
            driverLocation
        );


        // 顯示最後更新時間
        document.getElementById(
            "last-update"
        ).textContent =
            new Date().toLocaleTimeString();

    }
);

passengerConnection.on(
    "ReceiveDriverLocation",
    function (driverId, latitude, longitude) {
        passengerTrackingStarted = true;
        document.getElementById(
            "passenger-trip-status"
        ).textContent = "司機已上線";

// 後面原本更新 Marker
    }
);

passengerConnection.on(
    "DriverArrivedPassenger",
    function (driverId) {

        if (!passengerTrackingStarted) {
            return;
        }

        document.getElementById(
            "passenger-trip-status"
        ).textContent = "司機已抵達";
    }
);

passengerConnection.on(
    "DriverArrivedDestination",
    function (driverId) {

        if (!passengerTrackingStarted) {
            return;
        }

        document.getElementById(
            "passenger-trip-status"
        ).textContent = "已完成";

        passengerTrackingStarted = false;
    }
);




window.initPassengerMap =
    initPassengerMap;
