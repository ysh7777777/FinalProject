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
        [HttpGet("~/")]
        [HttpGet("PForm/{orderNo?}")]
        public IActionResult PForm()
        {
            return View();
        }

        //[HttpGet("/PForm")]
        //public async Task<IActionResult> PForm(string orderNo)
        //{

        //}
    }

}
