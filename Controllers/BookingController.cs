using FinalProject.DTO;
using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

namespace FinalProject.Controllers
{
    public class BookingController : Controller
    {    
        private readonly RideHailingDbContext _context;

        public BookingController(RideHailingDbContext context)
        {
            _context = context;
        }


        //public IActionResult BookingPage()
        //{
        //    return View();
        //}
        // 連接資料庫測試用(成功)
        public async Task<IActionResult> BookingPage(string id)
        {
            var VehicleMenu = await _context.VehicleMenu.ToListAsync();

            ViewBag.VehicleMenu = VehicleMenu;
            ViewData["VehicleMenuSin"] = VehicleMenu;  // 我想要一個一個取

            return View();
            //return View("~/Views/Booking/BookingPage.cshtml", data);
        }

        // 生成訂單編號
        public string GenerateOrderNumber()
        {
            string date = DateTime.Now.ToString("yyyyMMdd");
            string random = new Random().Next(1000, 10000).ToString();

            return $"ORD{date}{random}";
        }

        // 派車邏輯
        public async Task<FindDriverCar> OrderDriver(Trip trip)
        {
            if (trip.DepartureTime is not DateTime departureTime) { return null; }
            if (trip.EstimatedDuration is not int estimatedDuration) { return null; }
            int eta = 30; DateTime taskStart = departureTime.AddMinutes(-eta); DateTime taskEnd = departureTime.AddMinutes(estimatedDuration + eta);

            var Find = await _context.DriverShiftSchedules
                        .AsNoTracking()
                        .Include(schedule => schedule.LicensePlateNavigation)
                        .Where(schedule =>
                        schedule.ShiftDate.HasValue &&
                        schedule.ShiftStart.HasValue &&
                        schedule.ShiftEnd.HasValue &&

                        schedule.ShiftDate.Value == DateOnly.FromDateTime(taskStart) &&
                        schedule.ShiftStart.Value <= TimeOnly.FromDateTime(taskStart) &&
                        schedule.ShiftEnd.Value >= TimeOnly.FromDateTime(taskEnd) &&

                        schedule.DriverStatus == "待命" &&

                        schedule.LicensePlateNavigation != null &&

                        schedule.LicensePlateNavigation.VehicleStatus == "可用" &&

                        schedule.LicensePlateNavigation.VehicleType == trip.VehicleType &&

                        schedule.LicensePlateNavigation.MaxPassengers >= trip.PassengerCount &&

                        schedule.LicensePlateNavigation.MaxLuggage >= trip.LuggageCount

                        )
                        .FirstOrDefaultAsync();

            if (Find == null)
            { return null; }

            return new FindDriverCar
            {
                DriverId = Find.DriverId,
                LicensePlate = Find.LicensePlate,
            };
        }


        [HttpPost]
        public async Task<IActionResult> Create(
        [FromBody] Trip trip, DriverShiftSchedule driverschedule)
        {
            /* 測試用
                // 這裡就收到 JavaScript 傳來的資料了
                Console.WriteLine(model.PickupLocation);
                Console.WriteLine(model.Destination);
                Console.WriteLine(model.PassengerCount);
                return Json(new
                { success = true });
            */

            // 測試用假資料
            trip.Account = "user03";
            trip.OrderNo = "TEST-" + DateTime.Now.ToString("yyyyMMddHHmmss");
            driverschedule.ShiftId = "S2026082501";
            driverschedule.DriverId = "D001";
            trip.EstimatedDuration = 2;

            // 暫時移除這三個驗證錯誤
            ModelState.Remove("Account");
            ModelState.Remove("AccountNavigation");
            ModelState.Remove("OrderNo");
            ModelState.Remove("ShiftId");
            ModelState.Remove("DriverId");
            ModelState.Remove("Driver");

            if (!ModelState.IsValid)
            {
                foreach (var item in ModelState)
                {
                    foreach (var error in item.Value.Errors)
                    {
                        Console.WriteLine(
                            $"ModelState Error: {item.Key} => {error.ErrorMessage}"
                        );
                    }
                }

                var errors = ModelState
                        .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                        .ToDictionary(
                            x => x.Key,
                            x => x.Value!.Errors
                                .Select(e => e.ErrorMessage)
                                .ToArray()
                        );
                return BadRequest(new
                {
                    success = false,
                    message = "訂單資料格式錯誤",
                    errors = errors
                });
            }

            // 算的


            // 呼叫你的派車 Function
            var result = await OrderDriver(trip);

            // 找不到司機或車
            if (result == null)
            {
                return BadRequest(new
                {
                    sucess = false,
                    message = "找不到符合條件的司機與車輛"
                });
            }

            var DriverShiftSchedule = new DriverShiftSchedule
            {
                ShiftId = driverschedule.ShiftId,
                DriverId = driverschedule.DriverId,
                LicensePlate = driverschedule.LicensePlate,
                ShiftDate = driverschedule.ShiftDate,
                ShiftStart = driverschedule.ShiftStart,
                ShiftEnd = driverschedule.ShiftEnd,
                DriverStatus = driverschedule.DriverStatus,
                Driver = driverschedule.Driver,
            };




            //Trip newtrip = new Trip();
            //newtrip.DepartureTime = 
            var bookingData = new Trip
            {
                OrderNo = GenerateOrderNumber(),
                DepartureTime = trip.DepartureTime,
                PickupLocation = trip.PickupLocation,
                Destination = trip.Destination,
                VehicleType = trip.VehicleType,
                PassengerCount = trip.PassengerCount,
                LuggageCount = trip.LuggageCount,
                Account = trip.Account,
                EstimatedDuration = trip.EstimatedDuration = 2,
                AssignedDriverId = result.DriverId,
                LicensePlate = result.LicensePlate,
                //BabySeat = model.BabySeat,
                //Flight = model.Flight,
                //CreatedAt = DateTime.Now
            };

           

            _context.Trips.Add(bookingData);
            await _context.SaveChangesAsync();

            // 找到了
            return Json(new
            {
                success = true,
                bookingData.OrderNo,
                driverId = result.DriverId,
                licensePlate = result.LicensePlate
            });

        }




        // ----------------------------------------------------
        // 測試派車的 API
        //[HttpPost]
        //public async Task<IActionResult> TestDispatch([FromBody] Trip trip)
        //{
        //    // 呼叫你的派車 Function
        //    var result = await OrderDriver(trip);


        //    // 找不到司機或車
        //    if (result == null)
        //    {
        //        return BadRequest(new
        //        {
        //            message = "找不到符合條件的司機與車輛"
        //        });
        //    }


        //    // 找到了
        //    return Json(new
        //    {
        //        driverId = result.DriverId,
        //        licensePlate = result.LicensePlate
        //    });
        //}










    }
}
