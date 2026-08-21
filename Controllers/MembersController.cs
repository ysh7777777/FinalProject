using FinalProject.Models;
using FinalProject.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    public class MembersController : Controller
    {
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
            return View();
        }

        // 送資料到資料庫
        private readonly MembersServices _membersServices;
        public MembersController(MembersServices membersServices)
        {
            _membersServices = membersServices;
        }

        // 【新增】接收前端註冊表單送出的資料 -> POST /Members/Join
        [HttpPost("Join")]
        public async Task<IActionResult> Register(Member request)
        {
            var result = await _membersServices.RegisterAsync(request);

            if (!result.Success)
            {
                ViewBag.Error = result.Message;
                return View(request); // 註冊失敗，帶回原頁面顯示錯誤
            }

            // 註冊成功，重導向到登入頁
            return RedirectToAction("Login");
        }

        // 修改密碼
        [HttpGet("Change")]
        public IActionResult ChangeP()
        {
            return View();
        }
    }
}
