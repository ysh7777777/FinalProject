using FinalProject.DTO;
using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    [Authorize(Roles = "passenger")]
    public class ClientHistory_NewController : Controller
    {
        private readonly RideHailingDbContext _context;

        public ClientHistory_NewController(RideHailingDbContext context)
        {
            _context = context;
        }

        // 查詢訂單
        [HttpGet]
        public IActionResult ClientHistory_New()
        {
            // 取得登入帳號：
            string? account = User.FindFirstValue(ClaimTypes.NameIdentifier);
            // 取得角色：
            string? role = User.FindFirstValue(ClaimTypes.Role);
            // Null 處理：
            if (string.IsNullOrWhiteSpace(account))
            {
                return Unauthorized();
            }


            var orders = _context.Trips
                .Where(o => o.Account == account)
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


        // 新增取消訂單 Action
        [HttpPost]
        /* [ValidateAntiForgeryToken]
         「這個 POST 請求必須帶有合法的 Anti-Forgery Token，否則不允許執行。」
        Anti-Forgery（防偽造）通常是網站／Web 應用程式中的一種安全機制，用來防止攻擊者冒充使用者發送「假的請求」。
        最常見的是 CSRF（Cross-Site Request Forgery，跨站請求偽造）。
        
        假設有 [HttpPost] 刪除帳號的功能
        使用者登入，瀏覽器會自動帶：Cookie: .AspNetCore.Identity.Application=xxxxx
        -> 攻擊者可以誘導使用者造訪惡意網站，而惡意網站偷偷送：POST https://your-site.com/DeleteAccount
        -> 瀏覽器可能會自動把你的登入 Cookie 一起帶過去。
        -> 伺服器看到：「有登入 Cookie → 這是登入使用者 → 執行刪除」
        -> 這就是 CSRF(跨站請求偽造) 的問題。

        而加上 [ValidateAntiForgeryToken] 之後，伺服器還要求請求裡有一個正確的 Anti-Forgery Token：
        -> Cookie + Anti-Forgery Token => 都正確 → 通過 / 缺少 Token → 403
           攻擊者雖然可能讓瀏覽器帶 Cookie，卻通常拿不到你網站產生的 Token，因此請求會被擋掉。
         */
        public async Task<IActionResult> CancelOrder([FromBody] CancelOrderRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.OrderNumber))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "訂單編號不可為空"
                });
            }

            // 取得目前登入帳號
            string? account = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(account))
            {
                return Unauthorized();
            }

            // 只能取消「自己的訂單」
            var order = await _context.Trips
                .FirstOrDefaultAsync(o =>
                    o.OrderNo == request.OrderNumber &&
                    o.Account == account);

            if (order == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "找不到此訂單"
                });
            }

            // 再次確認是否可以取消
            if (order.TripStatus == "已取消")
            {
                return BadRequest(new
                {
                    success = false,
                    message = "此訂單已取消"
                });
            }

            if (order.TripStatus == "已完成")
            {
                return BadRequest(new
                {
                    success = false,
                    message = "已完成的訂單無法取消"
                });
            }

            if (order.DepartureTime <= DateTime.Now.AddHours(24))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "距離出發時間不足 24 小時，無法取消訂單"
                });
            }

            // 真正修改訂單狀態
            order.TripStatus = "已取消";

            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "訂單取消成功"
            });
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
