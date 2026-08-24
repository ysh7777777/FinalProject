using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace finalProject.Controllers
{
    public class DriverNavigationController : Controller
    {
        private readonly RideHailingDbContext _context;

        // 專題展示模式使用；登入功能合併後只需替換
        // GetCurrentDriverTrips() 的資料範圍。
        private const string DemoDriverId = "D001";

        public DriverNavigationController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        private IQueryable<Trip> GetCurrentDriverTrips()
        {
            // AUTH-INTEGRATION:
            // 登入功能完成後，改由目前登入者的司機 ID
            // 過濾資料；展示階段保留 D001，避免頁面被擋住。
            return _context.Trips
                .Where(t =>
                    t.AssignedDriverId == DemoDriverId);
        }

        public IActionResult Navigation()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var trip = GetCurrentDriverTrips()
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .Where(t =>
                    t.TripStatus == "行程中")
                .OrderBy(t => t.DepartureTime)
                .FirstOrDefault();

            ViewBag.HasTrip = trip != null;

            ViewBag.HasCompletedToday = GetCurrentDriverTrips()
                .Any(t =>
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow
                );

            if (trip == null)
            {
                if (ViewBag.HasCompletedToday == true)
                {
                    TempData["OrderMessage"] =
                        "今日訂單已全部完成，以下為今日完成訂單";

                    return RedirectToAction(
                        "LastOrder",
                        new { offset = 0 }
                    );
                }
            }

            ViewBag.IsHistory = false;

            return View(trip);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult CompleteTrip(string orderNo)
        {
            var trip = GetCurrentDriverTrips()
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo &&
                    t.TripStatus == "行程中");

            if (trip == null)
            {
                return NotFound();
            }

            trip.TripStatus = "已完成";
            trip.CompletedAt = DateTime.Now;

            _context.SaveChanges();

            return Ok();
        }

        public IActionResult LastOrder(int offset = 0)
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var completedTrips = GetCurrentDriverTrips()
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .Where(t =>
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow)
                .OrderByDescending(t => t.CompletedAt);

            var trip = completedTrips
                .Skip(offset)
                .FirstOrDefault();

            ViewBag.HasTrip = trip != null;
            ViewBag.IsHistory = true;

            ViewBag.HasOlderOrder =
                completedTrips.Count() > offset + 1;

            return View("Navigation", trip);
        }

        [HttpGet]
        public IActionResult TodayCompletedOrders()
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var orders = GetCurrentDriverTrips()
                .AsNoTracking()
                .Where(t =>
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow)
                .OrderByDescending(t => t.CompletedAt)
                .ThenByDescending(t => t.DepartureTime)
                .ThenByDescending(t => t.OrderNo)
                .Select(t => t.OrderNo)
                .ToList();

            return Json(new { orders });
        }

        [HttpGet]
        public IActionResult HasNextOrder()
        {
            var hasNextOrder = GetCurrentDriverTrips()
                .Any(t =>
                    t.TripStatus == "行程中");

            return Json(new
            {
                hasNextOrder
            });
        }

        public IActionResult HistoryOrder(string orderNo)
        {
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var trip = GetCurrentDriverTrips()
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo &&
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow);

            if (trip == null)
            {
                return RedirectToAction("Navigation");
            }

            ViewBag.HasTrip = true;
            ViewBag.IsHistory = true;

            return View("Navigation", trip);
        }
    }
}
