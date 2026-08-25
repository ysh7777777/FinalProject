using FinalProject.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Controllers
{
    public class HomeController : Controller
    {
        private readonly RideHailingDbContext _context;
        public HomeController(RideHailingDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index()
        {
         List<ProjectImage> heroSlides = await _context.ProjectImages
        .AsNoTracking()
        .Where(image => image.ImageTitle.StartsWith("首頁輪播"))
        .OrderBy(image => image.ImageId)
        .ToListAsync();

            return View(heroSlides);
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
