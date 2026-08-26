const bookingMapData = {
    pickupLocation: null,
    destinationLocation: null,
    estimatedDistanceKm: null,
    estimatedDuration: null
};

window.bookingMapData = bookingMapData;

let pickupAutocomplete = null;
let destinationAutocomplete = null;
let selectedPickupValue = "";
let selectedDestinationValue = "";
let routeRequestVersion = 0;

const invalidPlaceTypes = [
    "administrative_area_level_1",
    "administrative_area_level_2",
    "locality"
];

const airportTerminalSearchText = {
    "桃園國際機場": {
        "第一航廈 T1": "桃園市大園區航站南路15號 第一航廈",
        "第二航廈 T2": "桃園市大園區航站南路9號 第二航廈"
    },
    "臺北松山機場": {
        "國內線航廈": "台北市松山區敦化北路340之9號 國內線航廈",
        "國際線航廈": "台北市松山區敦化北路340之9號 國際線航廈"
    },
    "臺中國際機場": {
        "國際航廈": "台中市沙鹿區中航路一段168號 國際航廈",
        "國內航廈": "台中市沙鹿區中航路一段168號 國內航廈"
    },
    "高雄國際機場": {
        "國際航廈": "高雄市小港區中山四路2號 國際航廈",
        "國內航廈": "高雄市小港區中山四路2號 國內航廈"
    }
};

function setBookingAddress(inputId, address) {
    const input = document.getElementById(inputId);
    input.value = address;
    input.dispatchEvent(new Event("input"));
}

function resetRouteMetrics() {
    bookingMapData.estimatedDistanceKm = null;
    bookingMapData.estimatedDuration = null;
    routeRequestVersion += 1;
}

function resetPickupSelection() {
    bookingMapData.pickupLocation = null;
    selectedPickupValue = "";
    resetRouteMetrics();
    setBookingAddress("pickupAddress", "");
}

function resetDestinationSelection() {
    bookingMapData.destinationLocation = null;
    selectedDestinationValue = "";
    resetRouteMetrics();
    setBookingAddress("dropoffAddress", "");
}

function isPlaceTooBroad(place) {
    return place.types?.some(type =>
        invalidPlaceTypes.includes(type)
    );
}

async function getSelectedPlace(event) {
    const place = event.placePrediction.toPlace();

    await place.fetchFields({
        fields: [
            "formattedAddress",
            "location",
            "types"
        ]
    });

    if (isPlaceTooBroad(place)) {
        alert("請選擇更詳細的地址、飯店、景點、車站或機場");
        return null;
    }

    if (!place.location || !place.formattedAddress) {
        console.error("選擇的地點缺少地址或座標");
        return null;
    }

    return {
        address: place.formattedAddress,
        lat: place.location.lat(),
        lng: place.location.lng()
    };
}

async function findBookingPlaceByText(textQuery) {
    const { Place } = await google.maps.importLibrary("places");
    const { places } = await Place.searchByText({
        textQuery,
        fields: [
            "formattedAddress",
            "location"
        ],
        language: "zh-TW",
        region: "tw",
        maxResultCount: 1
    });

    const place = places?.[0];
    if (!place?.location) {
        throw new Error(`找不到地點：${textQuery}`);
    }

    return {
        address: place.formattedAddress || textQuery,
        lat: place.location.lat(),
        lng: place.location.lng()
    };
}

async function applyBookingLocation(location, placeData) {
    if (location === "pickup") {
        bookingMapData.pickupLocation = placeData;
        setBookingAddress("pickupAddress", placeData.address);
    }
    else if (location === "dropoff") {
        bookingMapData.destinationLocation = placeData;
        setBookingAddress("dropoffAddress", placeData.address);
    }
    else {
        throw new Error(`不支援的地點類型：${location}`);
    }

    await calculateBookingRoute();
}

async function selectSavedBookingAddress(location, savedAddress) {
    const latitude = Number(savedAddress.lat);
    const longitude = Number(savedAddress.lng);
    const hasCoordinates =
        savedAddress.lat !== "" &&
        savedAddress.lng !== "" &&
        Number.isFinite(latitude) &&
        Number.isFinite(longitude);

    const resolvedLocation = hasCoordinates
        ? {
            address: savedAddress.address,
            lat: latitude,
            lng: longitude
        }
        : await findBookingPlaceByText(savedAddress.address);

    // 常用地址以資料表 address_text 作為訂單地址；缺座標時才由 Places 補座標。
    resolvedLocation.address = savedAddress.address;
    await applyBookingLocation(location, resolvedLocation);
}

