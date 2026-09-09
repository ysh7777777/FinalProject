// 你的 API 金鑰
const apiKey = "CWA-2B331DB4-42CA-4B6B-B9D1-C382642E05CE"; // 請替換為你自己的 API 金鑰

async function showWeather(item) {
    const addressElement = item.querySelector(".route-address");
    const icon = item.querySelector(".weatherIcon");
    const departureTimeElement = item
        .closest(".order-info")
        ?.querySelector(".departure-time");
  

    if (!addressElement || !icon || !departureTimeElement) {
        console.error("找不到 city、weatherIcon 或 departure-time 元素");
        return;
    }

    const address = (addressElement.dataset.city || addressElement.textContent)
        .trim()
        .replace(/台/g, "臺");

    let city;

    if (address.includes("桃園國際機場")) {
        city = "桃園市";
    } else if (address.includes("臺北國際機場") || address.includes("松山機場")) {
        city = "臺北市";
    } else if (address.includes("臺中國際機場")) {
        city = "臺中市";
    } else if (address.includes("高雄國際機場")) {
        city = "高雄市";
    } else {
        city = address.match(
            /臺北市|新北市|桃園市|臺中市|臺南市|高雄市|基隆市|新竹市|嘉義市|新竹縣|苗栗縣|彰化縣|南投縣|雲林縣|嘉義縣|屏東縣|宜蘭縣|花蓮縣|臺東縣|澎湖縣|金門縣|連江縣/,
        )?.[0];
    }

    icon.hidden = true;

    try {
        if (!city) {
            throw new Error("地址中找不到縣市名稱");
        }

        const timeText = departureTimeElement.textContent.trim();
        const departureTime = parseChineseDateTime(timeText);

        if (!departureTime) {
            throw new Error(`出發時間格式有誤：${timeText}`);
        }

        const response = await fetch(
            `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-D0047-091?Authorization=${apiKey}&LocationName=${encodeURIComponent(city)}`,
        );

        if (!response.ok) {
            throw new Error(`天氣查詢失敗：${response.status}`);
        }

        const data = await response.json();

        const locations = data.records?.Locations?.[0]?.Location;

        if (!locations) {
            throw new Error("API 回傳資料格式不正確");
        }

        const location = locations.find((x) => x.LocationName === city);

        if (!location) {
            throw new Error(`找不到 ${city} 的天氣資料`);
        }

        // 找到「天氣現象」這個預報項目
        const weatherElement = location.WeatherElement.find(
            (x) => x.ElementName === "天氣現象",
        );

        if (!weatherElement) {
            throw new Error("找不到天氣現象資料");
        }

        // 找到出發時間所在的預報時段
        const forecast = weatherElement.Time.find((time) => {
            const startTime = new Date(time.StartTime);
            const endTime = new Date(time.EndTime);

            return departureTime >= startTime && departureTime < endTime;
        });

        if (!forecast) {
            throw new Error("出發時間不在目前可查詢的天氣預報範圍內");
        }

        const description = forecast.ElementValue?.[0]?.Weather;

        if (!description) {
            throw new Error("預報資料中沒有天氣描述");
        }

        const hour = departureTime.getHours();
        const isDay = hour >= 6 && hour < 18;

        icon.src = createWeatherSvg(description, isDay);
        icon.alt = description;
        icon.title = description;
        icon.hidden = false;


    } catch (error) {
        icon.hidden = true;



        // 只在開發者工具 Console 留下錯誤，方便檢查
        console.error("天氣顯示失敗：", error);
    }
}
function parseChineseDateTime(value) {
    const match = value.match(
        /^(\d{4})\/(\d{1,2})\/(\d{1,2})\s*(上午|下午)\s*(\d{1,2}):(\d{2}):(\d{2})$/,
    );

    if (!match) {
        return null;
    }

    const [, year, month, day, period, hourText, minute, second] = match;

    let hour = Number(hourText);

    if (period === "上午" && hour === 12) {
        hour = 0;
    }

    if (period === "下午" && hour !== 12) {
        hour += 12;
    }

    return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        hour,
        Number(minute),
        Number(second),
    );
}
// 修改：每個路線區塊都分別查詢一次
document.querySelectorAll(".route-item").forEach((item) => {
    showWeather(item);
});

function createWeatherSvg(description, isDay) {
    let emoji = isDay ? "☀️" : "🌙";
   let background = isDay ? "#fff4c4" : "#dce8ff";

    if (description.includes("雷")) {
        emoji = "⛈️";
    //    background = "#e4e4f3";
    } else if (description.includes("雨")) {
        emoji = "🌧️";
       // background = "#dceeff";
    } else if (description.includes("霧")) {
        emoji = "🌫️";
      //  background = "#e9eef1";
    } else if (description.includes("陰")) {
        emoji = "☁️";
     //   background = "#e8edf1";
    } else if (description.includes("多雲")) {
        emoji = isDay ? "🌥️" : "☁️";
      //  background = "#e6f2f8";
    }

    const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
              
                <text x="48" y="63" text-anchor="middle" font-size="49">${emoji}</text>
            </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
