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
            if (User.Identity?.IsAuthenticated == true)
            {
                return RedirectToRoleIndex(User.FindFirstValue(ClaimTypes.Role));
            }

            return View();
        }

        [HttpPost("Login")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login([FromBody] LoginData data)
        {
            if (data == null || string.IsNullOrWhiteSpace(data.Account) || string.IsNullOrEmpty(data.Password))
            {
                return BadRequest(new { success = false, message = "請輸入帳號與密碼" });
            }

            if (data.Role is not ("passenger" or "driver"))
            {
                return BadRequest(new { success = false, message = "登入角色不正確" });
            }

            data.Account = data.Account.Trim();

            try
            {
                if (data.Role == "driver")
                {
                    return await LoginDriver(data);
                }

                return await LoginPassenger(data);
            }
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

        private async Task<IActionResult> LoginDriver(LoginData data)
        {
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

            bool isPasswordValid = VerifyPassword(
                data.Password,
                driver.Password,
                allowLegacyPlainText: true,
                out bool usedLegacyPlainText);

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

            await SignInAsync(driver.DriverId, "driver");

            return Ok(new
            {
                success = true,
                account = driver.DriverId,
                role = "driver",
                message = "司機端登入成功！",
                redirectUrl = Url.Action("Index", "Driver")
            });
        }

        private async Task<IActionResult> LoginPassenger(LoginData data)
        {
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

            if (!VerifyPassword(
                data.Password,
                member.Password,
                allowLegacyPlainText: false,
                out _))
            {
                return Unauthorized(new { success = false, message = "乘客帳號或密碼錯誤" });
            }

            await SignInAsync(member.Account, "passenger");

            return Ok(new
            {
                success = true,
                message = "乘客端登入成功！",
                account = member.Account,
                role = "passenger",
                redirectUrl = Url.Action("Index", "Home")
            });
        }

        private async Task SignInAsync(string account, string role)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, account),
                new(ClaimTypes.Name, account),
                new(ClaimTypes.Role, role)
            };

            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

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
        public async Task<IActionResult> ChangeP([FromBody] ChangePasswordModel request)
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
                    return NotFound(new { message = "找不到帳號" });
                }

                member.Password = newHash;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "密碼已成功更新！" });
        }

        public class ChangePasswordModel
        {
            public string NewPassword { get; set; } = "";
        }
    }
}
