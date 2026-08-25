namespace FinalProject.Models 
{
    // 傳遞給 View 的主 ViewModel
    public class OrdersViewModel
    {
        public List<TripOrderDto> FutureOrders { get; set; } = new List<TripOrderDto>();
        public List<TripOrderDto> HistoryOrders { get; set; } = new List<TripOrderDto>();
    }

    // 單筆訂單結構
    public class TripOrderDto
    {
        public string? OrderNo { get; set; }          // 訂單編號 (order_no)
        public string? CustomerName { get; set; }     // 客戶姓名 (full_name)
        public DateTime DepartureTime { get; set; }  // 出發時間 (departure_time)
        public string? PickupLocation { get; set; }   // 出發地 (pickup_location)
        public string? Destination { get; set; }      // 目的地 (destination)
        public string? FlightNumber { get; set; }     // 航班號碼 (flight_number)
        public byte PassengerCount { get; set; }     // 人數 (passenger_count)
        public byte LuggageCount { get; set; }       // 行李件數 (luggage_count)
        public int Fare { get; set; }                // 費用/車資 (fare)
        public int EstimatedDuration { get; set; }   // 預估行程時間 (estimated_duration)
        public string? TripStatus { get; set; }       // 行程狀態 (trip_status)
    }
}