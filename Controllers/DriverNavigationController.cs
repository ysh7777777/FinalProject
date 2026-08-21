using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;

namespace finalProject.Controllers
{
    public class DriverNavigationController : Controller
    {
        private readonly RideHailingDbContext _context;

        public DriverNavigationController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult Navigation()
        {
            var driverId = "D001";

            var trip = _context.Trips
                .Where(t => t.AssignedDriverId == driverId)
                .OrderBy(t => t.DepartureTime)
                .FirstOrDefault();

            return View(trip);
        }
    }
}