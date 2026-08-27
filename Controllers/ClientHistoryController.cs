using Microsoft.AspNetCore.Mvc;

namespace FinalProject.Controllers
{
    public class ClientHistoryController : Controller
    {
        public IActionResult ClientHistory()
        {
            return View();
        }
    }
}
