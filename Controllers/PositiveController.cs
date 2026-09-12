using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    public class PositiveController : Controller
    {
        private readonly RideHailingDbContext _context;
        public PositiveController(RideHailingDbContext context)
        {
            _context = context;
        }
        // 測試: 原畫面
        [HttpGet("/PForm")]
        public IActionResult PForm()
        {
            return View();
        }

    }

}
