using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    public class ClientHistoryController : Controller
    {
        private readonly RideHailingDbContext _context;

        public ClientHistoryController(RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult ClientHistory()
        {
            return View();
        }

        // 待處理
        //[HttpGet]
        //public IActionResult GetOrders()
        //{
        //    var orders = _context.Trip
        //        .Select(o => new
        //        {
        //            orderNumber = o.OrderNumber,
        //            status = o.Status,
        //            departureTime = o.DepartureTime,
        //            pickupLocation = o.PickupLocation,
        //            dropoffLocation = o.DropoffLocation,

        //            licensePlate = o.LicensePlate,
        //            carType = o.CarType,

        //            passengerCount = o.PassengerCount,
        //            luggageCount = o.LuggageCount,

        //            price = o.Price,
        //            estimatedMinutes = o.EstimatedMinutes,

        //            passengerName = o.PassengerName,
        //            passengerPhone = o.PassengerPhone,
        //            remark = o.Remark
        //        })
        //        .ToList();

        //    return Json(orders);
        //}




    }
}
