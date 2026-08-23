using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace finalProject.Controllers
{
    public class DriverNavigationController : Controller
    {
        private readonly RideHailingDbContext _context;

        public DriverNavigationController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult Navigation()
        {
            var driverId = "D001";

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            // 先找目前正在執行的訂單
            var trip = _context.Trips
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .Where(t =>
                    t.AssignedDriverId == driverId &&
                    t.TripStatus == "行程中")
                .OrderBy(t => t.DepartureTime)
                .FirstOrDefault();

            // 今天是否有完成過訂單
            ViewBag.HasCompletedToday = _context.Trips
                .Any(t =>
                    t.AssignedDriverId == driverId &&
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow
                );

            // =========================
            // 今天已經沒有行程中訂單
            // =========================
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
        public IActionResult CompleteTrip(string orderNo)
        {
            var driverId = "D001";

            var trip = _context.Trips
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo &&
                    t.AssignedDriverId == driverId &&
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
            var driverId = "D001";

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var completedTrips = _context.Trips
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .Where(t =>
                    t.AssignedDriverId == driverId &&
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow)
                .OrderByDescending(t => t.CompletedAt);

            var trip = completedTrips
                .Skip(offset)
                .FirstOrDefault();

            ViewBag.IsHistory = true;

            ViewBag.HasOlderOrder =
                completedTrips.Count() > offset + 1;

            return View("Navigation", trip);
        }

        [HttpGet]
        public IActionResult TodayCompletedOrders()
        {
            var driverId = "D001";
            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var orders = _context.Trips
                .AsNoTracking()
                .Where(t =>
                    t.AssignedDriverId == driverId &&
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
            var driverId = "D001";

            var hasNextOrder = _context.Trips
                .Any(t =>
                    t.AssignedDriverId == driverId &&
                    t.TripStatus == "行程中");

            return Json(new
            {
                hasNextOrder = hasNextOrder
            });
        }

        public IActionResult HistoryOrder(string orderNo)
        {
            var driverId = "D001";

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var trip = _context.Trips
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo &&
                    t.AssignedDriverId == driverId &&
                    t.TripStatus == "已完成" &&
                    t.CompletedAt >= today &&
                    t.CompletedAt < tomorrow);

            if (trip == null)
            {
                return RedirectToAction("Navigation");
            }

            ViewBag.IsHistory = true;

            return View("Navigation", trip);
        }
    }
}
