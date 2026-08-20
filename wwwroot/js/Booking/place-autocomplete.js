


//宣告經緯度儲存變數
let pickupLocation = null;
let destinationLocation = null;
let estimatedDistanceOriginal = null;
let stopLocation = null;
let pickupAutocomplete = null;
let destinationAutocomplete = null;
let stopAutocomplete = null;
let estimatedDistanceAll = null;

//API使用
async function initAutocomplete() {

    const { PlaceAutocompleteElement } =
        await google.maps.importLibrary("places");


    // =========================
    // 出發地
    // =========================
    pickupAutocomplete =
        new PlaceAutocompleteElement({
            includedRegionCodes: ["tw"]
        });

    pickupAutocomplete.placeholder =
        "請輸入出發地、飯店、景點或路名";

    document
        .getElementById("pickup-autocomplete-container")
        .appendChild(pickupAutocomplete);


    pickupAutocomplete.addEventListener("gmp-select", async (event) => {

        const prediction =
            event.placePrediction;

        const place =
            prediction.toPlace();

        await place.fetchFields({
            fields: [
                "id",
                "formattedAddress",
                "location",
                "types"
            ]
        });
        // console.log("出發地類型：", place.types);
        //檢查使用者輸入的地點是否過於廣泛
        const invalidTypes = [
            "administrative_area_level_1",
            "administrative_area_level_2",
            "locality"
        ];

        const isTooBroad =
            place.types?.some(type => invalidTypes.includes(type));

        if (isTooBroad) {
            alert("請選擇更詳細的地址、飯店、景點、車站或機場");
            return;
        }

        if (!place.location) {
            console.error("找不到出發地座標");
            return;
        }

        const address =
            place.formattedAddress;

        const lat =
            place.location.lat();

        const lng =
            place.location.lng();



        const placeId =
            place.id;
        //儲存出發地經緯度

       
        pickupLocation = {
            lat: lat,
            lng: lng,
            placeId: placeId,
            address: address
        };
     

        // console.log("出發地：", {
        //     address,
        //     lat,
        //     lng,
        //     placeId
        // });

        document.getElementById(
            "pickup-address"
        ).textContent = address ?? "";

        document.getElementById(
            "pickup-lat"
        ).textContent = lat;

        document.getElementById(
            "pickup-lng"
        ).textContent = lng;

        document.getElementById(
            "pickup-place-id"
        ).textContent = placeId ?? "";
    });
    // =========================
    // 停靠點
    // =========================

    stopAutocomplete =
        new PlaceAutocompleteElement({
            includedRegionCodes: ["tw"]
        });

    stopAutocomplete.placeholder =
        "請輸入停靠地點、飯店、景點或路名";

    document
        .getElementById("stop-autocomplete-container")
        .appendChild(stopAutocomplete);


    stopAutocomplete.addEventListener("gmp-select", async (event) => {

        const prediction =
            event.placePrediction;

        const place =
            prediction.toPlace();

        await place.fetchFields({
            fields: [
                "id",
                "formattedAddress",
                "location",
                "types"
            ]
        });

        // 和出發地、目的地一樣的行政區驗證
        const invalidTypes = [
            "administrative_area_level_1",
            "administrative_area_level_2",
            "locality"
        ];

        const isTooBroad =
            place.types?.some(type =>
                invalidTypes.includes(type)
            );

        if (isTooBroad) {
            alert("請選擇更詳細的地址、飯店、景點、車站或機場");
            return;
        }

        if (!place.location) {
            console.error("找不到停靠點座標");
            return;
        }

        const address =
            place.formattedAddress;

        const lat =
            place.location.lat();

        const lng =
            place.location.lng();

        const placeId =
            place.id;


        // 儲存停靠點資料
        stopLocation = {
            lat: lat,
            lng: lng,
            placeId: placeId,
            address: address
        };



        // console.log("停靠點：", {
        //     address,
        //     lat,
        //     lng,
        //     placeId
        // });


        document.getElementById(
            "stop-address"
        ).textContent = address ?? "";

        document.getElementById(
            "stop-lat"
        ).textContent = lat;

        document.getElementById(
            "stop-lng"
        ).textContent = lng;

        document.getElementById(
            "stop-place-id"
        ).textContent = placeId ?? "";

       estimatedDistanceAll=await calculateRoute(stopLocation);
    });

    // =========================
    // 目的地
    // =========================

    destinationAutocomplete =
        new PlaceAutocompleteElement({
            includedRegionCodes: ["tw"]
        });

    destinationAutocomplete.placeholder =
        "請輸入目的地、飯店、景點或路名";

    document
        .getElementById("destination-autocomplete-container")
        .appendChild(destinationAutocomplete);


    destinationAutocomplete.addEventListener("gmp-select", async (event) => {

        const prediction =
            event.placePrediction;

        const place =
            prediction.toPlace();

        await place.fetchFields({
            fields: [
                "id",
                "formattedAddress",
                "location",
                "types"
            ]
        });

        //檢查使用者輸入的地點是否過於廣泛
        const invalidTypes = [
            "administrative_area_level_1",
            "administrative_area_level_2",
            "locality"
        ];

        const isTooBroad =
            place.types?.some(type => invalidTypes.includes(type));

        if (isTooBroad) {
            alert("請選擇更詳細的地址、飯店、景點、車站或機場");
            return;
        }

        if (!place.location) {
            console.error("找不到目的地座標");
            return;
        }

        const address =
            place.formattedAddress;

        const lat =
            place.location.lat();

        const lng =
            place.location.lng();

        const placeId =
            place.id;
        //儲存目的地經緯度
        destinationLocation = {
            lat: lat,
            lng: lng,
            placeId: placeId,
            address: address
        };

      
        estimatedDistanceOriginal =
            await calculateRoute();
        if (stopLocation == null) { estimatedDistanceAll = await calculateRoute() }
       


        // console.log("原始距離：", estimatedDistanceOriginal)


        //使用者選擇目的地後，使用計算路線方法

        // console.log("目的地：", {
        //     address,
        //     lat,
        //     lng,
        //     placeId
        // });
        

        document.getElementById(
            "destination-address"
        ).textContent = address ?? "";

        document.getElementById(
            "destination-lat"
        ).textContent = lat;

        document.getElementById(
            "destination-lng"
        ).textContent = lng;

        document.getElementById(
            "destination-place-id"
        ).textContent = placeId ?? "";

        // =========================
        // 就放在這裡
        // =========================
        setInterval(() => {

            if (
                pickupAutocomplete &&
                (pickupAutocomplete.value ?? "").trim() === ""
            ) {
                pickupLocation = null;

                document.getElementById("pickup-address").textContent = "";
                document.getElementById("pickup-lat").textContent = "";
                document.getElementById("pickup-lng").textContent = "";
                document.getElementById("pickup-place-id").textContent = "";

                estimatedDistanceOriginal = null;
                estimatedDistanceAll = null;

                document.getElementById("estimated-distance").textContent = "";
                document.getElementById("estimated-duration").textContent = "";
            }


            if (
                destinationAutocomplete &&
                (destinationAutocomplete.value ?? "").trim() === ""
            ) {
                destinationLocation = null;

                document.getElementById("destination-address").textContent = "";
                document.getElementById("destination-lat").textContent = "";
                document.getElementById("destination-lng").textContent = "";
                document.getElementById("destination-place-id").textContent = "";

                estimatedDistanceOriginal = null;
                estimatedDistanceAll = null;

                document.getElementById("estimated-distance").textContent = "";
                document.getElementById("estimated-duration").textContent = "";
            }


            if (
                stopAutocomplete &&
                (stopAutocomplete.value ?? "").trim() === ""
            ) {
                stopLocation = null;

                document.getElementById("stop-address").textContent = "";
                document.getElementById("stop-lat").textContent = "";
                document.getElementById("stop-lng").textContent = "";
                document.getElementById("stop-place-id").textContent = "";
            }

        }, 200);
    });
}
//計算距離方法
async function calculateRoute(stop = null) {

    // console.log("1. calculateRoute 被呼叫", {
    //     pickupLocation,
    //     destinationLocation,
    //     stop
    // });

    if (!pickupLocation || !destinationLocation) {
        // console.log("2. 起點或終點尚未完成");
        return;
    }

    const { Route } =
        await google.maps.importLibrary("routes");

    try {

        const request = {
            origin: pickupLocation,
            destination: destinationLocation,
            travelMode: "DRIVING",

            fields: [
                "distanceMeters",
                "durationMillis"
            ]
        };

        if (stop) {
            request.intermediates = [
                {
                    location: {
                        lat: stop.lat,
                        lng: stop.lng
                    }
                }
            ];
        }

        // console.log("3. 準備送出的 request", request);

        const result =
            await Route.computeRoutes(request);

        // console.log("4. Routes API 回傳", result);

        if (!result.routes || result.routes.length === 0) {
            console.error("找不到可用路線");
            return;
        }

        const route = result.routes[0];

        const distanceKm =
            route.distanceMeters / 1000;

        const durationMinutes =
            Math.ceil(
                route.durationMillis / 1000 / 60
            );

            

        // console.log(
        //     stop ? "含停靠點路線：" : "原始路線：",
        //     {
        //         distanceKm,
        //         durationMinutes
        //     }
        // );



        document.getElementById(
            "estimated-distance"
        ).textContent =
            distanceKm.toFixed(2);

        document.getElementById(
            "estimated-duration"
        ).textContent =
            durationMinutes;

        return {
            "distance":distanceKm, "Time":durationMinutes
        };
    }
    catch (error) {

        console.error(
            "計算路線失敗：",
            error
        );
    }
}


