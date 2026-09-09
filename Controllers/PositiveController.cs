using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    public class PositiveController : Controller
    {   
        public IActionResult PForm()
        {
            return View();
        }

    }
}
