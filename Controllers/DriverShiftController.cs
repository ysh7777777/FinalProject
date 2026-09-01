using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FinalProject.Models;


namespace FinalProject.Controllers
{
   
    public class DriverShiftController : Controller
    {
        private readonly RideHailingDbContext _context;

        public DriverShiftController(RideHailingDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
            string? driverId = GetCurrentDriverId();

            if (string.IsNullOrWhiteSpace(driverId))
            {
                return Unauthorized("沒有取得登入司機的編號，請重新登入。");
            }

            // 測試用
            // string driverId = "D001";

            var schedules = await _context.DriverShiftSchedules.AsNoTracking()
                .Include(schedules => schedules.LicensePlateNavigation)
                .Where(schedules => schedules.DriverId == driverId)
                .OrderBy(schedules => schedules.ShiftDate)
                .ThenBy(schedules => schedules.ShiftStart)
                .ToListAsync();

            var orderNumbersByShift =
            await GetOrderNumbersByShiftAsync( driverId,schedules);

            ViewBag.OrderNumbersByShift =orderNumbersByShift;

            var availableVehicles = await GetAvailableVehiclesAsync();

            ViewBag.AvailableVehicles = availableVehicles;

            return View(schedules);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(DateOnly shiftDate,TimeOnly shiftStart,TimeOnly shiftEnd,string licensePlate)
        {
            // 測試用
            //string driverId = "D001";

            string? driverId = GetCurrentDriverId();

            if (string.IsNullOrWhiteSpace(driverId))
            {
                return Unauthorized("沒有取得登入司機的編號，請重新登入。");
            }

            DateOnly today = DateOnly.FromDateTime(DateTime.Today);

            if (shiftDate < today)
            {
                TempData["ErrorMessage"] = "不能新增過去日期";

                return RedirectToAction(nameof(Index));
            }

            if (shiftStart >= shiftEnd)
            {
                TempData["ErrorMessage"] ="下班時間必須晚於上班時間。";

                return RedirectToAction(nameof(Index));
            }
            bool scheduleAlreadyExists =
            await _context.DriverShiftSchedules
            .AnyAsync(schedule =>
            schedule.DriverId == driverId &&
            schedule.LicensePlate == licensePlate &&
            schedule.ShiftDate == shiftDate &&
            schedule.ShiftStart == shiftStart &&
            schedule.ShiftEnd == shiftEnd);

            if (scheduleAlreadyExists == true)
            {
                TempData["ErrorMessage"] ="相同的班表已經存在，不能重複新增。";

                return RedirectToAction(nameof(Index));
            }


            string shiftId ="S" +Guid.NewGuid()
          .ToString("N")
          .Substring(0, 14)
          .ToUpper();
            var newSchedule = new DriverShiftSchedule();
            newSchedule.ShiftId = shiftId;

            newSchedule.DriverId = driverId;

            newSchedule.LicensePlate = licensePlate;

            newSchedule.ShiftDate = shiftDate;

            newSchedule.ShiftStart = shiftStart;

            newSchedule.ShiftEnd = shiftEnd;
            newSchedule.DriverStatus ="待命";
            _context.DriverShiftSchedules.Add(newSchedule);

            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] ="班表新增成功。";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(string shiftId,TimeOnly shiftStart,TimeOnly shiftEnd)
        {
            // 測試階段先固定司機
            // string driverId = "D001";

            string? driverId = GetCurrentDriverId();

            if (string.IsNullOrWhiteSpace(driverId))
            {
                return Unauthorized("沒有取得登入司機的編號，請重新登入。");
            }

            // 檢查時間
            if (shiftStart >= shiftEnd)
            {
                TempData["ErrorMessage"] = "下班時間必須晚於上班時間。";

                return RedirectToAction(nameof(Index));
            }

            // 根據班表編號及司機編號尋找資料
            var schedule =
                await _context.DriverShiftSchedules
                    .FirstOrDefaultAsync(schedule =>
                        schedule.ShiftId == shiftId &&
                        schedule.DriverId == driverId);

            if (schedule == null)
            {
                TempData["ErrorMessage"] = "找不到要修改的班表。";

                return RedirectToAction(nameof(Index));
            }

            // 檢查班表是否已派有訂單
            bool hasAssignedOrder =await HasAssignedOrderAsync(schedule);

            if (hasAssignedOrder == true)
            {
                TempData["ErrorMessage"] ="這筆班表已有訂單，不能修改。";

                return RedirectToAction(nameof(Index));
            }

            bool sameScheduleExists = await _context.DriverShiftSchedules
                .AnyAsync(otherSchedule => otherSchedule.ShiftId != shiftId &&
                otherSchedule.DriverId == driverId &&
                otherSchedule.LicensePlate == schedule.LicensePlate &&
                otherSchedule.ShiftDate == schedule.ShiftDate &&
                otherSchedule.ShiftStart == shiftStart && 
                otherSchedule.ShiftEnd == shiftEnd);

            if (sameScheduleExists == true)
            {
                TempData["ErrorMessage"] = "修改後的班表和其他班表完全相同。";

                return RedirectToAction(nameof(Index));
            }


            // 只修改上下班時間
            schedule.ShiftStart = shiftStart;

            schedule.ShiftEnd = shiftEnd;

            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "班表時間修改成功。";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(string shiftId)
        {
            //string driverId = "D001";
            string? driverId = GetCurrentDriverId();

            if (string.IsNullOrWhiteSpace(driverId))
            {
                return Unauthorized("沒有取得登入司機的編號，請重新登入。");
            }

            if (string.IsNullOrWhiteSpace(shiftId))
            {
                TempData["ErrorMessage"] = "沒有取得班表";

                return RedirectToAction(nameof(Index));
            }

            var schedule = await _context.DriverShiftSchedules
                .FirstOrDefaultAsync(schedule => schedule.ShiftId == shiftId &&
                schedule.DriverId==driverId);

            if (schedule == null)
            {
                TempData["ErrorMessage"] = "找不到要刪除的班表";

                return RedirectToAction(nameof(Index));
            }

            bool hasAssignedOrder = await HasAssignedOrderAsync(schedule);

            if (hasAssignedOrder == true)
            {
                TempData["ErrorMessage"] = "這筆班表已有訂單，不能刪除";

                return RedirectToAction(nameof(Index));
            }

            _context.DriverShiftSchedules.Remove(schedule);

            await _context.SaveChangesAsync();

            TempData["SuccessMessage"] = "班表刪除成功";

            return RedirectToAction(nameof(Index));

        }

        private async Task<Dictionary<string, List<string>>>
        GetOrderNumbersByShiftAsync(string driverId,List<DriverShiftSchedule> schedules)
        {
            var trips = await _context.Trips
                .AsNoTracking()
                .Where(trip =>
                    trip.AssignedDriverId == driverId &&
                    trip.DepartureTime.HasValue &&
                    trip.CanceledAt == null &&
                    trip.TripStatus != "已取消")
                .OrderBy(trip =>trip.DepartureTime)
                .ToListAsync();

            var orderNumbersByShift =new Dictionary<string, List<string>>();

            foreach (var schedule in schedules)
            {
                var orderNumbers =new List<string>();

                if (schedule.ShiftDate.HasValue &&
                    schedule.ShiftStart.HasValue &&
                    schedule.ShiftEnd.HasValue)
                {
                    DateTime shiftStart =schedule.ShiftDate.Value
                    .ToDateTime(schedule.ShiftStart.Value);

                    DateTime shiftEnd =schedule.ShiftDate.Value
                    .ToDateTime(schedule.ShiftEnd.Value);

                    foreach (var trip in trips)
                    {
                        bool sameVehicle = trip.LicensePlate ==schedule.LicensePlate;

                        bool withinShiftTime =
                            trip.DepartureTime >= shiftStart &&
                            trip.DepartureTime <= shiftEnd;

                        if (sameVehicle && withinShiftTime)
                        {
                            orderNumbers.Add(trip.OrderNo);
                        }
                    }
                }

                orderNumbersByShift[schedule.ShiftId] = orderNumbers;
            }

            return orderNumbersByShift;
        }

        private async Task<List<Vehicle>> GetAvailableVehiclesAsync()
        {
            var vehicles = await _context.Vehicles
                .AsNoTracking()
                .Where(vehicle => vehicle.VehicleStatus == "可用")
                .OrderBy(vehicle => vehicle.LicensePlate)
                .ToListAsync();

            return vehicles;
        }

        private async Task<bool>HasAssignedOrderAsync(DriverShiftSchedule schedule)
        {
            // 班表資料不完整時，視為沒有訂單
            if (schedule.ShiftDate.HasValue == false ||
                schedule.ShiftStart.HasValue == false ||
                schedule.ShiftEnd.HasValue == false)
            {
                return false;
            }

            DateTime shiftStart = schedule.ShiftDate.Value
                    .ToDateTime(schedule.ShiftStart.Value);

            DateTime shiftEnd =schedule.ShiftDate.Value
                    .ToDateTime(schedule.ShiftEnd.Value);

            bool hasAssignedOrder =await _context.Trips
                    .AsNoTracking()
                    .AnyAsync(trip =>
                        trip.AssignedDriverId ==
                            schedule.DriverId &&
                        trip.LicensePlate ==
                            schedule.LicensePlate &&
                        trip.DepartureTime.HasValue &&
                        trip.DepartureTime >= shiftStart &&
                        trip.DepartureTime <= shiftEnd &&
                        trip.CanceledAt == null &&
                        trip.TripStatus != "已取消");

            return hasAssignedOrder;
        }

        private string? GetCurrentDriverId()
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return null;
            }

            string? role =
                User.FindFirstValue(ClaimTypes.Role);

            if (role != "driver")
            {
                return null;
            }

            string? driverId =
                User.FindFirstValue(ClaimTypes.NameIdentifier);

            return driverId;
        }
    }
}
