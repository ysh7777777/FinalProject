using FinalProject.DTO;
using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    public class BookingController : Controller
    {    
        private const string TemporaryAccount = "user01";
        private readonly RideHailingDbContext _context;

        public BookingController(RideHailingDbContext context)
        {
            _context = context;
        }

        private string GetCurrentAccount()
        {
            // TODO: 登入驗證完成後，統一以 NameIdentifier claim 存放會員 account。
            var authenticatedAccount =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.Identity?.Name;

            return User.Identity?.IsAuthenticated == true &&
                   !string.IsNullOrWhiteSpace(authenticatedAccount)
                ? authenticatedAccount
                : TemporaryAccount;
        }


        //public IActionResult BookingPage()
        //{
        //    return View();
        //}
        // 連接資料庫測試用(成功)
        public async Task<IActionResult> BookingPage(string id)
        {
            var VehicleMenu = await _context.VehicleMenu.ToListAsync();
            var currentAccount = GetCurrentAccount();
            var savedAddresses = await _context.MemberSavedAddresses
                .AsNoTracking()
                .Where(address => address.Account == currentAccount)
                .OrderBy(address => address.Label)
                .ThenBy(address => address.AddressId)
                .ToListAsync();

            ViewBag.VehicleMenu = VehicleMenu;
            ViewBag.SavedAddresses = savedAddresses;
            ViewBag.CurrentAccount = currentAccount;
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


        /* 派車邏輯 - 舊
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
        */


        // 派車邏輯 - 新
        public async Task<FindDriverCar> OrderDriver(Trip trip)
        {
            if (trip.DepartureTime is not DateTime departureTime)
            {
                return null;
            }
            if (trip.EstimatedDuration is not int estimatedDuration || estimatedDuration <= 0)
            {
                return null;
            }

            const int eta = 30;
            DateTime taskStart = departureTime.AddMinutes(-eta);
            DateTime taskEnd = departureTime.AddMinutes(estimatedDuration + eta);

            string[] activeStatuses = { "行程中", "接單中", "休息", "請假", "下班", "已派車", "前往中", "已完成" };

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

                        schedule.LicensePlateNavigation.MaxLuggage >= trip.LuggageCount &&

                        // 檢查車輛的起始位置是否與訂單的取車地點相符(待解決暫不使用)
                        //schedule.LicensePlateNavigation.BaseLocation == trip.PickupLocation &&

                 
                       !_context.Trips.Any(existingTrip =>
                           // 舊訂單的完整資料
                           existingTrip.DepartureTime.HasValue &&
                           existingTrip.EstimatedDuration.HasValue &&
                           // 只檢查尚未取消、尚未完成的有效訂單
                           existingTrip.TripStatus != null &&
                           activeStatuses.Contains(existingTrip.TripStatus) &&
                           (
                           existingTrip.AssignedDriverId == schedule.DriverId ||
                           existingTrip.LicensePlate == schedule.LicensePlate
                           ) &&
                           existingTrip.DepartureTime.Value.AddMinutes(-eta) < taskEnd &&
                           existingTrip.DepartureTime.Value.AddMinutes(existingTrip.EstimatedDuration.Value + eta) > taskStart
                        )



                        ).OrderBy(schedule => schedule.DriverId)
                        .FirstOrDefaultAsync();

            if (Find == null)
            { return null; }

            return new FindDriverCar
            {
                DriverId = Find.DriverId,
                LicensePlate = Find.LicensePlate,
            };
        }

        /* 建立訂單 - 舊版
        [HttpPost]
        public async Task<IActionResult> Create(
        [FromBody] Trip trip)
        {


            // 登入功能完成前使用 user21；完成後由 GetCurrentAccount() 讀取登入會員。
            trip.Account = GetCurrentAccount();
            trip.OrderNo = GenerateOrderNumber();

            // 暫時移除這三個驗證錯誤
            ModelState.Remove("Account");
            ModelState.Remove("AccountNavigation");
            ModelState.Remove("OrderNo");
            //ModelState.Remove("ShiftId");
            //ModelState.Remove("DriverId");
            //ModelState.Remove("Driver");

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

            //Trip newtrip = new Trip();
            //newtrip.DepartureTime = 
            var bookingData = new Trip
            {
                OrderNo = GenerateOrderNumber(),
                DepartureTime = trip.DepartureTime,
                PickupLocation = trip.PickupLocation,
                PickupLat = trip.PickupLat,
                PickupLng = trip.PickupLng,
                Destination = trip.Destination,
                DestinationLat = trip.DestinationLat,
                DestinationLng = trip.DestinationLng,
                VehicleType = trip.VehicleType,
                PassengerCount = trip.PassengerCount,
                LuggageCount = trip.LuggageCount,
                Account = trip.Account,
                EstimatedDuration = trip.EstimatedDuration,
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
        */


        // 建立訂單 - 新版
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateBookingDto dto)
        {
            if (!ModelState.IsValid)
            {
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
                    errors
                });
            }

            // 建立 Trip Entity
            var trip = new Trip
            {
                OrderNo = GenerateOrderNumber(),

                // 暫時測試用
                Account = "user03",

                DepartureTime = dto.DepartureTime,
                PickupLocation = dto.PickupLocation,
                PickupLat = dto.PickupLat,
                PickupLng = dto.PickupLng,

                Destination = dto.Destination,
                DestinationLat = dto.DestinationLat,
                DestinationLng = dto.DestinationLng,

                VehicleType = dto.VehicleType,
                PassengerCount = dto.PassengerCount,
                LuggageCount = dto.LuggageCount,

                TripStatus = "待執行",

                // 暫時測試用
                EstimatedDuration = 2
            };

            // 引用派車邏輯派車
            var result = await OrderDriver(trip);

            if (result == null)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "找不到符合條件的司機與車輛"
                });
            }

            // 將派車結果寫入訂單
            trip.AssignedDriverId = result.DriverId;
            trip.LicensePlate = result.LicensePlate;


            // 將trip更新至資料庫，用try catch
            /* try catch 抓到catch中的 BadRequest (抓到錯誤時/Exception)
               進到 前端 fetch() POST /Booking/Create -> Controller.Create() 有問題(找不到司機/傳進資料庫有問題...) -> BadRequest(...)
               -> HTTP 400 + JSON -> const response = await fetch(...) -> const result = await... -> result.message
               -> if (!response.ok) -> throw new Error(...) -> catch(error) -> alert(error.message)
             */
            try
            {
                _context.Trips.Add(trip);
                await _context.SaveChangesAsync();
            }
            catch
            {
                return BadRequest(new
                {
                    success = false,
                    message = "資料建立有問題，請與本公司聯繫!!"
                });
            }

            return Json(new
            {
                success = true,
                bookingId = trip.OrderNo,
                driverId = result.DriverId,
                licensePlate = result.LicensePlate
            });
        }













    }
}
