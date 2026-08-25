async function initAutocomplete() {

    const { PlaceAutocompleteElement } =
        await google.maps.importLibrary("places");


    const autocomplete =
        new PlaceAutocompleteElement({
            includedRegionCodes: ["tw"]
        });


    autocomplete.placeholder =
        "請輸入地址、飯店、景點或路名";


    document
        .getElementById("autocomplete-container")
        .appendChild(autocomplete);


    // 記錄使用者最後一次「真正選到」的地址文字
    let selectedAutocompleteValue = "";


    // =========================
    // 選到 Google 地址
    // =========================
    autocomplete.addEventListener(
        "gmp-select",
        async (event) => {

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


            // =========================
            // 地址範圍過大檢查
            // =========================
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

                alert(
                    "請選擇更詳細的地址、飯店、景點、車站或機場"
                );

                clearSelectedAddress();

                selectedAutocompleteValue = "";

                return;
            }


            // =========================
            // 座標檢查
            // =========================
            if (!place.location) {

                console.error("找不到地址座標");

                clearSelectedAddress();

                selectedAutocompleteValue = "";

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


            // =========================
            // 填入資料
            // =========================
            document.getElementById(
                "formattedAddressDisplay"
            ).value = address ?? "";


            document.getElementById(
                "formattedAddress"
            ).value = address ?? "";


            document.getElementById(
                "latitude"
            ).value = lat;


            document.getElementById(
                "longitude"
            ).value = lng;


            document.getElementById(
                "placeId"
            ).value = placeId ?? "";


            // 等 Google 元件更新完搜尋框文字後，
            // 記住目前真正選取的內容
            setTimeout(() => {

                selectedAutocompleteValue =
                    autocomplete.value ?? "";

            }, 0);

        });


    // =========================
    // 監控搜尋框內容
    // =========================
    setInterval(() => {

        const currentValue =
            (autocomplete.value ?? "").trim();


        // 搜尋框被清空
        if (currentValue === "") {

            clearSelectedAddress();

            selectedAutocompleteValue = "";

            return;
        }


        // 原本已經選過地址，
        // 但使用者後來又修改搜尋文字
        if (
            selectedAutocompleteValue !== "" &&
            currentValue !== selectedAutocompleteValue
        ) {

            clearSelectedAddress();

        }

    }, 200);

}


// =========================
// 清空已選地址資料
// =========================
function clearSelectedAddress() {

    document.getElementById(
        "formattedAddressDisplay"
    ).value = "";


    document.getElementById(
        "formattedAddress"
    ).value = "";


    document.getElementById(
        "latitude"
    ).value = "";


    document.getElementById(
        "longitude"
    ).value = "";


    document.getElementById(
        "placeId"
    ).value = "";
}


window.initAutocomplete =
    initAutocomplete;