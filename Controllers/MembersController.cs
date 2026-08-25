using FinalProject.Models;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    public class MembersController : Controller
    {
        private readonly RideHailingDbContext _context;

        public MembersController(RideHailingDbContext context)
        {
            _context = context;
        }

        // 會員登入
        [HttpGet("Login")]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginData data)
        {
            if (data == null || string.IsNullOrEmpty(data.Account) || string.IsNullOrEmpty(data.Password))
            {
                return BadRequest(new { success = false, message = "請輸入帳號與密碼" });
            }

            // 設定寫入 Cookie 的安全屬性
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,                             // 防止前端 JS 讀取，預防 XSS 攻擊
                Path = "/",                                  // 設定全站通用路徑
                Expires = DateTimeOffset.UtcNow.AddDays(1),  // 保留 1 天
                SameSite = SameSiteMode.Lax,
                Secure = false                               // 設為 false 才能成功寫入
            };

            // 司機端登入 
            if (data.Role == "driver")
            {
                try
                {
                    // 搜尋司機
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

                    // 驗證密碼
                    bool isPasswordValid = false;
                    try
                    {
                        // 優先使用 BCrypt 驗證
                        isPasswordValid = BCrypt.Net.BCrypt.Verify(data.Password, driver.Password);
                    }
                    catch
                    {
                        // 若 DB 內的密碼不是標準 BCrypt 雜湊，自動退回明文字串比對
                        isPasswordValid = (driver.Password == data.Password);
                    }

                    // 驗證完畢後，才判斷是否要攔截並回傳錯誤
                    if (!isPasswordValid)
                    {
                        return Unauthorized(new { success = false, message = "司機帳號或密碼錯誤" });
                    }

                    // 將資料寫入 Cookie
                    Response.Cookies.Append("Account", driver.DriverId, cookieOptions);
                    Response.Cookies.Append("Role", "driver", cookieOptions);


                    // 司機密碼正確，回傳成功！
                    return Ok(new {
                        success = true, 
                        account = driver.DriverId, 
                        role = "driver", 
                        message = "司機端登入成功！" 
                    });
                }
                catch (Exception ex)
                {
                    // 捕捉所有例外，確保回傳 JSON
                    return StatusCode(500, new { success = false, message = "伺服器處理司機登入時發生錯誤：" + ex.Message });
                }
            }

            // 乘客端
            else
            {
                var member = await _context.Members
                    .FirstOrDefaultAsync(m => m.Account == data.Account);

                // 帳號不存在，註冊警示
                if (member == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        needRegister = true,
                        message = "帳號尚未註冊，請先進行註冊！"
                    });
                }

                if (!BCrypt.Net.BCrypt.Verify(data.Password, member.Password))
                {
                    return Unauthorized(new { success = false, message = "乘客帳號或密碼錯誤" });
                }

                //  Cookie
                Response.Cookies.Append("Account", member.Account, cookieOptions);
                Response.Cookies.Append("Role", "passenger", cookieOptions);

                return Ok(new { success = true, message = "乘客端登入成功！", account = member.Account, role = "passenger" });
            }
        }


        // 登入: 接收前端 json
        public class LoginData
        {
            public string Role { get; set; } = "";
            public string Account { get; set; } = "";
            public string Password { get; set; } = "";
        }


        // 註冊會員
        [HttpGet("Join")]
        public async Task<IActionResult> Register()
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
                // 回傳 JSON 格式錯誤訊息
                return BadRequest(new { message = "帳號或 Email 已被註冊" });
            }

            // 密碼進行 BCrypt 雜湊
            request.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 新增並寫入資料庫
            _context.Members.Add(request);
            await _context.SaveChangesAsync();

            // 回傳成功 JSON
            return Ok(new
            {
                success = true,
                message = "註冊成功"
            });
        }

        // 登出
        [HttpPost("Logout")]
        public IActionResult Logout()
        {
            // 移除 Cookie
            Response.Cookies.Delete("Account", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("Role", new CookieOptions { Path = "/" });

            return Ok(new { success = true, message = "已成功登出" });
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
            string? account = Request.Cookies["Account"];
            string? role = Request.Cookies["Role"];

            if (string.IsNullOrEmpty(account))
            {
                return Unauthorized(new { success = false, message = "請先登入" });
            }

            // 對新密碼加密
            string newHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            // 找到對應帳號並覆蓋密碼
            if (role == "passenger") 
            {
                var member = await _context.Members.FirstOrDefaultAsync(m => m.Account == account);
                if (member == null) return NotFound(new { message = "找不到帳號" });

                member.Password = newHash; // 直接修改原本資料庫欄位

            }

            // 儲存變更寫到 DB
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "密碼已成功更新！" });
        }


        // 用於接收前端傳送的新密碼資料
        public class ChangePasswordModel
        {
            public string NewPassword { get; set; } = "";
        }
    }
}
