using FinalProject.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    public class MembersController : Controller
    {
        
        private readonly RideHailingDbContext _context;
        private readonly ILogger<MembersController> _logger;

        public MembersController(RideHailingDbContext context, ILogger<MembersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // 會員登入
        [HttpGet("Login")]
        public IActionResult Login()
        {
            // 判斷身分、登入狀態
            if (User.Identity?.IsAuthenticated == true)
            {
                // 依照角色，回傳對應頁面
                return RedirectToRoleIndex(User.FindFirstValue(ClaimTypes.Role)); 
            }
            // 未登入，顯示登入頁面
            return View();
        }

        [HttpPost("Login")]
        // 防止 CSRF 攻擊: 比對欄位跟 cookies 是否一致
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login([FromBody] LoginData data)
        {
            // 判斷 null 
            if (data == null || string.IsNullOrWhiteSpace(data.Account) || string.IsNullOrEmpty(data.Password))
            {
                // 回傳 BadRequest JSON，前端顯示錯誤訊息
                return BadRequest(new { success = false, message = "請輸入帳號與密碼" });
            }
            // 判斷角色是否正確
            if (data.Role is not ("passenger" or "driver"))
            {
                // 回傳 BadRequest JSON，前端顯示錯誤訊息
                return BadRequest(new { success = false, message = "登入角色不正確" });
            }
            // 去除帳號前後空白，避免使用者輸入空格造成登入失敗
            data.Account = data.Account.Trim();
            
            try
            {
                // 根據角色判定，呼叫對應的登入方法
                if (data.Role == "driver")
                {
                    return await LoginDriver(data);
                }

                return await LoginPassenger(data);
            }
            // 登入過程中可能發生的例外，並記錄錯誤日誌
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "{Role} 帳號 {Account} 登入時發生錯誤",
                    data.Role,
                    data.Account);

                return StatusCode(500, new
                {
                    success = false,
                    message = "伺服器處理登入時發生錯誤"
                });
            }
        }
        // 司機登入
        private async Task<IActionResult> LoginDriver(LoginData data)
        {
            // 從資料庫中查詢司機帳號
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == data.Account);
            // 若查無此司機帳號，回傳 NotFound ，前端顯示錯誤訊息
            if (driver == null)
            {
                return NotFound(new
                {
                    success = false,
                    needRegister = false,
                    message = "帳號尚未註冊，請與人資聯絡"
                });
            }
            // 驗證密碼，允許舊版明文密碼登入，並回傳是否使用了舊版明文密碼
            bool isPasswordValid = VerifyPassword(
                data.Password,
                driver.Password,
                allowLegacyPlainText: true,
                out bool usedLegacyPlainText);
            // 若密碼驗證失敗，回傳 Unauthorized(授權)，前端顯示錯誤訊息
            if (!isPasswordValid)
            {
                return Unauthorized(new { success = false, message = "司機帳號或密碼錯誤" });
            }

            // 舊司機資料若仍是明文密碼，登入成功後立即升級為 BCrypt。
            if (usedLegacyPlainText)
            {
                driver.Password = BCrypt.Net.BCrypt.HashPassword(data.Password);
                await _context.SaveChangesAsync();
            }
            // 登入成功，建立 Cookie 登入憑證，並將司機帳號、角色、姓名存入 Cookie Claims
            await SignInAsync(driver.DriverId, "driver", driver.DriverName ?? driver.DriverId);
            // 回傳成功 JSON，前端顯示登入成功訊息，並導向司機端首頁
            return Ok(new
            {
                success = true,
                account = driver.DriverId,
                role = "driver",
                message = "司機端登入成功！",
                redirectUrl = Url.Action("Index", "Driver")
            });
        }
        // 乘客登入
        private async Task<IActionResult> LoginPassenger(LoginData data)
        {
            // 從資料庫中查詢乘客帳號
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Account == data.Account);
            // 若查無此乘客帳號，回傳 NotFound ，前端顯示錯誤訊息
            if (member == null)
            {
                return NotFound(new
                {
                    success = false,
                    needRegister = true,
                    message = "帳號尚未註冊，請先進行註冊！"
                });
            }
            // 驗證密碼，僅允許 BCrypt 雜湊密碼登入，不允許舊版明文密碼登入，考量金流安全性
            if (!VerifyPassword(
                data.Password,
                member.Password,
                allowLegacyPlainText: false,
                out _))
            {
                // 若密碼驗證失敗，回傳 Unauthorized(授權)，前端顯示錯誤訊息
                return Unauthorized(new { success = false, message = "乘客帳號或密碼錯誤" });
            }
            // 登入成功，建立 Cookie 登入憑證，並將乘客帳號、角色、姓名存入 Cookie Claims
            await SignInAsync(member.Account, "passenger",member.FullName??member.Account);

            return Ok(new
            {
                success = true,
                message = "乘客端登入成功！",
                account = member.Account,
                role = "passenger",
                redirectUrl = Url.Action("Index", "Home")
            });
        }
        // 建立 Cookie 登入憑證
        private async Task SignInAsync(string account, string role, string displayName)
        {
            // 建立 Claims，包含編號、帳號、角色、顯示名稱
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, account),
                new(ClaimTypes.Name, account),
                new(ClaimTypes.Role, role),
                new(ClaimTypes.GivenName,displayName)
            };
            // 建立 ClaimsIdentity，指定 Cookie 驗證方案
            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);
            // 建立 ClaimsPrincipal，並將其簽入 HttpContext，設定 Cookie 過期時間為 1 天
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties
                {
                    IsPersistent = true,
                    AllowRefresh = true,
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(1)
                });
        }

        private IActionResult RedirectToRoleIndex(string? role)
        {
            return role == "driver"
                ? RedirectToAction("Index", "Driver")
                : RedirectToAction("Index", "Home");
        }

        private static bool VerifyPassword(
            string suppliedPassword,
            string storedPassword,
            bool allowLegacyPlainText,
            out bool usedLegacyPlainText)
        {
            usedLegacyPlainText = false;

            try
            {
                return BCrypt.Net.BCrypt.Verify(suppliedPassword, storedPassword);
            }
            catch
            {
                if (!allowLegacyPlainText || storedPassword != suppliedPassword)
                {
                    return false;
                }

                usedLegacyPlainText = true;
                return true;
            }
        }

        // 登入: 接收前端 JSON
        public class LoginData
        {
            public string Role { get; set; } = "";
            public string Account { get; set; } = "";
            public string Password { get; set; } = "";
        }

        // 註冊會員
        [HttpGet("Join")]
        public IActionResult Register()
        {
            return View("Register");
        }

        // 接收前端 Fetch 送來的 JSON 註冊資料
        [HttpPost("Join")]
        public async Task<IActionResult> Join([FromBody] Member request)
        {
            DateOnly today = DateOnly.FromDateTime(DateTime.Today);

            if (request.Birthday > today)
            {
                return BadRequest(new
                {
                    message = "生日不能晚於今天"
                });
            }

            // 後端安全檢查
            if (string.IsNullOrEmpty(request.Account) || request.Account.Contains("<script>") || request.Account.Contains("while"))
            {
                return BadRequest(new { message = "偵測到惡意內容或欄位不完整！" });
            }

            // 檢查帳號或 Email 是否重複
            var isExist = await _context.Members.AnyAsync(
                m => m.Account == request.Account || m.Email == request.Email
            );

            if (isExist)
            {
                return BadRequest(new { message = "帳號或 Email 已被註冊" });
            }

            request.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);

            _context.Members.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "註冊成功"
            });
        }

        // 登出
        [HttpPost("Logout")]
        [HttpPost("Account/Logout")]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // 清除舊版登入流程可能殘留的 Cookie。
            Response.Cookies.Delete("Account", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("Role", new CookieOptions { Path = "/" });

            return RedirectToAction(nameof(Login));
        }

        // 修改密碼
        [HttpGet("Change")]
        public IActionResult ChangeP()
        {
            return View();
        }

        [HttpPost("Change")]
        [Authorize]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangeP([FromBody] ChangePasswordDto dto)
        {
            // 後端模型結構驗證
            if (!ModelState.IsValid)
            {
                return BadRequest(new { success = false, message = "輸入格式不正確，欄位不可留空" });
            }

            // 從 Cookie Claims 中撈出當前「已登入」使用者的帳號（Account）與角色（Role）
            var userAccount = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRole = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(userAccount))
            {
                return Unauthorized(new { success = false, message = "登入已逾期，請重新登入" });
            }

            // 根據角色判定，抓取對應的資料庫資料表（乘客或司機）
            if (userRole == "passenger")
            {
                // 依照 Cookie 的帳號去資料庫精準搜尋該筆乘客
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Account == userAccount);
                if (member == null)
                {
                    return NotFound(new { success = false, message = "找不到該乘客會員資料" });
                }

                // 利用 BCrypt 比對使用者輸入的「原密碼」是否與資料庫雜湊密碼相符
                if (!VerifyPassword(dto.OldPassword, member.Password, allowLegacyPlainText: false, out _))
                {
                    return BadRequest(new { success = false, message = "原密碼輸入錯誤，請重新確認！" });
                }

                // 驗證通過，將新密碼進行 BCrypt 雜湊加密，並更新資料庫欄位
                member.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            }
            else if (userRole == "driver")
            {

                return BadRequest(new { success = false, message = "無效的使用者權限角色" });
            }


            // 將變更儲存到 SQL 資料庫中
            await _context.SaveChangesAsync();

            // 抹除 Cookie 登入憑證
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            Response.Cookies.Delete("Account", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("Role", new CookieOptions { Path = "/" });

            // 回傳成功 JSON
            return Ok(new { success = true, message = "密碼修改成功，請使用新密碼重新登入！" });
        }
}
}


