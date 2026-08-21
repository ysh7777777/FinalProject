using Microsoft.AspNetCore.Mvc;

namespace finalProject.Controllers
{
    public class DriverNavigationController : Controller
    {
        public IActionResult Navigation()
        {
            return View();
        }
    }
}
