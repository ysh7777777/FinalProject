using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    public class DriverController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
