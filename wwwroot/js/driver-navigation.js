// JavaScript for Navigation view

let driverRoutePolyline = null;
let headingToDestination = false;
let currentDriverLocation = null;
let canSendLocationToPassenger = false;





const pickupLocation = {
    lat: 24.1477,
    lng: 120.6736
};

const destinationLocation = {
    lat: 24.0786,
    lng: 120.5440
};
const driverId =
    "DRV-101";
const connection =
    new signalR.HubConnectionBuilder()
        .withUrl("/driverLocationHub")
        .build();



let driverMap = null;
let driverMarker = null;
let watchId = null;


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


document
    .getElementById("online-btn")
    .addEventListener("click", async function () {
        // 新一次上線，重設行程狀態
        headingToDestination = false;

        // 現在只是測試版：
        // 假設已經進入訂單前 30 分鐘
        canSendLocationToPassenger = true;

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


        watchId =
            navigator.geolocation.watchPosition(

                function (position) {

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
                        canSendLocationToPassenger &&connection.state ===
                        signalR.HubConnectionState.Connected
                    ) {

                        connection.invoke(
                            "SendDriverLocation",
                            driverId,
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
        ).disabled = false;


        document.getElementById(
            "driver-status"
        ).textContent = "上線中";



        
    });

document
    .getElementById("arrived-passenger-btn")
    .addEventListener("click", function () {

        headingToDestination = true;

        if (currentDriverLocation) {
            drawRouteToDestination(
                currentDriverLocation
            );
        }

        connection.invoke(
            "DriverArrivedPassenger",
            driverId
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

async function drawRouteToPickup(currentLocation) {

    const { Route } =
        await google.maps.importLibrary("routes");

    const request = {
        origin: currentLocation,
        destination: pickupLocation,
        travelMode: "DRIVING"
    };

    const response =
        await Route.computeRoutes({
            ...request,
            fields: ["path"]
        });

    if (!response.routes.length) {
        console.log("找不到路線");
        return;
    }

    const route =
        response.routes[0];

    if (driverRoutePolyline) {
        driverRoutePolyline.setMap(null);
    }

    driverRoutePolyline =
        new google.maps.Polyline({
            map: driverMap,
            path: route.path,
            strokeWeight: 5
        });
}

async function drawRouteToDestination(currentLocation) {

    const { Route } =
        await google.maps.importLibrary("routes");

    const response =
        await Route.computeRoutes({
            origin: currentLocation,
            destination: destinationLocation,
            travelMode: "DRIVING",
            fields: ["path"]
        });

    if (!response.routes.length) {
        console.log("找不到目的地路線");
        return;
    }

    const route = response.routes[0];

    if (driverRoutePolyline) {
        driverRoutePolyline.setMap(null);
    }

    driverRoutePolyline =
        new google.maps.Polyline({
            map: driverMap,
            path: route.path,
            strokeWeight: 5
        });

    
}


document
    .getElementById("arrived-destination-btn")
    .addEventListener("click", function () {

        canSendLocationToPassenger = false;

        connection.invoke(
            "DriverArrivedDestination",
            driverId
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





        


    });

document
    .getElementById("offline-btn")
    .addEventListener("click", function () {

        navigator.geolocation.clearWatch(watchId);
        watchId = null;

        connection.stop();

        document.getElementById(
            "driver-status"
        ).textContent = "已下線";

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



window.initDriverMap =
    initDriverMap;