async function selectAirportBookingLocation(location, airport, terminal) {
    const searchText =
        airportTerminalSearchText[airport]?.[terminal] ??
        `${airport} ${terminal} 台灣`;
    const resolvedLocation = await findBookingPlaceByText(
        searchText
    );

    // Trip 沒有獨立航廈欄位，因此把航廈與 API 完整地址一併保存。
    resolvedLocation.address =
        `${airport} ${terminal}｜${resolvedLocation.address}`;
    await applyBookingLocation(location, resolvedLocation);
}

function clearBookingLocation(location) {
    if (location === "pickup") {
        resetPickupSelection();
        if (pickupAutocomplete) {
            pickupAutocomplete.value = "";
        }
    }
    else if (location === "dropoff") {
        resetDestinationSelection();
        if (destinationAutocomplete) {
            destinationAutocomplete.value = "";
        }
    }
}

async function calculateBookingRoute() {
    if (
        !bookingMapData.pickupLocation ||
        !bookingMapData.destinationLocation
    ) {
        resetRouteMetrics();
        return;
    }

    resetRouteMetrics();
    const currentRequestVersion = routeRequestVersion;
    const pickupLocation = bookingMapData.pickupLocation;
    const destinationLocation = bookingMapData.destinationLocation;
    updateSummary();

    try {
        const { Route } =
            await google.maps.importLibrary("routes");

        const result = await Route.computeRoutes({
            origin: {
                lat: pickupLocation.lat,
                lng: pickupLocation.lng
            },
            destination: {
                lat: destinationLocation.lat,
                lng: destinationLocation.lng
            },
            travelMode: "DRIVING",
            fields: [
                "distanceMeters",
                "durationMillis"
            ]
        });

        if (!result.routes || result.routes.length === 0) {
            throw new Error("找不到可用路線");
        }

        if (currentRequestVersion !== routeRequestVersion) {
            return;
        }

        const route = result.routes[0];
        if (
            !Number.isFinite(route.distanceMeters) ||
            !Number.isFinite(route.durationMillis)
        ) {
            throw new Error("路線缺少里程或時間資料");
        }

        bookingMapData.estimatedDistanceKm = Number(
            (route.distanceMeters / 1000).toFixed(2)
        );
        bookingMapData.estimatedDuration = Math.ceil(
            route.durationMillis / 1000 / 60
        );
        updateSummary();
    }
    catch (error) {
        console.error("計算路線失敗：", error);

        if (currentRequestVersion !== routeRequestVersion) {
            return;
        }

        resetRouteMetrics();
        updateSummary();
    }
}

async function initAutocomplete() {
    const { PlaceAutocompleteElement } =
        await google.maps.importLibrary("places");

    pickupAutocomplete = new PlaceAutocompleteElement({
        includedRegionCodes: ["tw"]
    });
    pickupAutocomplete.placeholder =
        "請輸入出發地、飯店、景點或路名";
    pickupAutocomplete.style.width = "100%";

    destinationAutocomplete = new PlaceAutocompleteElement({
        includedRegionCodes: ["tw"]
    });
    destinationAutocomplete.placeholder =
        "請輸入目的地、飯店、景點或路名";
    destinationAutocomplete.style.width = "100%";

    document
        .getElementById("pickup-autocomplete-container")
        .appendChild(pickupAutocomplete);
    document
        .getElementById("destination-autocomplete-container")
        .appendChild(destinationAutocomplete);

    pickupAutocomplete.addEventListener(
        "gmp-select",
        async event => {
            const location = await getSelectedPlace(event);

            if (!location) {
                resetPickupSelection();
                return;
            }

            selectedPickupValue =
                (pickupAutocomplete.value ?? "").trim();
            await applyBookingLocation("pickup", location);
        }
    );

    destinationAutocomplete.addEventListener(
        "gmp-select",
        async event => {
            const location = await getSelectedPlace(event);

            if (!location) {
                resetDestinationSelection();
                return;
            }

            selectedDestinationValue =
                (destinationAutocomplete.value ?? "").trim();
            await applyBookingLocation("dropoff", location);
        }
    );

    pickupAutocomplete.addEventListener("input", () => {
        const currentValue =
            (pickupAutocomplete.value ?? "").trim();

        if (currentValue !== selectedPickupValue) {
            resetPickupSelection();
        }
    });

    destinationAutocomplete.addEventListener("input", () => {
        const currentValue =
            (destinationAutocomplete.value ?? "").trim();

        if (currentValue !== selectedDestinationValue) {
            resetDestinationSelection();
        }
    });
}

window.initAutocomplete = initAutocomplete;
window.clearBookingLocation = clearBookingLocation;
window.selectSavedBookingAddress = selectSavedBookingAddress;
window.selectAirportBookingLocation = selectAirportBookingLocation;
