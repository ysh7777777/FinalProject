using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    public class BookingController : Controller
    {
        public IActionResult BookingPage()
        {
            return View();
        }
    }
}
