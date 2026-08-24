using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace finalProject.Controllers
{
    public class PassengerController : Controller
    {
        private readonly RideHailingDbContext _context;
        private const string DemoOrderNo = "T20260811001";

        public PassengerController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        private IQueryable<Trip> GetCurrentPassengerTrips()
        {
            // AUTH-INTEGRATION:
            // 登入功能完成後，改成依目前登入會員 Account
            // 過濾訂單；展示階段保留固定測試訂單。
            return _context.Trips
                .Where(t => t.OrderNo == DemoOrderNo);
        }

        public IActionResult DriverStatus()
        {
            var trip = GetCurrentPassengerTrips()
                .Include(t => t.AssignedDriver)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefault();

            if (trip == null)
            {
                return NotFound();
            }

            return View(trip);
        }
    }
}
