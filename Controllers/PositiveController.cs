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
        // GET
        public async Task<IActionResult> PForm(string orderNo)
        {
            if (string.IsNullOrEmpty(orderNo))
            {
                return RedirectToAction("Index", "Home");
            }

            // 抓出對應訂單，並使用 Include 預先載入司機與車輛資料
            var trip = await _context.Trips
                .Include(t => t.AssignedDriver)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefaultAsync(t => t.OrderNo == orderNo);

            if (trip == null)
            {
                return NotFound("找不到該筆訂單");
            }

            return View(trip);
        }
        // POST
        [HttpPost]
        public async Task<IActionResult> Submit(string orderNo, int rating, List<string> tags)
        {
            var trip = await _context.Trips.FirstOrDefaultAsync(t => t.OrderNo == orderNo);
            if (trip != null)
            {
                // TODO: 若 Trip 資料表有 Rating / Tags 欄位，可在此處進行更新存檔
                // trip.Rating = rating;
                // await _context.SaveChangesAsync();
            }

            return RedirectToAction("Index", "Home");
        }
    }
}
