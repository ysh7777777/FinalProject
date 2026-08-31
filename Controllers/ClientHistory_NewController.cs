using FinalProject.DTO;
using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    public class ClientHistory_NewController : Controller
    {
        private readonly RideHailingDbContext _context;

        public ClientHistory_NewController(RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult ClientHistory_New()
        {
            var orders = _context.Trips
                .Select(o => new ClientHistoryViewModel
                {
                    OrderNoView = o.OrderNo,
                    TripStatusView = o.TripStatus,
                    DepartureTimeView = o.DepartureTime,
                    PickupLocationView = o.PickupLocation,
                    DestinationView = o.Destination,

                    LicensePlateView = o.LicensePlate,
                    VehicleTypeView = o.VehicleType,

                    PassengerCountView = o.PassengerCount,
                    LuggageCountView = o.LuggageCount,
                    BabySeatView = o.BabySeat,

                    FareView = o.Fare,
                    EstimatedDurationView = o.EstimatedDuration,
                })
                .ToList();

            return View(orders);
            //return View();
        }

        // 取得訂單 - 待處理
       //[HttpGet]
       // public IActionResult GetOrders()
       // {
       //     var orders = _context.Trips
       //         .Select(o => new
       //         {
       //             orderNumber = o.OrderNo,
       //             status = o.TripStatus,
       //             departureTime = o.DepartureTime,
       //             pickupLocation = o.PickupLocation,
       //             dropoffLocation = o.Destination,

       //             licensePlate = o.LicensePlate,
       //             carType = o.VehicleType,

       //             passengerCount = o.PassengerCount,
       //             luggageCount = o.LuggageCount,
       //             babySeat = o.BabySeat,

       //             fare = o.Fare,
       //             estimatedMinutes = o.EstimatedDuration,

       //             // 可能司機端需要
       //             //passengerName = o.Member,
       //             //passengerPhone = o.PassengerPhone,
       //             //remark = o.Remark
       //         })
       //         .ToList();

       //     return Json(orders);
       // }




    }
}
