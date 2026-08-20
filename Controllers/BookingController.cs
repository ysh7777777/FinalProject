using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    public class BookingController : Controller
    {    
        private readonly RideHailingDbContext _context;

        public BookingController(RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult BookingPage()
        {
            return View();
        }
        // 連接資料庫測試用(成功)
        //public async Task<IActionResult> BookingPage()
        //{
        //    var data = await _context.Drivers.ToListAsync();

        //    return View("~/Views/Booking/BookingPage.cshtml", data);
        //}









        

    }
}
