using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace finalProject.Controllers
{
    /// <summary>
    /// 提供司機行程導航、訂單查詢、完成功能與當日歷史訂單相關端點。
    /// </summary>
    [Authorize(Roles = "driver")]
    public class DriverNavigationController : Controller
    {
        // 集中管理資料庫內使用的行程狀態，避免查詢與更新使用不同字串。
        private const string PendingExecutionStatus = "待執行";
        private const string InProgressStatus = "行程中";
        private const string CompletedStatus = "已完成";
        private const string CancelledStatus = "已取消";

        // Demo 僅允許指定司機將指定日期的待執行行程轉為行程中。
        private const string DemoDriverId = "D001";
        private static readonly DateTime DemoBusinessDate = new(2026, 8, 11);

        private readonly RideHailingDbContext _context;

        /// <summary>
        /// 初始化司機導航控制器。
        /// </summary>
        /// <param name="context">叫車系統的資料庫內容。</param>
        public DriverNavigationController(RideHailingDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 接收既有登入流程的司機首頁路徑，並導向正式導航頁。
        /// </summary>
        /// <returns>導航頁的重新導向結果。</returns>
        [HttpGet("/Driver", Order = -1)]
        [HttpGet("/Driver/Index", Order = -1)]
        public IActionResult DriverIndex()
        {
            return RedirectToAction(nameof(Navigation));
        }

        /// <summary>
        /// 顯示目前進行中的行程；若今日行程皆已完成，則導向最新完成行程。
        /// </summary>
        /// <param name="orderDateDemo">是否使用指定日期的 Demo 訂單。</param>
        /// <returns>司機導航頁或最新完成行程頁。</returns>
        public async Task<IActionResult> Navigation(bool orderDateDemo = false)
        {
            var currentDriverId = GetCurrentDriverId();

            // Demo 模式同時受表單參數與司機身分限制，避免其他司機切換測試資料。
            var isDemoMode = orderDateDemo && currentDriverId == DemoDriverId;
            var businessDate = isDemoMode ? DemoBusinessDate : DateTime.Today;
            var promotedTripCount = await PromotePendingTripsAsync(businessDate);

            ViewBag.CanUseOrderDateDemo = currentDriverId == DemoDriverId;
            ViewBag.IsOrderDateDemo = isDemoMode;
            ViewBag.PromotedTripCount = promotedTripCount;

            // 導航頁一次只顯示最早出發的進行中行程。
            var trip = GetCurrentDriverTripsWithDetails()
                .Where(t => t.TripStatus == InProgressStatus)
                .OrderBy(t => t.DepartureTime)
                .FirstOrDefault();

            var hasCompletedToday = GetCompletedTripsForDate(DateTime.Today).Any();

            ViewBag.HasTrip = trip != null;
            ViewBag.HasCompletedToday = hasCompletedToday;

            // 沒有進行中行程但今日有完成紀錄時，改為顯示最新一筆完成行程。
            if (trip == null && hasCompletedToday)
            {
                return RedirectToAction(nameof(LastOrder), new { offset = 0 });
            }

            ViewBag.IsHistory = false;

            return View(trip);
        }

        /// <summary>
        /// 顯示目前司機的進行中／待執行訂單與歷史訂單。
        /// </summary>
        /// <param name="tab">頁面預設顯示的訂單分頁。</param>
        /// <returns>訂單管理頁。</returns>
        public IActionResult Orders(string tab = "future")
        {
            ViewBag.ActiveTab = tab;

            return View(GetDriverOrders());
        }

        /// <summary>
        /// 依位移量顯示今日完成的行程，供使用者逐筆瀏覽歷史訂單。
        /// </summary>
        /// <param name="offset">從最新完成行程起算的零基位移量。</param>
        /// <returns>以導航頁呈現的完成行程。</returns>
        public IActionResult LastOrder(int offset = 0)
        {
            var completedTrips = GetCompletedTripsForDate(DateTime.Today)
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .OrderByDescending(t => t.CompletedAt);

            var trip = completedTrips
                .Skip(offset)
                .FirstOrDefault();

            ViewBag.HasTrip = trip != null;
            ViewBag.IsHistory = true;
            ViewBag.HasOlderOrder = completedTrips.Count() > offset + 1;

            return View(nameof(Navigation), trip);
        }

        /// <summary>
        /// 顯示今日指定訂單編號的已完成行程。
        /// </summary>
        /// <param name="orderNo">要顯示的訂單編號。</param>
        /// <returns>歷史行程；找不到時回到導航頁。</returns>
        public IActionResult HistoryOrder(string orderNo)
        {
            var trip = GetCompletedTripsForDate(DateTime.Today)
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefault(t => t.OrderNo == orderNo);

            if (trip == null)
            {
                return RedirectToAction(nameof(Navigation));
            }

            ViewBag.HasTrip = true;
            ViewBag.IsHistory = true;

            return View(nameof(Navigation), trip);
        }

        /// <summary>
        /// 啟用指定司機與日期的訂單 Demo。
        /// </summary>
        /// <returns>Demo 導航頁；非指定司機則拒絕存取。</returns>
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

        /// <summary>
        /// 將目前司機指定的進行中行程標示為已完成。
        /// </summary>
        /// <param name="orderNo">要完成的訂單編號。</param>
        /// <returns>成功時回傳 200；找不到符合行程時回傳 404。</returns>
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult CompleteTrip(string orderNo)
        {
            var trip = GetCurrentDriverTrips()
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo &&
                    t.TripStatus == InProgressStatus);

            if (trip == null)
            {
                return NotFound();
            }

            trip.TripStatus = CompletedStatus;
            trip.CompletedAt = DateTime.Now;

            _context.SaveChanges();

            return Ok();
        }

        /// <summary>
        /// 取得目前司機今日完成的訂單編號，供前端建立歷史訂單清單。
        /// </summary>
        /// <returns>依完成時間排序的訂單編號 JSON。</returns>
        [HttpGet]
        public IActionResult TodayCompletedOrders()
        {
            var orders = GetCompletedTripsForDate(DateTime.Today)
                .AsNoTracking()
                .OrderByDescending(t => t.CompletedAt)
                .ThenByDescending(t => t.DepartureTime)
                .ThenByDescending(t => t.OrderNo)
                .Select(t => t.OrderNo)
                .ToList();

            return Json(new { orders });
        }

        /// <summary>
        /// 檢查目前司機是否仍有進行中的行程。
        /// </summary>
        /// <returns>包含檢查結果的 JSON。</returns>
        [HttpGet]
        public IActionResult HasNextOrder()
        {
            var hasNextOrder = GetCurrentDriverTrips()
                .Any(t => t.TripStatus == InProgressStatus);

            return Json(new { hasNextOrder });
        }

        /// <summary>
        /// 取得目前登入司機的所有行程查詢。
        /// </summary>
        /// <returns>已依目前司機身分篩選的行程查詢。</returns>
        private IQueryable<Trip> GetCurrentDriverTrips()
        {
            var currentDriverId = GetCurrentDriverId();

            return _context.Trips
                .Where(t => t.AssignedDriverId == currentDriverId);
        }

        /// <summary>
        /// 取得目前登入司機的行程，並載入導航與訂單頁需要的關聯資料。
        /// </summary>
        /// <returns>包含乘客與車輛資料的行程查詢。</returns>
        private IQueryable<Trip> GetCurrentDriverTripsWithDetails()
        {
            return GetCurrentDriverTrips()
                .Include(t => t.AccountNavigation)
                .Include(t => t.LicensePlateNavigation);
        }

        /// <summary>
        /// 取得目前司機在指定日期內完成的行程查詢。
        /// </summary>
        /// <param name="businessDate">要查詢的日期。</param>
        /// <returns>指定日期零時起至隔日零時前完成的行程。</returns>
        private IQueryable<Trip> GetCompletedTripsForDate(DateTime businessDate)
        {
            var dayStart = businessDate.Date;
            var nextDay = dayStart.AddDays(1);

            return GetCurrentDriverTrips()
                .Where(t =>
                    t.TripStatus == CompletedStatus &&
                    t.CompletedAt >= dayStart &&
                    t.CompletedAt < nextDay);
        }

        /// <summary>
        /// 將指定日期內已配置車輛的待執行行程批次轉為行程中。
        /// </summary>
        /// <param name="businessDate">要啟用行程的營運日期。</param>
        /// <returns>實際更新的行程筆數。</returns>
        private async Task<int> PromotePendingTripsAsync(DateTime businessDate)
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

        /// <summary>
        /// 將目前司機的有效訂單與歷史訂單整理為頁面檢視模型。
        /// </summary>
        /// <returns>包含有效與歷史訂單的檢視模型。</returns>
        private OrdersViewModel GetDriverOrders()
        {
            // FutureOrders 沿用既有 ViewModel 命名，實際內容為待執行或進行中的有效訂單。
            var futureOrders = GetCurrentDriverTripsWithDetails()
                .Where(t =>
                    t.TripStatus == PendingExecutionStatus ||
                    t.TripStatus == InProgressStatus)
                .OrderBy(t => t.DepartureTime)
                .ToList();

            var historyOrders = GetCurrentDriverTripsWithDetails()
                .Where(t =>
                    t.TripStatus == CompletedStatus ||
                    t.TripStatus == CancelledStatus)
                .OrderByDescending(t => t.CompletedAt ?? t.DepartureTime)
                .ToList();

            return new OrdersViewModel
            {
                FutureOrders = futureOrders,
                HistoryOrders = historyOrders
            };
        }

        /// <summary>
        /// 從登入宣告取得目前司機識別碼。
        /// </summary>
        /// <returns>司機識別碼；宣告不存在時回傳空字串。</returns>
        private string GetCurrentDriverId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? string.Empty;
        }
    }
}