// 停靠點切換按鈕
const toggleStopBtn =
    document.getElementById("toggle-stop-btn");

const stopSection =
    document.getElementById("stop-section");

const stopDataSection =
    document.getElementById("stop-data-section");

// 重置停靠點資料
async function resetStop() {

    stopLocation = null;

    stopSection.style.display = "none";
    stopDataSection.style.display = "none";

    toggleStopBtn.textContent =
        "＋ 新增停靠點";

    if (stopAutocomplete) {
        stopAutocomplete.value = "";
    }

    document.getElementById("stop-address").textContent = "";
    document.getElementById("stop-lat").textContent = "";
    document.getElementById("stop-lng").textContent = "";
    document.getElementById("stop-place-id").textContent = "";
}
toggleStopBtn.addEventListener("click", async function () {

    const isHidden =
        stopSection.style.display === "none";

    if (isHidden) {
        if (!pickupLocation || !destinationLocation) {
            alert("請先完成出發地與目的地");
            return;
        }

        // 開啟停靠點
        stopSection.style.display = "block";
        stopDataSection.style.display = "block";
        alert("加入停靠點以後將自動鎖定出發地與目的地，若想變更請移除停靠點再進行變更")
        //解除鎖定出發點與目的地；解除清空按鈕
        pickupAutocomplete.disabled = true;
        destinationAutocomplete.disabled = true;
        pickupAutocomplete.noClearButton = true;
        destinationAutocomplete.noClearButton = true;
        


        toggleStopBtn.textContent =
            "－ 移除停靠點";
    }
    else {

        // 關閉停靠點
        stopSection.style.display = "none";
        stopDataSection.style.display = "none";
        await resetStop();
        //解除鎖定出發點與目的地；解除清空按鈕
        pickupAutocomplete.disabled = false;
        destinationAutocomplete.disabled = false;
        pickupAutocomplete.noClearButton = false;
        destinationAutocomplete.noClearButton = false;

        toggleStopBtn.textContent =
            "＋ 新增停靠點";

        // 清除停靠點資料
        stopLocation = null;

        // 回到原始：出發地 → 目的地
        await calculateRoute();
        if (stopLocation == null) { estimatedDistanceAll = await calculateRoute() }
    }
});
// 停靠點切換按鈕


function logData()
{
    //出發地資料
    console.log("出發地:",pickupLocation);
    //目的地資料
    console.log("目的地:",destinationLocation);
    //停靠點資料
    console.log("停靠點:",stopLocation)
    //原始預估距離
    console.log("原始距離:", estimatedDistanceOriginal)
    //含停靠點距離及時間
    console.log("含停靠距離及時間", estimatedDistanceAll)
    //

    
}

function TempData() {
    //出發地資料
    console.log("出發地:", pickupLocation);

}


window.initAutocomplete = initAutocomplete;