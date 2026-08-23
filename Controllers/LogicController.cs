using FinalProject.DTO;
using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace FinalProject.Controllers
{
    public class LogicController : Controller
    {
        private readonly RideHailingDbContext _context;

        public LogicController(RideHailingDbContext context)
        {
            _context = context;
        }
        public async Task<IActionResult> Index()
        {
            return View();
        }


        public async Task<FindDriverCar> OrderDriver(Trip trip)
        {
            if (!trip.DepartureTime.HasValue)
            {
                return null;
            }

            int eta = 30;



            DateTime departureTime = trip.DepartureTime.Value;

            DateTime taskStart = departureTime.AddMinutes(-eta);
            DateTime taskEnd = departureTime.AddMinutes(trip.EstimatedDuration.Value + eta);

            var Find = await _context.DriverShiftSchedules
                        .AsNoTracking()
                        .Include(schedule => schedule.LicensePlateNavigation)
                        .Where(schedule =>
                        schedule.ShiftDate.HasValue &&
                        schedule.ShiftStart.HasValue &&
                        schedule.ShiftEnd.HasValue &&


                        schedule.ShiftDate.Value == DateOnly.FromDateTime(taskStart) &&
                        schedule.ShiftStart.Value <= TimeOnly.FromDateTime(taskStart) &&
                        schedule.ShiftEnd.Value >= TimeOnly.FromDateTime(taskEnd) &&

                        schedule.DriverStatus == "待命" &&

                        schedule.LicensePlateNavigation != null &&

                        schedule.LicensePlateNavigation.VehicleStatus == "可用" &&

                        schedule.LicensePlateNavigation.VehicleType == trip.VehicleType &&

                        schedule.LicensePlateNavigation.MaxPassengers >= trip.PassengerCount &&

                        schedule.LicensePlateNavigation.MaxLuggage >= trip.LuggageCount

                        )
                        .FirstOrDefaultAsync();

            if (Find == null)
            {
                return null;
            }

            return new FindDriverCar
            {
                DriverId = Find.DriverId,
                LicensePlate = Find.LicensePlate,
            };


        }
        // 測試派車的 API
        [HttpPost]
        public async Task<IActionResult> TestDispatch([FromBody] Trip trip)
        {
            // 呼叫你的派車 Function
            var result = await OrderDriver(trip);


            // 找不到司機或車
            if (result == null)
            {
                return BadRequest(new
                {
                    message = "找不到符合條件的司機與車輛"
                });
            }


            // 找到了
            return Json(new
            {
                driverId = result.DriverId,
                licensePlate = result.LicensePlate
            });
        }
    }
}