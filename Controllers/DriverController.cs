using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using FinalProject.Models;

namespace FinalProject.Controllers
{
    public class DriverController : Controller
    {
        //  1. 宣告用來儲存連線字串的私有欄位 (Private Field)
        private readonly string _connectionString;

        // 2. 建構子 (Constructor)：程式執行時，ASP.NET Core 會自動把 configuration 傳進來
        // 透過 DI 注入讀取 appsettings.json 的連線字串
        public DriverController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("letmesee")
                ?? throw new InvalidOperationException("未找到 letmesee 連線字串");
        }

        // 1. 地圖主頁 (Index.cshtml)
        public IActionResult Index()
        {
            List<Trip> activeTrips = GetActiveTripOrders();
            return View(activeTrips); // 將當前行程傳給 View
        }

        // 私有方法：取得司機當前進行中或下一筆待出發的訂單
        private List<Trip> GetActiveTripOrders()
        {
            string currentDriverId = "DRV001"; // 當前司機編號
            var activeTrips = new List<Trip>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string sql = @"
            SELECT TOP 1
                t.order_no,
                m.full_name AS customer_name,
                t.departure_time,
                t.pickup_location,
                t.destination,
                t.passenger_count,
                t.luggage_count,
                ISNULL(t.estimated_duration, 0) AS estimated_duration,
                t.trip_status
            FROM trip t
            INNER JOIN member m ON t.account = m.account
            WHERE t.assigned_driver_id = @DriverId 
              AND t.trip_status IN ('待出發', '行程中')
            ORDER BY t.departure_time ASC"; // 抓時間最近的那一筆

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@DriverId", currentDriverId);
                    conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            var trip = new Trip
                            {

                                OrderNo = reader["order_no"]?.ToString() ?? string.Empty,
                                Account = reader["account"]?.ToString() ?? string.Empty,
                                DepartureTime = reader["departure_time"] != DBNull.Value ? Convert.ToDateTime(reader["departure_time"]) : DateTime.MinValue,
                                PickupLocation = reader["pickup_location"]?.ToString() ?? string.Empty,
                                Destination = reader["destination"]?.ToString() ?? string.Empty,
                                //FlightNumber = reader["flight_number"]?.ToString() ?? "無",
                                PassengerCount = reader["passenger_count"] != DBNull.Value ? Convert.ToByte(reader["passenger_count"]) : (byte)0,
                                LuggageCount = reader["luggage_count"] != DBNull.Value ? Convert.ToByte(reader["luggage_count"]) : (byte)0,
                                //Fare = reader["fare"] != DBNull.Value ? Convert.ToInt32(reader["fare"]) : 0,
                                EstimatedDuration = reader["estimated_duration"] != DBNull.Value ? Convert.ToInt32(reader["estimated_duration"]) : 0,
                                TripStatus = reader["trip_status"]?.ToString() ?? string.Empty
                            };
                        }
                    }
                }
            }

            return activeTrips;
        }

        // 2. 未來訂單 -> 開啟 Orders.cshtml
        public IActionResult FutureOrders()
        {
            var viewModel = GetDriverOrders();
            ViewBag.ActiveTab = "future";
            return View("Orders", viewModel);
        }

        // 3. 歷史訂單 -> 開啟 Orders.cshtml
        public IActionResult HistoryOrders()
        {
            var viewModel = GetDriverOrders();
            ViewBag.ActiveTab = "history";
            return View("Orders", viewModel);
        }

        // 私有方法：從資料庫讀取司機的所有訂單並分類
        private OrdersViewModel GetDriverOrders()
        {
            var viewModel = new OrdersViewModel();

            // 範例：先固定以 DRV001 作為當前登入司機編號（後續可替換為 Session 或 User.Identity）
            string currentDriverId = "DRV001";

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                // SQL JOIN 連接 trip 與 member 取得客戶姓名
                string sql = @"
                    SELECT 
                        t.order_no,
                        m.full_name AS customer_name,
                        t.departure_time,
                        t.pickup_location,
                        t.destination,
                        t.passenger_count,
                        t.luggage_count,
                        ISNULL(t.estimated_duration, 0) AS estimated_duration,
                        t.trip_status
                    FROM trip t
                    INNER JOIN member m ON t.account = m.account
                    WHERE t.assigned_driver_id = @DriverId
                    ORDER BY t.departure_time DESC";

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@DriverId", currentDriverId);
                    conn.Open();

                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            var item = new Trip
                            {
                                OrderNo = reader["order_no"]?.ToString() ?? string.Empty,
                                Account = reader["account"]?.ToString() ?? string.Empty,
                                DepartureTime = reader["departure_time"] != DBNull.Value ? Convert.ToDateTime(reader["departure_time"]) : DateTime.MinValue,
                                PickupLocation = reader["pickup_location"]?.ToString() ?? string.Empty,
                                Destination = reader["destination"]?.ToString() ?? string.Empty,
                                //FlightNumber = reader["flight_number"]?.ToString() ?? "無",
                                PassengerCount = reader["passenger_count"] != DBNull.Value ? Convert.ToByte(reader["passenger_count"]) : (byte)0,
                                LuggageCount = reader["luggage_count"] != DBNull.Value ? Convert.ToByte(reader["luggage_count"]) : (byte)0,
                                //Fare = reader["fare"] != DBNull.Value ? Convert.ToInt32(reader["fare"]) : 0,
                                EstimatedDuration = reader["estimated_duration"] != DBNull.Value ? Convert.ToInt32(reader["estimated_duration"]) : 0,
                                TripStatus = reader["trip_status"]?.ToString() ?? string.Empty
                            };

                            // 根據行程狀態分類（'待出發'、'行程中' 屬於未來/進行中訂單；'已完成'、'已取消' 屬於歷史訂單）
                            if (item.TripStatus == "已完成" || item.TripStatus == "已取消")
                            {
                                viewModel.HistoryOrders.Add(item);
                            }
                            else
                            {
                                viewModel.FutureOrders.Add(item);
                            }
                        }
                    }
                }
            }

            return viewModel;
        }
    }
}
