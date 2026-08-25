using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace finalProject.Controllers
{
    [Authorize(Roles = "passenger")]
    public class PassengerController : Controller
    {
        private readonly RideHailingDbContext _context;

        public PassengerController(
            RideHailingDbContext context)
        {
            _context = context;
        }

        private string GetCurrentPassengerAccount()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? string.Empty;
        }

        public IActionResult DriverStatus(string? orderNo)
        {
            if (string.IsNullOrWhiteSpace(orderNo))
            {
                return BadRequest("缺少訂單編號");
            }

            var currentPassengerAccount =
                GetCurrentPassengerAccount();

            if (string.IsNullOrEmpty(currentPassengerAccount))
            {
                return Forbid();
            }

            orderNo = orderNo.Trim();

            var trip = _context.Trips
                .AsNoTracking()
                .Include(t => t.AssignedDriver)
                .Include(t => t.LicensePlateNavigation)
                .FirstOrDefault(t =>
                    t.OrderNo == orderNo &&
                    t.Account == currentPassengerAccount);

            if (trip == null)
            {
                return NotFound();
            }

            var canTrackDriver =
                trip.TripStatus == "行程中" &&
                trip.AssignedDriverId != null &&
                trip.LicensePlate != null;

            if (!canTrackDriver && trip.TripStatus != "已完成")
            {
                return NotFound();
            }

            ViewBag.CanTrackDriver = canTrackDriver;

            return View(trip);
        }
    }
}
