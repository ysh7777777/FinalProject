// JavaScript

/* =========================================================
   台灣縣市／行政區資料
========================================================== */

const taiwanDistricts = {
    "台北市": ["中正區", "大同區", "中山區", "松山區", "大安區", "萬華區", "信義區", "士林區", "北投區", "內湖區", "南港區", "文山區"],
    "新北市": ["板橋區", "三重區", "中和區", "永和區", "新莊區", "新店區", "樹林區", "鶯歌區", "三峽區", "淡水區", "汐止區", "瑞芳區", "土城區", "蘆洲區", "五股區", "泰山區", "林口區", "深坑區", "石碇區", "坪林區", "三芝區", "石門區", "八里區", "平溪區", "雙溪區", "貢寮區", "金山區", "萬里區", "烏來區"],
    "桃園市": ["桃園區", "中壢區", "平鎮區", "八德區", "楊梅區", "蘆竹區", "大溪區", "龜山區", "大園區", "觀音區", "新屋區", "龍潭區", "復興區"],
    "台中市": ["中區", "東區", "南區", "西區", "北區", "西屯區", "南屯區", "北屯區", "豐原區", "大里區", "太平區", "清水區", "沙鹿區", "大甲區", "東勢區", "梧棲區", "烏日區", "神岡區", "大肚區", "大雅區", "后里區", "霧峰區", "潭子區", "龍井區", "外埔區", "和平區", "石岡區", "大安區", "新社區"],
    "台南市": ["中西區", "東區", "南區", "北區", "安平區", "安南區", "永康區", "歸仁區", "新化區", "左鎮區", "玉井區", "楠西區", "南化區", "仁德區", "關廟區", "龍崎區", "官田區", "麻豆區", "佳里區", "西港區", "七股區", "將軍區", "學甲區", "北門區", "新營區", "後壁區", "白河區", "東山區", "六甲區", "下營區", "柳營區", "鹽水區", "善化區", "大內區", "山上區", "新市區", "安定區"],
    "高雄市": ["新興區", "前金區", "苓雅區", "鹽埕區", "鼓山區", "旗津區", "前鎮區", "三民區", "楠梓區", "小港區", "左營區", "仁武區", "大社區", "岡山區", "路竹區", "阿蓮區", "田寮區", "燕巢區", "橋頭區", "梓官區", "彌陀區", "永安區", "湖內區", "鳳山區", "大寮區", "林園區", "鳥松區", "大樹區", "旗山區", "美濃區", "六龜區", "內門區", "杉林區", "甲仙區", "桃源區", "那瑪夏區", "茂林區"],
    "基隆市": ["中正區", "七堵區", "暖暖區", "仁愛區", "中山區", "安樂區", "信義區"],
    "新竹市": ["東區", "北區", "香山區"],
    "新竹縣": ["竹北市", "竹東鎮", "新埔鎮", "關西鎮", "湖口鄉", "新豐鄉", "芎林鄉", "橫山鄉", "北埔鄉", "寶山鄉", "峨眉鄉", "尖石鄉", "五峰鄉"],
    "苗栗縣": ["苗栗市", "苑裡鎮", "通霄鎮", "竹南鎮", "頭份市", "後龍鎮", "卓蘭鎮", "大湖鄉", "公館鄉", "銅鑼鄉", "南庄鄉", "三義鄉", "西湖鄉", "造橋鄉", "三灣鄉", "獅潭鄉", "泰安鄉"],
    "彰化縣": ["彰化市", "員林市", "和美鎮", "鹿港鎮", "溪湖鎮", "二林鎮", "田中鎮", "北斗鎮", "花壇鄉", "芬園鄉", "大村鄉", "永靖鄉", "伸港鄉", "線西鄉", "福興鄉", "秀水鄉", "埔心鄉", "埔鹽鄉", "大城鄉", "芳苑鄉", "竹塘鄉", "社頭鄉", "二水鄉", "田尾鄉", "埤頭鄉", "溪州鄉"],
    "南投縣": ["南投市", "埔里鎮", "草屯鎮", "竹山鎮", "集集鎮", "名間鄉", "鹿谷鄉", "中寮鄉", "魚池鄉", "國姓鄉", "水里鄉", "信義鄉", "仁愛鄉"],
    "雲林縣": ["斗六市", "斗南鎮", "虎尾鎮", "西螺鎮", "土庫鎮", "北港鎮", "古坑鄉", "大埤鄉", "莿桐鄉", "林內鄉", "二崙鄉", "崙背鄉", "麥寮鄉", "東勢鄉", "褒忠鄉", "臺西鄉", "元長鄉", "四湖鄉", "口湖鄉", "水林鄉"],
    "嘉義市": ["東區", "西區"],
    "嘉義縣": ["太保市", "朴子市", "布袋鎮", "大林鎮", "民雄鄉", "溪口鄉", "新港鄉", "六腳鄉", "東石鄉", "義竹鄉", "鹿草鄉", "水上鄉", "中埔鄉", "竹崎鄉", "梅山鄉", "番路鄉", "大埔鄉", "阿里山鄉"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧臺鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"],
    "宜蘭縣": ["宜蘭市", "羅東鎮", "蘇澳鎮", "頭城鎮", "礁溪鄉", "壯圍鄉", "員山鄉", "冬山鄉", "五結鄉", "三星鄉", "大同鄉", "南澳鄉"],
    "花蓮縣": ["花蓮市", "鳳林鎮", "玉里鎮", "新城鄉", "吉安鄉", "壽豐鄉", "秀林鄉", "光復鄉", "豐濱鄉", "瑞穗鄉", "萬榮鄉", "卓溪鄉", "富里鄉"],
    "台東縣": ["台東市", "成功鎮", "關山鎮", "卑南鄉", "鹿野鄉", "池上鄉", "東河鄉", "長濱鄉", "太麻里鄉", "大武鄉", "綠島鄉", "蘭嶼鄉", "延平鄉", "海端鄉", "達仁鄉", "金峰鄉"],
    "澎湖縣": ["馬公市", "湖西鄉", "白沙鄉", "西嶼鄉", "望安鄉", "七美鄉"],
    "金門縣": ["金城鎮", "金湖鎮", "金沙鎮", "金寧鄉", "烈嶼鄉", "烏坵鄉"],
    "連江縣": ["南竿鄉", "北竿鄉", "莒光鄉", "東引鄉"]
};

/* =========================================================
   機場資料
========================================================== */
const airportData = {
    "桃園國際機場": ["第一航廈 T1", "第二航廈 T2"],
    "臺北松山機場": ["國內線航廈", "國際線航廈"],
    "臺中國際機場": ["國際航廈", "國內航廈"],
    "高雄國際機場": ["國際航廈", "國內航廈"]
};
/* =========================================================
   Flatpickr
========================================================== */
flatpickr("#rideDate", {
    locale: "zh_tw",
    dateFormat: "Y-m-d",
    minDate: "today",
    disableMobile: true,
    onChange: function () {
        updateSummary();
    }
});
/* =========================================================
   建立時間下拉
========================================================== */
const rideHour = document.getElementById("rideHour");
const rideMinute = document.getElementById("rideMinute");
for (let hour = 0; hour < 24; hour++) {
    const option = document.createElement("option");
    option.value = String(hour).padStart(2, "0");
    option.textContent = String(hour).padStart(2, "0");
    rideHour.appendChild(option);
}
for (let minute = 0; minute < 60; minute += 5) {
    const option = document.createElement("option");
    option.value = String(minute).padStart(2, "0");
    option.textContent = String(minute).padStart(2, "0");
    rideMinute.appendChild(option);
}
rideHour.addEventListener("change", updateSummary);
rideMinute.addEventListener("change", updateSummary);
/* =========================================================
   功能：初始化縣市
========================================================== */
function initializeCitySelect(selectId) {
    const select = document.getElementById(selectId);
    Object.keys(taiwanDistricts).forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        select.appendChild(option);
    });
}
initializeCitySelect("pickupCity");
initializeCitySelect("dropoffCity");
/* =========================================================
   功能：縣市 → 行政區
========================================================== */
function bindDistrictSelect(citySelectId, districtSelectId) {
    const citySelect = document.getElementById(citySelectId);
    const districtSelect = document.getElementById(districtSelectId);
    citySelect.addEventListener("change", function () {
        const city = this.value;
        districtSelect.innerHTML = "";
        if (!city) {
            districtSelect.disabled = true;
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "請先選擇縣市";
            districtSelect.appendChild(option);
            updateSummary();
            return;
        }
        districtSelect.disabled = false;
        const firstOption = document.createElement("option");
        firstOption.value = "";
        firstOption.textContent = "請選擇行政區";
        districtSelect.appendChild(firstOption);
        taiwanDistricts[city].forEach(district => {
            const option = document.createElement("option");
            option.value = district;
            option.textContent = district;
            districtSelect.appendChild(option);
        });
        updateSummary();
    });
    districtSelect.addEventListener("change", updateSummary);
}
bindDistrictSelect("pickupCity", "pickupDistrict");
bindDistrictSelect("dropoffCity", "dropoffDistrict");
/* =========================================================
   功能：初始化機場
========================================================== */
function initializeAirportSelect(selectId) {
    const select = document.getElementById(selectId);
    Object.keys(airportData).forEach(airport => {
        const option = document.createElement("option");
        option.value = airport;
        option.textContent = airport;
        select.appendChild(option);
    });
}
initializeAirportSelect("pickupAirport");
initializeAirportSelect("dropoffAirport");
/* =========================================================
   功能：機場 → 航廈
========================================================== */
function bindTerminalSelect(airportSelectId, terminalSelectId) {
    const airportSelect = document.getElementById(airportSelectId);
    const terminalSelect = document.getElementById(terminalSelectId);
    airportSelect.addEventListener("change", function () {
        const airport = this.value;
        terminalSelect.innerHTML = "";
        if (!airport) {
            terminalSelect.disabled = true;
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "請先選擇機場";
            terminalSelect.appendChild(option);
            updateSummary();
            return;
        }
        terminalSelect.disabled = false;
        const firstOption = document.createElement("option");
        firstOption.value = "";
        firstOption.textContent = "請選擇航廈";
        terminalSelect.appendChild(firstOption);
        airportData[airport].forEach(terminal => {
            const option = document.createElement("option");
            option.value = terminal;
            option.textContent = terminal;
            terminalSelect.appendChild(option);
        });
        updateSummary();
    });
    terminalSelect.addEventListener("change", updateSummary);
}
bindTerminalSelect("pickupAirport", "pickupTerminal");
bindTerminalSelect("dropoffAirport", "dropoffTerminal");
/* =========================================================
   功能：地點類型切換
========================================================== */
function setupLocationSwitch(locationName) {
    const buttons = document.querySelectorAll(
        `[data-location="${locationName}"]`
    );
    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const type = this.dataset.type;
            buttons.forEach(btn => {
                btn.classList.remove("active");
            });
            this.classList.add("active");
            const cityPanel = document.getElementById(
                `${locationName}CityPanel`
            );
            const airportPanel = document.getElementById(
                `${locationName}AirportPanel`
            );
            if (type === "city") {
                cityPanel.classList.remove("d-none-custom");
                airportPanel.classList.add("d-none-custom");
            } else {
                cityPanel.classList.add("d-none-custom");
                airportPanel.classList.remove("d-none-custom");
            }
            updateSummary();
        });
    });
}
setupLocationSwitch("pickup");
setupLocationSwitch("dropoff");
/* =========================================================
   常用地址 → 地址欄
========================================================== */
document
    .getElementById("pickupFavorite")
    .addEventListener("change", function () {
        if (this.value) {
            document
                .getElementById("pickupAddress")
                .value = this.value;
        }
        updateSummary();
    });
