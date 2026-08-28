let savedAddressAutocomplete = null;
let selectedAutocompleteValue = "";
let keepExistingAddressWhileSearchIsEmpty = false;

async function initAutocomplete() {
    const container = document.getElementById("autocomplete-container");
    if (!container) {
        return;
    }

    const { PlaceAutocompleteElement } = await google.maps.importLibrary("places");
    savedAddressAutocomplete = new PlaceAutocompleteElement({
        includedRegionCodes: ["tw"]
    });
    savedAddressAutocomplete.placeholder = "請輸入地址、飯店、景點或路名";
    container.replaceChildren(savedAddressAutocomplete);

    savedAddressAutocomplete.addEventListener("gmp-select", async (event) => {
        const prediction = event.placePrediction;
        if (!prediction) {
            clearSelectedAddress();
            return;
        }

        const place = prediction.toPlace();
        await place.fetchFields({
            fields: ["id", "formattedAddress", "location", "types"]
        });

        const invalidTypes = [
            "administrative_area_level_1",
            "administrative_area_level_2",
            "locality"
        ];
        const isTooBroad = place.types?.some((type) => invalidTypes.includes(type));

        if (isTooBroad) {
            alert("請選擇更詳細的地址、飯店、景點、車站或機場。");
            clearSelectedAddress();
            savedAddressAutocomplete.value = "";
            return;
        }

        if (!place.location || !place.formattedAddress) {
            alert("找不到完整地址或座標，請重新選擇。");
            clearSelectedAddress();
            return;
        }

        setFieldValue("formattedAddressDisplay", place.formattedAddress);
        setFieldValue("formattedAddress", place.formattedAddress);
        setFieldValue("latitude", place.location.lat());
        setFieldValue("longitude", place.location.lng());
        setFieldValue("placeId", place.id ?? "");

        keepExistingAddressWhileSearchIsEmpty = false;
        window.setTimeout(() => {
            selectedAutocompleteValue = (savedAddressAutocomplete?.value ?? "").trim();
        }, 0);
    });

    window.setInterval(validateAutocompleteSelection, 250);
}

function validateAutocompleteSelection() {
    if (!savedAddressAutocomplete) {
        return;
    }

    const currentValue = (savedAddressAutocomplete.value ?? "").trim();

    if (keepExistingAddressWhileSearchIsEmpty && currentValue === "") {
        return;
    }

    if (keepExistingAddressWhileSearchIsEmpty && currentValue !== "") {
        keepExistingAddressWhileSearchIsEmpty = false;
        clearSelectedAddress();
        return;
    }

    if (currentValue === "") {
        if (selectedAutocompleteValue !== "") {
            clearSelectedAddress();
        }
        selectedAutocompleteValue = "";
        return;
    }

    if (selectedAutocompleteValue !== "" && currentValue !== selectedAutocompleteValue) {
        clearSelectedAddress();
        selectedAutocompleteValue = "";
    }
}

function clearSelectedAddress() {
    setFieldValue("formattedAddressDisplay", "");
    setFieldValue("formattedAddress", "");
    setFieldValue("latitude", "");
    setFieldValue("longitude", "");
    setFieldValue("placeId", "");
}

function setFieldValue(id, value) {
    const field = document.getElementById(id);
    if (field) {
        field.value = value ?? "";
    }
}

function beginEdit(button) {
    const form = document.getElementById("saved-address-form");
    if (!form) {
        return;
    }

    form.action = form.dataset.updateUrl;
    setFieldValue("savedAddressId", button.dataset.id);
    setFieldValue("addressName", button.dataset.name);
    setFieldValue("formattedAddressDisplay", button.dataset.address);
    setFieldValue("formattedAddress", button.dataset.address);
    setFieldValue("latitude", button.dataset.latitude);
    setFieldValue("longitude", button.dataset.longitude);
    setFieldValue("placeId", "");

    if (savedAddressAutocomplete) {
        savedAddressAutocomplete.value = "";
    }
    selectedAutocompleteValue = "";
    keepExistingAddressWhileSearchIsEmpty = true;

    document.getElementById("form-title").textContent = "修改常用地址";
    document.getElementById("save-address-button").textContent = "儲存修改";
    document.getElementById("cancel-edit-button").classList.remove("d-none");
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById("addressName").focus({ preventScroll: true });
}

function resetAddressForm() {
    const form = document.getElementById("saved-address-form");
    if (!form) {
        return;
    }

    form.reset();
    form.action = form.dataset.createUrl;
    clearSelectedAddress();
    setFieldValue("savedAddressId", "0");

    if (savedAddressAutocomplete) {
        savedAddressAutocomplete.value = "";
    }
    selectedAutocompleteValue = "";
    keepExistingAddressWhileSearchIsEmpty = false;

    document.getElementById("form-title").textContent = "新增常用地址";
    document.getElementById("save-address-button").textContent = "新增常用地址";
    document.getElementById("cancel-edit-button").classList.add("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".edit-saved-address").forEach((button) => {
        button.addEventListener("click", () => beginEdit(button));
    });

    document.getElementById("cancel-edit-button")?.addEventListener("click", resetAddressForm);

    document.getElementById("saved-address-form")?.addEventListener("submit", (event) => {
        const address = document.getElementById("formattedAddress")?.value.trim();
        const latitude = document.getElementById("latitude")?.value;
        const longitude = document.getElementById("longitude")?.value;

        if (!address || !latitude || !longitude) {
            event.preventDefault();
            alert("請從地址搜尋結果中選擇完整地址後再儲存。");
        }
    });
});

window.initAutocomplete = initAutocomplete;
