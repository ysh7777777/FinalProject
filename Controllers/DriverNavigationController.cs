using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace finalProject.Controllers
{
    [Authorize(Roles = "driver")]
    public class DriverNavigationController : Controller
    {
        private const string PendingExecutionStatus = "待執行";
        private const string InProgressStatus = "行程中";
        private const string DemoDriverId = "D001";
        private static readonly DateTime DemoBusinessDate =
            new(2026, 8, 11);

        private readonly RideHailingDbContext _context;

        public DriverNavigationController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        private IQueryable<Trip> GetCurrentDriverTrips()
        {
            var currentDriverId = GetCurrentDriverId();

            return _context.Trips
                .Where(t =>
                    t.AssignedDriverId == currentDriverId);
        }

        private string GetCurrentDriverId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? string.Empty;
        }

        private async Task<int> PromotePendingTripsAsync(
            DateTime businessDate)
        {
            var dayStart = businessDate.Date;
            var nextDay = dayStart.AddDays(1);

            var pendingTrips = GetCurrentDriverTrips()
                .Where(t =>
                    t.TripStatus == PendingExecutionStatus &&
                    t.DepartureTime >= dayStart &&
                    t.DepartureTime < nextDay &&
                    t.LicensePlate != null);

            return await pendingTrips.ExecuteUpdateAsync(setters =>
                setters.SetProperty(
                    t => t.TripStatus,
                    InProgressStatus));
        }

        // 新增：取得司機的訂單資料並打包為 OrdersViewModel
        private OrdersViewModel GetDriverOrders()
        {
            var now = DateTime.Now;

            // 1. 未來訂單：狀態為 待執行 或 行程中，且出發時間在未來（或今日尚未完成）
            var futureOrders = GetCurrentDriverTrips()
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .Where(t => t.TripStatus == "待執行" || t.TripStatus == "行程中")
                .OrderBy(t => t.DepartureTime)
                .ToList();

            // 2. 歷史訂單：狀態為 已完成 或 已取消
            var historyOrders = GetCurrentDriverTrips()
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .Where(t => t.TripStatus == "已完成" || t.TripStatus == "已取消")
                .OrderByDescending(t => t.CompletedAt ?? t.DepartureTime)
                .ToList();

            return new OrdersViewModel
            {
                FutureOrders = futureOrders,
                HistoryOrders = historyOrders
            };
        }

        // 新增：訂單查詢頁面 Action
        public IActionResult Orders(string tab = "future")
        {
            var viewModel = GetDriverOrders();

            ViewBag.ActiveTab = tab;

            // 由於控制器叫 DriverNavigationController，預設會找 Views/DriverNavigation/Orders.cshtml
            // 若你的檔名位在 Views/Driver/Orders.cshtml，請保留下方寫法：
            return View("~/Views/DriverNavigation/Orders.cshtml", viewModel);
        }

        // 既有登入流程會導向 /Driver/Index；在不修改登入檔案的
        // 前提下，由此端點銜接至正式的司機導航頁。
        [HttpGet("/Driver", Order = -1)]
        [HttpGet("/Driver/Index", Order = -1)]
        public IActionResult DriverIndex()
        {
            return RedirectToAction(nameof(Navigation));
        }

        public async Task<IActionResult> Navigation(
            bool orderDateDemo = false)
        {
            var currentDriverId = GetCurrentDriverId();
            var isDemoMode =
                orderDateDemo &&
                currentDriverId == DemoDriverId;
            var businessDate = isDemoMode
                ? DemoBusinessDate
                : DateTime.Today;

            var promotedTripCount =
                await PromotePendingTripsAsync(
                    businessDate);

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            ViewBag.CanUseOrderDateDemo =
                currentDriverId == DemoDriverId;
            ViewBag.IsOrderDateDemo = isDemoMode;
            ViewBag.BusinessDate = businessDate;
            ViewBag.PromotedTripCount = promotedTripCount;

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
                    //TempData["OrderMessage"] =
                    //    "今日訂單已全部完成，以下為今日完成訂單";

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
        public IActionResult ActivateOrderDateDemo()
        {
            if (GetCurrentDriverId() != DemoDriverId)
            {
                return Forbid();
            }

            return RedirectToAction(
                nameof(Navigation),
                new { orderDateDemo = true });
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