document
    .getElementById("dropoffFavorite")
    .addEventListener("change", function () {
        if (this.value) {
            document
                .getElementById("dropoffAddress")
                .value = this.value;
        }
        updateSummary();
    });
/* =========================================================
   地址輸入
========================================================== */
document
    .getElementById("pickupAddress")
    .addEventListener("input", updateSummary);
document
    .getElementById("dropoffAddress")
    .addEventListener("input", updateSummary);
/* =========================================================
   功能：取得目前地點模式
========================================================== */
function getLocationType(location) {
    const activeButton = document.querySelector(
        `[data-location="${location}"].active`
    );
    return activeButton
        ? activeButton.dataset.type
        : "city";
}
/* =========================================================
   功能：取得地點文字
========================================================== */
function getLocationText(location) {
    const type = getLocationType(location);
    if (type === "city") {
        const city = document.getElementById(
            `${location}City`
        ).value;
        const district = document.getElementById(
            `${location}District`
        ).value;
        const address = document.getElementById(
            `${location}Address`
        ).value.trim();
        const parts = [
            city,
            district,
            address
        ].filter(Boolean);
        return parts.length
            ? parts.join("")
            : "尚未選擇";
    }
    const airport = document.getElementById(
        `${location}Airport`
    ).value;
    const terminal = document.getElementById(
        `${location}Terminal`
    ).value;
    if (!airport) {
        return "尚未選擇";
    }
    return terminal
        ? `${airport}｜${terminal}`
        : airport;
}
/* =========================================================
   上下車互換
========================================================== */
//document
//    .getElementById("swapLocationBtn")
//    .addEventListener("click", function () {
//        swapLocationType();
//        swapCityData();
//        swapAirportData();
//        swapFavoriteData();
//        swapAddressData();
//        updateSummary();
//    });
/* =========================================================
   交換地點類型
========================================================== */
// function swapLocationType() {
//     const pickupType = getLocationType("pickup");
//     const dropoffType = getLocationType("dropoff");
//     setLocationType("pickup", dropoffType);
//     setLocationType("dropoff", pickupType);
// }
// function setLocationType(location, type) {
//     const button = document.querySelector(
//         `[data-location="${location}"][data-type="${type}"]`
//     );
//     if (button) {
//         button.click();
//     }
// }
/* =========================================================
   交換縣市 / 行政區
========================================================== */
// function swapCityData() {
//     const pickupCity = document.getElementById("pickupCity");
//     const dropoffCity = document.getElementById("dropoffCity");
//     const pickupDistrict = document.getElementById("pickupDistrict");
//     const dropoffDistrict = document.getElementById("dropoffDistrict");
//     const cityTemp = pickupCity.value;
//     const districtTemp = pickupDistrict.value;
//     pickupCity.value = dropoffCity.value;
//     dropoffCity.value = cityTemp;
//     refreshDistrict(
//         "pickupCity",
//         "pickupDistrict",
//         pickupDistrict.value
//     );
//     refreshDistrict(
//         "dropoffCity",
//         "dropoffDistrict",
//         districtTemp
//     );
// }
// function refreshDistrict(
//     cityId,
//     districtId,
//     selectedDistrict
// ) {
//     const city = document.getElementById(cityId).value;
//     const district = document.getElementById(districtId);
//     district.innerHTML = "";
//     if (!city) {
//         district.disabled = true;
//         const option = document.createElement("option");
//         option.value = "";
//         option.textContent = "請先選擇縣市";
//         district.appendChild(option);
//         return;
//     }
//     district.disabled = false;
//     const firstOption = document.createElement("option");
//     firstOption.value = "";
//     firstOption.textContent = "請選擇行政區";
//     district.appendChild(firstOption);
//     taiwanDistricts[city].forEach(item => {
//         const option = document.createElement("option");
//         option.value = item;
//         option.textContent = item;
//         if (item === selectedDistrict) {
//             option.selected = true;
//         }
//         district.appendChild(option);
//     });
// }
/* =========================================================
   交換機場
========================================================== */
//function swapAirportData() {
//    const pickupAirport = document.getElementById("pickupAirport");
//    const dropoffAirport = document.getElementById("dropoffAirport");
//    const pickupTerminal = document.getElementById("pickupTerminal");
//    const dropoffTerminal = document.getElementById("dropoffTerminal");
//    const airportTemp = pickupAirport.value;
//    const terminalTemp = pickupTerminal.value;
//    pickupAirport.value = dropoffAirport.value;
//    dropoffAirport.value = airportTemp;
//    refreshTerminal(
//        "pickupAirport",
//        "pickupTerminal",
//        pickupTerminal.value
//    );
//    refreshTerminal(
//        "dropoffAirport",
//        "dropoffTerminal",
//        terminalTemp
//    );
//}
//function refreshTerminal(
//    airportId,
//    terminalId,
//    selectedTerminal
//) {
//    const airport = document.getElementById(airportId).value;
//    const terminal = document.getElementById(terminalId);
//    terminal.innerHTML = "";
//    if (!airport) {
//        terminal.disabled = true;
//        const option = document.createElement("option");
//        option.value = "";
//        option.textContent = "請先選擇機場";
//        terminal.appendChild(option);
//        return;
//    }
//    terminal.disabled = false;
//    const firstOption = document.createElement("option");
//    firstOption.value = "";
//    firstOption.textContent = "請選擇航廈";
//    terminal.appendChild(firstOption);
//    airportData[airport].forEach(item => {
//        const option = document.createElement("option");
//        option.value = item;
//        option.textContent = item;
//        if (item === selectedTerminal) {
//            option.selected = true;
//        }
//        terminal.appendChild(option);
//    });
//}
/* =========================================================
   交換常用地址
========================================================== */
//function swapFavoriteData() {
//    const pickup = document.getElementById("pickupFavorite");
//    const dropoff = document.getElementById("dropoffFavorite");
//    const temp = pickup.value;
//    pickup.value = dropoff.value;
//    dropoff.value = temp;
//}
/* =========================================================
   交換地址
========================================================== */
//function swapAddressData() {
//    const pickup = document.getElementById("pickupAddress");
//    const dropoff = document.getElementById("dropoffAddress");
//    const temp = pickup.value;
//    pickup.value = dropoff.value;
//    dropoff.value = temp;
//}
/* =========================================================
   訂單總覽
========================================================== */
function updateSummary() {
    const date = document.getElementById("rideDate").value;
    const hour = document.getElementById("rideHour").value;
    const minute = document.getElementById("rideMinute").value;
    let rideTime = "尚未選擇";
    // 預設"尚未選擇"；選 日時分 / 日 => 會顯示
    if (date && hour && minute) {
        rideTime = `${date} ${hour}:${minute}`;
    } else if (date) {
        rideTime = date;
    }
    document.getElementById("summaryRideTime").textContent = rideTime;
    document.getElementById("summaryPickup").textContent = getLocationText("pickup");
    document.getElementById("summaryDropoff").textContent = getLocationText("dropoff");
}
/* ======================= 初始化 ======================= */
updateSummary();


