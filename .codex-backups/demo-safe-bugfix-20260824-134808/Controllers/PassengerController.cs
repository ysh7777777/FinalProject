using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace finalProject.Controllers
{
    public class PassengerController : Controller
    {
        private readonly RideHailingDbContext _context;

        public PassengerController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult DriverStatus()
        {
            var orderNo = "T20260811021";
            var trip = _context.Trips
                .Include(t => t.AssignedDriver)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo
                );

            if (trip == null)
            {
                return NotFound();
            }

            return View(trip);
        }
    }
}