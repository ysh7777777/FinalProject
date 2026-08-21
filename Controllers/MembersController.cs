using FinalProject.Models;
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


        // 註冊會員
        [HttpGet("Join")]
        public async Task<IActionResult> Register()
        {
            return View("Register");
        }

        // 接收前端 Fetch 送來的 JSON 註冊資料
        [HttpPost("/Join")]
        public async Task<IActionResult> Join([FromBody] Member request) // 💡 配合你的前端，這裡必須用 [FromBody]
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

        // 修改密碼
        [HttpGet("Change")]
        public IActionResult ChangeP()
        {
            return View();
        }
    }
}