// 0811
/* ======================= 動態停靠點 ======================= */
const stopoverContainer =
    document.getElementById(
        "stopoverContainer"
    );
const stopoverEmpty =
    document.getElementById(
        "stopoverEmpty"
    );
const btnAddStop =
    document.getElementById(
        "btnAddStop"
    );
/* 最大停靠點數量 */
const MAX_STOP = 1;
/* 停靠點資料 */
let stopoverData = [];

/* ======================= 建立停靠點 ======================= */
function createStopover() {
    if (
        stopoverData.length >= MAX_STOP
    ) {
        alert(
            `最多只能增加 ${MAX_STOP} 個停靠點。`
        );
        return;
    }
    const stopover = {
        id:
            Date.now() +
            Math.random(),
        address: ""
    };
    stopoverData.push(
        stopover
    );
    renderStopovers();
    updateSummary();
}

/* ======================= 刪除停靠點 ======================= */
function removeStopover(
    stopId
) {
    stopoverData =
        stopoverData.filter(
            item =>
                item.id !== stopId
        );
    renderStopovers();
    updateSummary();
}

/* ======================= 更新停靠點 ======================= */
function updateStopover(
    stopId,
    value
) {
    const stopover =
        stopoverData.find(
            item =>
                item.id === stopId
        );
    if (!stopover) {
        return;
    }
    stopover.address =
        value;
    updateSummary();
}

