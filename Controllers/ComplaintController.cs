using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    [Authorize(Roles = "passenger")]
    public class ComplaintController : Controller
    {
        private readonly RideHailingDbContext _context;

        public ComplaintController(RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult ComplaintPage()
        {
            // 取得目前登入會員帳號
            string? currentAccount = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(currentAccount))
            { return Unauthorized(); }

            return View();
        }
    }
}
