using System.Text.Json.Serialization;

namespace FinalProject.Models
{
    public class FlightInfo
    {
        // TDX 取得 Token 的回應結構
        public class TdxTokenResponse
        {
            [JsonPropertyName("access_token")]
            public string? AccessToken { get; set; }

            [JsonPropertyName("expires_in")]
            public int ExpiresIn { get; set; }

            [JsonPropertyName("token_type")]
            public string? TokenType { get; set; }
        }

        // TDX 即時航班 API 回應結構 (節錄核心欄位)
        public class TdxFlightData
        {
            [JsonPropertyName("FlightNumber")]
            public string? FlightNumber { get; set; } // 班機編號 (例: 198)

            [JsonPropertyName("AirlineID")]
            public string? AirlineID { get; set; } // 航空公司代碼 (例: BR)

            [JsonPropertyName("ScheduleDepartureTime")]
            public DateTime? ScheduleDepartureTime { get; set; } // 表訂出發時間

            [JsonPropertyName("ScheduleArrivalTime")]
            public DateTime? ScheduleArrivalTime { get; set; } // 表訂抵達時間

            [JsonPropertyName("EstimatedArrivalTime")]
            public DateTime? EstimatedArrivalTime { get; set; } // 預估抵達時間

            [JsonPropertyName("ArrivalRemark")]
            public string? ArrivalRemark { get; set; } // 狀態 (例: 準時 On Time, 延誤 Delayed, 抵達 Arrived)
        }
    }
}