/* ======================= Render 所有停靠點 ======================= */
function renderStopovers() {
    stopoverContainer.innerHTML = "";
    /* ======================= 沒有停靠點 ======================= */
    if (
        stopoverData.length === 0
    ) {
        stopoverEmpty.classList.remove(
            "d-none"
        );
    } else {
        stopoverEmpty.classList.add(
            "d-none"
        );
    }
    /* ======================= 建立每一個停靠點 ======================= */
    stopoverData.forEach(
        (
            stopover,
            index
        ) => {
            const item =
                document.createElement(
                    "div"
                );
            item.className =
                "stopover-item";
            item.dataset.id =
                stopover.id;

            /* ======================= Label ======================= */
            const label =
                document.createElement(
                    "div"
                );
            label.className =
                "stopover-label";
            label.textContent =
                `停靠點 ${index + 1}`;

            /* ======================= Input ======================= */
            const input =
                document.createElement(
                    "input"
                );
            input.type =
                "text";
            input.className =
                "stopover-input";
            input.placeholder =
                "請輸入停靠地址";
            input.value =
                stopover.address;
            input.addEventListener(
                "input",
                function () {
                    updateStopover(
                        stopover.id,
                        this.value
                    );
                }
            );

            /* ======================= Actions ======================= */
            const actions = document.createElement("div");
            actions.className = "stopover-actions";

            /* ======================= Plus ======================= */
            const addButton =
                document.createElement(
                    "button"
                );
            addButton.type =
                "button";
            addButton.className =
                "stopover-action-btn stopover-add-item";
            addButton.title =
                "增加停靠點";
            addButton.innerHTML =
                '<i class="bi bi-plus-lg"></i>';
            addButton.addEventListener(
                "click",
                function () {
                    createStopover();
                }
            );

            /* ======================= Minus ======================= */
            const removeButton =
                document.createElement(
                    "button"
                );
            removeButton.type = "button";
            removeButton.className = "stopover-action-btn stopover-remove-item";
            removeButton.title = "刪除停靠點";
            removeButton.innerHTML = '<i class="bi bi-dash-lg"></i>';
            removeButton.addEventListener(
                "click",
                function () {
                    removeStopover(
                        stopover.id
                    );
                }
            );
            actions.appendChild(addButton);
            actions.appendChild(removeButton);

            /* ======================= 加入 DOM ======================= */
            item.appendChild(label);
            item.appendChild(input);
            item.appendChild(actions);
            stopoverContainer.appendChild(item);
        }
    );

    /* ======================= 更新底部按鈕狀態 ======================= */
    if (stopoverData.length >= MAX_STOP) {
        btnAddStop.disabled = true;
        btnAddStop.innerHTML = '<i class="bi bi-check-lg"></i> 已達停靠點上限';
    } else {
        btnAddStop.disabled = false;
        btnAddStop.innerHTML = '<i class="bi bi-plus-lg"></i> 增加停靠點';
    }
}

