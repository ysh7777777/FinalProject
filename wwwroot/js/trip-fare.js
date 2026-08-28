(function () {
    "use strict";

    const farePerKilometer = 20;

    function hasValidCoordinate(value) {
        return Number.isFinite(value) && value !== 0;
    }

    async function calculateTripFare(trip) {
        if (
            !trip ||
            !hasValidCoordinate(trip.pickupLat) ||
            !hasValidCoordinate(trip.pickupLng) ||
            !hasValidCoordinate(trip.destinationLat) ||
            !hasValidCoordinate(trip.destinationLng)
        ) {
            throw new Error("Trip 缺少有效的起點或終點座標");
        }

        const baseFare = Number(trip.baseFare);

        if (!Number.isFinite(baseFare)) {
            throw new Error("Trip 缺少有效的車型起徵價");
        }

        const { Route } = await google.maps.importLibrary("routes");
        const result = await Route.computeRoutes({
            origin: {
                lat: trip.pickupLat,
                lng: trip.pickupLng
            },
            destination: {
                lat: trip.destinationLat,
                lng: trip.destinationLng
            },
            travelMode: "DRIVING",
            fields: ["distanceMeters"]
        });

        if (!result.routes?.length) {
            throw new Error("找不到可用路線");
        }

        const distanceMeters = result.routes[0].distanceMeters;

        if (!Number.isFinite(distanceMeters)) {
            throw new Error("Google Routes API 未回傳有效里程");
        }

        const distanceKm = Number((distanceMeters / 1000).toFixed(2));
        const fare = Math.round(baseFare + distanceKm * farePerKilometer);

        return {
            distanceKm,
            fare
        };
    }

    async function updateTripFareDisplay(trip, elementId) {
        const fareElement = document.getElementById(elementId);

        if (!fareElement) {
            return;
        }

        fareElement.textContent = "計算中...";

        try {
            const result = await calculateTripFare(trip);
            fareElement.textContent = `${result.fare.toLocaleString()} 元`;
        }
        catch (error) {
            console.error("重新計算車資失敗：", error);
            fareElement.textContent = "暫時無法計算";
        }
    }

    window.calculateTripFare = calculateTripFare;
    window.updateTripFareDisplay = updateTripFareDisplay;
})();
