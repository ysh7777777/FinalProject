using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FinalProject.Services
{
    // 1. TDX Token 回應結構 (已定義 TdxTokenResponse)
    public class TdxTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }
    }

    // 2. TDX 航班資料結構 (使用 TdxFlightData)
    public class TdxFlightData
    {
        [JsonPropertyName("FlightNumber")]
        public string FlightNumber { get; set; } = string.Empty;

        [JsonPropertyName("AirlineID")]
        public string AirlineID { get; set; } = string.Empty;

        [JsonPropertyName("DepartureAirportID")]
        public string DepartureAirportID { get; set; } = string.Empty;

        [JsonPropertyName("ArrivalAirportID")]
        public string ArrivalAirportID { get; set; } = string.Empty;

        [JsonPropertyName("ScheduleArrivalTime")]
        public DateTime? ScheduleArrivalTime { get; set; }

        [JsonPropertyName("EstimatedArrivalTime")]
        public DateTime? EstimatedArrivalTime { get; set; }

        [JsonPropertyName("ArrivalRemark")]
        public string ArrivalRemark { get; set; } = string.Empty;
    }

    // 3. TDX 航班服務類別
    public class TdxFlightService
    {
        private readonly HttpClient _httpClient;

        // TODO: 請替換為您在 TDX 平台申請的真實 ID 與 Secret
        private readonly string _clientId = "shihluchin@gmail.com";
        private readonly string _clientSecret = "@Zx3765cv3765";

        private string? _cachedToken;
        private DateTime _tokenExpiry;

        public TdxFlightService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        // 取得或更新 OAuth 2.0 Access Token
        private async Task<string> GetAccessTokenAsync()
        {
            if (!string.IsNullOrEmpty(_cachedToken) && DateTime.UtcNow < _tokenExpiry)
            {
                return _cachedToken;
            }

            var tokenUrl = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
            var dict = new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "client_id", _clientId },
                { "client_secret", _clientSecret }
            };

            var req = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
            {
                Content = new FormUrlEncodedContent(dict)
            };

            var response = await _httpClient.SendAsync(req);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync();
            var tokenData = JsonSerializer.Deserialize<TdxTokenResponse>(json);

            _cachedToken = tokenData?.AccessToken ?? string.Empty;
            _tokenExpiry = DateTime.UtcNow.AddSeconds((tokenData?.ExpiresIn ?? 86400) - 60);

            return _cachedToken;
        }

        // 查詢特定航班即時狀態 (明確定義 GetLiveFlightAsync 方法)
        public async Task<TdxFlightData?> GetLiveFlightAsync(string airlineId, string flightNumber)
        {
            try
            {
                var token = await GetAccessTokenAsync();

                // TDX 桃園機場(TPE)到站航班即時 API
                string apiUrl = $"https://tdx.transportdata.tw/api/basic/v2/Air/FIDS/Airport/Arrival/TPE?$filter=AirlineID eq '{airlineId}' and FlightNumber eq '{flightNumber}'&$format=JSON";

                var request = new HttpRequestMessage(HttpMethod.Get, apiUrl);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                if (!response.IsSuccessStatusCode) return null;

                var json = await response.Content.ReadAsStringAsync();
                var flights = JsonSerializer.Deserialize<List<TdxFlightData>>(json);

                return flights?.FirstOrDefault();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"TDX API 讀取失敗: {ex.Message}");
                return null;
            }
        }
    }
}