/* ======================= 底部「增加停靠點」 ======================= */
btnAddStop.addEventListener(
    "click",
    function () { createStopover(); }
);

/* ======================= 訂單總覽：取得停靠點文字 ======================= */
function getStopoverSummary() {
    const validStops = stopoverData
        .map(item => item.address.trim())
        .filter(address => address !== "");
    if (validStops.length === 0) {
        return "無";
    }
    return validStops
        .map(
            (address, index) => `${index + 1}. ${address}`
        )
        .join(" / ");
}

/* ======================= 修改原本 updateSummary() ======================= */
/*
如果你上一版已經有 updateSummary()，
請把裡面的內容最後加入：

    document
        .getElementById("summaryStopover")
        .textContent =
        getStopoverSummary();
*/


/* ======================= 初始化 ======================= */
// 依照頁面規劃圖，預設建立 0 個停靠點。
// createStopover();

// 一開始就執行有沒有內容，要不要顯示 "尚未增加停靠點" 的判斷
renderStopovers();





/* 0811 STR ------------------------------------------------------------------------------------------- */

/* ======================= 車型選擇 ======================= */
document.addEventListener(
    "DOMContentLoaded",
    function () {
        const carCards =
            document.querySelectorAll(
                ".car-card"
            );
        carCards.forEach(
            function (card) {

                /* ======================= 滑鼠點擊 ======================= */
                card.addEventListener(
                    "click",
                    function () {
                        selectCar(this);
                    }
                );

                /* ======================= 鍵盤操作 Enter / Space ======================= */
                card.addEventListener(
                    "keydown",
                    function (event) {
                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            selectCar(this);
                        }
                    }
                );
            }
        );

        /* ======================= 車型選擇 ======================= */
        function selectCar(card) {

            /* ----------------------- 先取消所有車型 ----------------------- */
            carCards.forEach(
                function (item) {
                    item.classList.remove(
                        "selected"
                    );
                    const status =
                        item.querySelector(
                            ".car-select-status"
                        );
                    if (status) {
                        status.innerHTML = `
                            <i class="bi bi-circle"></i>
                            選擇此車型
                        `;
                    }
                }
            );

            /* ----------------------- 選取目前車型 ----------------------- */
            card.classList.add(
                "selected"
            );
            const status =
                card.querySelector(
                    ".car-select-status"
                );
            if (status) {
                status.innerHTML = `
                    <i class="bi bi-check-circle-fill"></i>
                    已選擇
                `;
            }

            /* ----------------------- 取得車型資料，從 HTML data-* 取得 ----------------------- */
            const carId =
                card.dataset.carId;
            const carName =
                card.dataset.carName;
            const passengers =
                card.dataset.passengers;
            const luggage =
                card.dataset.luggage;
            const price =
                card.dataset.price;

            /* ----------------------- 儲存目前選擇的車型 ----------------------- */
            window.selectedCar = {
                id: carId,
                name: carName,
                passengers: passengers,
                luggage: luggage,
                price: price
            };

            /* ----------------------- 更新訂單總覽 ----------------------- */
            updateCarSummary();
        }

        /* ======================= 訂單總覽 ======================= */
        function updateCarSummary() {
            const summaryCar = document.getElementById( "summaryCar" );
            
            if ( !summaryCar || !window.selectedCar  ) { return; }
            
            const car = window.selectedCar;
            summaryCar.innerHTML = `
                <strong>
                    ${car.name}
                </strong>
                <div class="small text-muted mt-1">
                    ${car.passengers} 人
                    ／
                    ${car.luggage} 件行李
                    ／
                    NT$${Number(
                car.price
            ).toLocaleString()} 起
                </div>
            `;
        }
    }
);
/* 0811 END ------------------------------------------------------------------------------------------- */





