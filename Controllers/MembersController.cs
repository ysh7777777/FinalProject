using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    public class MembersController : Controller
    {
        // 會員登入
        //[HttpGet("Login")]
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

        // 修改密碼
        [HttpGet("Change")]
        public IActionResult ChangeP()
        {
            return View();
        }
    }
}
