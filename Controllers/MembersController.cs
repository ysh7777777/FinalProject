using FinalProject.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
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
            // 判斷 User 的身分、驗證
            if (User.Identity?.IsAuthenticated == true)
            {
                // 回傳該身分的網址
                return RedirectToRoleIndex(User.FindFirstValue(ClaimTypes.Role));
            }
            // else 傳未登入頁面(原始頁面)
            return View();
        }

        [HttpPost("Login")]
        [ValidateAntiForgeryToken] // 防偽
        public async Task<IActionResult> Login([FromBody] LoginData data)
        {
            // 檢查是否有資料是 null 
            if (data == null || string.IsNullOrWhiteSpace(data.Account) || string.IsNullOrEmpty(data.Password))
            {
                return BadRequest(new { success = false, message = "請輸入帳號與密碼" });
            }
            // role 非乘客端或是司機端
            if (data.Role is not ("passenger" or "driver"))
            {
                return BadRequest(new { success = false, message = "登入角色不正確" });
            }
            // 消除空白鍵
            data.Account = data.Account.Trim();
            // 分流處理
            try
            {
                if (data.Role == "driver")
                {
                    return await LoginDriver(data);
                }

                return await LoginPassenger(data);
            }
            catch (Exception ex) // 例外處裡
            {
                // 後端警示
                _logger.LogError(
                    ex,
                    "{Role} 帳號 {Account} 登入時發生錯誤",
                    data.Role,
                    data.Account);
                // 前端呈現警示
                return StatusCode(500, new
                {
                    success = false,
                    message = "伺服器處理登入時發生錯誤"
                });
            }
        }

        private async Task<IActionResult> LoginDriver(LoginData data)
        {
            // 依照使用者輸入的 Driver 值，去資料庫裡拉 Driver 的資料出來
            var driver = await _context.Drivers
                .FirstOrDefaultAsync(d => d.DriverId == data.Account);

            if (driver == null)
            {
                return NotFound(new
                {
                    success = false,
                    needRegister = false,
                    message = "帳號尚未註冊，請與人資聯絡"
                });
            }
            // 確認密碼
            bool isPasswordValid = VerifyPassword(
                data.Password, // 使用者輸入的密碼
                driver.Password,  // 乘客資料表裡的密碼
                allowLegacyPlainText: true,  // 允許舊司機資料
                out bool usedLegacyPlainText); // 回傳舊司機資料
            // 密碼錯誤
            if (!isPasswordValid)
            {
                return Unauthorized(new { success = false, message = "司機帳號或密碼錯誤" });
            }

            // 舊司機資料若仍是明文密碼，登入成功後立即升級為 BCrypt。
            if (usedLegacyPlainText)
            {
                driver.Password = BCrypt.Net.BCrypt.HashPassword(data.Password);
                await _context.SaveChangesAsync(); // 儲存
            }
            // cookie + 成功登入狀態: 收到司機端資料，確保畫面無 null
            await SignInAsync(driver.DriverId, "driver", driver.DriverName ?? driver.DriverId);
            // 傳給前端顯示的資料
            return Ok(new
            {
                success = true,
                account = driver.DriverId,
                role = "driver",
                message = "司機端登入成功！",
                redirectUrl = Url.Action("Index", "Driver") // 導向Driver端的首頁
            });
        }

        private async Task<IActionResult> LoginPassenger(LoginData data)
        {
            // 拿前端輸入帳號，去資料庫拿完整資料
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.Account == data.Account);

            if (member == null)
            {
                return NotFound(new
                {
                    success = false,
                    needRegister = true,
                    message = "帳號尚未註冊，請先進行註冊！"
                });
            }
            // 如果密碼失敗
            if (!VerifyPassword(
                data.Password, // 使用者輸入的密碼
                member.Password,  // 乘客資料表裡的密碼
                allowLegacyPlainText: false, // 不允許舊資料
                out _))
            {
                return Unauthorized(new { success = false, message = "乘客帳號或密碼錯誤" });
            }
            // cookie + 成功登入狀態: 收到乘客端資料，確保畫面無 null
            await SignInAsync(member.Account, "passenger",member.FullName??member.Account);
            // 傳給前端顯示資料
            return Ok(new
            {
                success = true,
                message = "乘客端登入成功！",
                account = member.Account,
                role = "passenger",
                redirectUrl = Url.Action("Index", "Home")  // 導向passenger端的首頁
            });
        }
        // cookies
        private async Task SignInAsync(string account, string role, string displayName)
        {
            // 宣告清單
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, account), // 身分證
                new(ClaimTypes.Name, account),           // 帳號
                new(ClaimTypes.Role, role),              // 角色
                new(ClaimTypes.GivenName,displayName)    // 姓名
            };
            // 彙總宣告清單資料
            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);
            /* Cookie 驗證憑證
               記住使用者登入狀態
             */
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
            // 判斷 + 導向頁面
            return role == "driver"
                ? RedirectToAction("Index", "Driver")
                : RedirectToAction("Index", "Home");
        }

        private static bool VerifyPassword(
            string suppliedPassword,         // 使用者輸入的密碼
            string storedPassword,           // 儲存密碼
            bool allowLegacyPlainText,       // 允許舊式明文密碼
            out bool usedLegacyPlainText)    // 輸出舊式明文密碼
        {
            usedLegacyPlainText = false;    // 預設沒有使用舊式明文密碼

            try
            {
                // 回傳 BCrypt 加密
                return BCrypt.Net.BCrypt.Verify(suppliedPassword, storedPassword);
            }
            catch
            {
                // 密碼驗證錯誤
                if (!allowLegacyPlainText || storedPassword != suppliedPassword)
                {
                    return false;
                }
                // 允許舊未加密密碼登入成功
                usedLegacyPlainText = true;
                return true; // 允許登入
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

            _context.Members.Add(request);       // 彙整
            await _context.SaveChangesAsync();   // 加進 Members

            return Ok(new
            {
                success = true,
                message = "註冊成功"
            });
        }

        // 登出
        [HttpPost("Logout")]
        [HttpPost("Account/Logout")]  // 允許前端用舊式路由
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            // 清除舊版登入流程可能殘留的 Cookie，用 Path 確保整站都可以清除殘留 cookies
            Response.Cookies.Delete("Account", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("Role", new CookieOptions { Path = "/" });
            // 瀏覽器重新導向
            return RedirectToAction(nameof(Login));
        }

        // 修改密碼: 乘客端才能修改，司機端不行修改
        [HttpGet("Change")]
        public IActionResult ChangeP()
        {
            return View();
        }

        [HttpPost("Change")]
        [Authorize]  //  身份驗證
        [ValidateAntiForgeryToken]  // 防範惡意
        public async Task<IActionResult> ChangeP([FromBody] ChangePasswordDto dto)
        {
            string? account = User.FindFirstValue(ClaimTypes.NameIdentifier);
            string? role = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrEmpty(account))
            {
                return Unauthorized(new { success = false, message = "請先登入" });
            }

            string newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            if (role == "passenger")
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Account == account);
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
            else if (userRole == "driver")  // 如果司機端，不允許修改密碼
            {

                member.Password = newHash;
            }

            await _context.SaveChangesAsync();

            // 抹除 Cookie 登入憑證， 確保整個網頁都清除 cookies (Path)
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            Response.Cookies.Delete("Account", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("Role", new CookieOptions { Path = "/" });

        public class ChangePasswordModel
        {
            public string NewPassword { get; set; } = "";
        }
    }
}