/* 0812 STR 數量控制 ------------------------------------------------------------------------------------------- */

/* ======================= 人數 / 行李 / 嬰兒座椅 ======================= */
document.addEventListener("DOMContentLoaded", function () {

    /* ======================= 取得元素 ======================= */
    const passengerInput = document.getElementById("passengerCount");
    const luggageInput = document.getElementById("luggageCount");
    const babySeatInput = document.getElementById("babySeatCount");
    const passengerMinus = document.getElementById("passengerMinus");
    const passengerPlus = document.getElementById("passengerPlus");
    const luggageMinus = document.getElementById("luggageMinus");
    const luggagePlus = document.getElementById("luggagePlus");
    const babySeatMinus = document.getElementById("babySeatMinus");
    const babySeatPlus = document.getElementById("babySeatPlus");
    const passengerLimit = document.getElementById("passengerLimit");
    const luggageLimit = document.getElementById("luggageLimit");
    const babySeatLimit = document.getElementById("babySeatLimit");
    /* ----------------------- 0813 test ----------------------- */
    const summaryPassengers = document.getElementById("summaryPassengers");
    const summaryLuggage = document.getElementById("summaryLuggage");
    const summaryBabySeat = document.getElementById("summaryBabySeat");
    /* ----------------------- 0813 test ----------------------- */
    
    /* ----------------------- 0813 test ----------------------- */
    function updateSummary() {
        summaryPassengers.textContent = `${passengerInput.value} 人`;
        summaryLuggage.textContent = `${luggageInput.value} 件`;
        summaryBabySeat.textContent = `${babySeatInput.value} 張`;
    }
    /* ----------------------- 0813 test ----------------------- */







    /* ======================= 目前車型限制 ======================= */
    let maxPassengers = 1;
    let maxLuggage = 0;
    let maxBabySeats = 0;

    /* ======================= 更新限制 ======================= */
    function updateQuantityLimits(passengers, luggage) {
        maxPassengers = Number(passengers);
        maxLuggage = Number(luggage);
        /*
            嬰兒座椅上限：
            車型人數 - 1
            例如：
            3人車 → 最多2張
            6人車 → 最多5張
        */
        maxBabySeats = Math.max(maxPassengers - 1, 0);

        /* ----------------------- 更新 HTML input max ----------------------- */
        passengerInput.max = maxPassengers;
        luggageInput.max = maxLuggage;
        babySeatInput.max = maxBabySeats;

        /* ----------------------- 修正目前數值 ----------------------- */
        passengerInput.value = clampValue(
            passengerInput.value,
            1,
            maxPassengers
        );
        luggageInput.value = clampValue(
            luggageInput.value,
            0,
            maxLuggage
        );
        babySeatInput.value = clampValue(
            babySeatInput.value,
            0,
            maxBabySeats
        );

        /* ----------------------- 顯示上限 ----------------------- */
        passengerLimit.innerHTML = `最多 ${maxPassengers} 人`;
        luggageLimit.innerHTML = `最多 ${maxLuggage} 件`;
        babySeatLimit.innerHTML = `最多 ${maxBabySeats} 張`;
        passengerLimit.classList.add("active");
        luggageLimit.classList.add("active");
        babySeatLimit.classList.add("active");

        /* ----------------------- 更新按鈕 disabled ----------------------- */
        updateButtonState();
    }

    /* ======================= 數值限制 ======================= */
    function clampValue(value, min, max) {
        let number = parseInt(value, 10);
        if (Number.isNaN(number)) { number = min; }
        return Math.min( Math.max(number, min), max );
    }

    /* ======================= 更新按鈕狀態 ======================= */
    function updateButtonState() {
        /* 人數 */
        passengerMinus.disabled = Number(passengerInput.value) <= 1;
        passengerPlus.disabled =  Number(passengerInput.value) >= maxPassengers;
        /* 行李 */
        luggageMinus.disabled =  Number(luggageInput.value) <= 0;
        luggagePlus.disabled =   Number(luggageInput.value) >= maxLuggage;
        /* 嬰兒座椅 */
        babySeatMinus.disabled = Number(babySeatInput.value) <= 0;
        babySeatPlus.disabled =  Number(babySeatInput.value) >= maxBabySeats;
        /* 更新摘要 */
        updateSummary();
    }

    /* ======================= 改變數量 ======================= */
    function changeQuantity(input, amount, min, max) {
        const current = Number(input.value) || min;
        const newValue = current + amount;
        input.value = clampValue(
            newValue,
            min,
            max
        );
        updateButtonState();
    }

    /* ======================= 人數 ======================= */
    passengerMinus.addEventListener("click", function () {
        changeQuantity(
            passengerInput,
            -1,
            1,
            maxPassengers
        );
    });
    passengerPlus.addEventListener("click", function () {
        changeQuantity(
            passengerInput,
            1,
            1,
            maxPassengers
        );
    });

    /* ======================= 行李 ======================= */
    luggageMinus.addEventListener("click", function () {
        changeQuantity(
            luggageInput,
            -1,
            0,
            maxLuggage
        );
    });
    luggagePlus.addEventListener("click", function () {
        changeQuantity(
            luggageInput,
            1,
            0,
            maxLuggage
        );
    });

    /* ======================= 嬰兒座椅 ======================= */
    babySeatMinus.addEventListener("click", function () {
        changeQuantity(
            babySeatInput,
            -1,
            0,
            maxBabySeats
        );
    });
    babySeatPlus.addEventListener("click", function () {
        changeQuantity(
            babySeatInput,
            1,
            0,
            maxBabySeats
        );
    });

    /* ======================= 手動輸入 ======================= */
    passengerInput.addEventListener("input", function () {
        this.value = clampValue(
            this.value,
            1,
            maxPassengers
        );
        updateButtonState();
    });
    luggageInput.addEventListener("input", function () {
        this.value = clampValue(
            this.value,
            0,
            maxLuggage
        );
        updateButtonState();
    });
    babySeatInput.addEventListener("input", function () {
        this.value = clampValue(
            this.value,
            0,
            maxBabySeats
        );
        updateButtonState();
    });

    /* ======================= 車型選擇 ======================= */
    const carCards = document.querySelectorAll(".car-card");
    carCards.forEach(function (card) {
        card.addEventListener("click", function () {
            const passengers = this.dataset.passengers;
            const luggage = this.dataset.luggage;
            updateQuantityLimits(
                passengers,
                luggage
            );
        });
    });

    /* ======================= 初始狀態 ======================= */
    updateButtonState();
});

/* 0812 END 數量控制 ------------------------------------------------------------------------------------------- */




/* 0812 STR 追蹤航班 Checkbox ------------------------------------------------------------------------------------------- */

/* ======================= 航班追蹤 ======================= */
document.addEventListener("DOMContentLoaded", function () {
    const trackFlight = document.getElementById("trackFlight");
    const flightNumberWrapper = document.getElementById("flightNumberWrapper");
    const flightNumber = document.getElementById("flightNumber");

    /* ======================= Checkbox 切換 ======================= */
    trackFlight.addEventListener("change", function () {
        if (this.checked) {
            /* 顯示 */
            flightNumberWrapper.classList.remove("d-none");
            /* 必填 */
            flightNumber.required = true;
            /* 自動 Focus */
            setTimeout(function () {
                flightNumber.focus();
            }, 100);
        } else {
            /* 隱藏 */
            flightNumberWrapper.classList.add("d-none");
            /* 取消必填 */
            flightNumber.required = false;
            /* 清空 */
            flightNumber.value = "";
            flightNumber.classList.remove("is-invalid");
        }
        updateFlightSummary();

    });
    /* 新-決定不使用 
    trackFlight.addEventListener("change", function () {
        if (this.checked) {
            flightNumberWrapper.classList.remove("d-none");
            flightNumber.required = true;
        } else {
            flightNumberWrapper.classList.add("d-none");
            flightNumber.required = false;
            flightNumber.value = "";
        }
        updateFlightSummary();
    });
    */
    
    /* ======================= 航班編號自動轉大寫 ======================= */
    flightNumber.addEventListener("input", function () {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        updateFlightSummary();
    });

});

/* 0812 END 追蹤航班 Checkbox ------------------------------------------------------------------------------------------- */



/* 0812 STR 航班「有填寫才顯示」 ------------------------------------------------------------------------------------------- */
function updateFlightSummary() {
    const trackFlight = document.getElementById("trackFlight");
    const flightNumber = document.getElementById("flightNumber");
    const summaryFlightRow = document.getElementById("summaryFlightRow");
    const summaryFlight = document.getElementById("summaryFlight");

    /*
     * 必須：
     * 1. Checkbox 有勾
     * 2. 航班編號有填寫
     */
    if (trackFlight.checked && flightNumber.value.trim() !== "") {
        summaryFlightRow.classList.remove("d-none");
        summaryFlight.textContent = flightNumber.value.trim().toUpperCase();
    } else {
        summaryFlightRow.classList.add("d-none");
        summaryFlight.textContent = "-";
    }
}
/* 0812 END 航班「有填寫才顯示」 ------------------------------------------------------------------------------------------- */


/* 0820 STR 送出訂單 ------------------------------------------------------------------------------------------- */
const bookingForm = document.getElementById("bookingForm");
const submitOrderBtn = document.getElementById("submitOrderBtn");
const submitOrderSpinner = document.getElementById("submitOrderSpinner");
const submitBtnText = document.querySelector(".submit-btn-text");

bookingForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        /* =================================================
           Bootstrap 表單驗證
        ================================================== */

        if (!bookingForm.checkValidity()) {
            event.stopPropagation();
            bookingForm.classList.add( "was-validated" );

            /*
             * 找到第一個錯誤欄位
             */

            const firstInvalid = bookingForm.querySelector( ":invalid" );

            if (firstInvalid) { firstInvalid.focus(); }
            return;
        }
        /*
         * 通過驗證
         */
        bookingForm.classList.add( "was-validated" );


        /* =================================================
           送出中
        ================================================== */
        submitOrderBtn.disabled = true;
        submitOrderSpinner.classList.remove( "d-none" );
        submitBtnText.textContent = "訂單送出中...";
        /*
         * 這裡之後接後端 API
         */
        console.log( "訂單驗證成功，準備送出" );
    }
);
/* 0820 END 送出訂單 ------------------------------------------------------------------------------------------- */


