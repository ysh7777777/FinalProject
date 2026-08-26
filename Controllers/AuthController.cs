using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        [AllowAnonymous]
        [HttpGet("me")]
        [ResponseCache(Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Me()
        {
            if (User.Identity?.IsAuthenticated != true)
            {
                return Ok(new { isAuthenticated = false });
            }

            string? account = User.FindFirstValue(ClaimTypes.NameIdentifier);
            string? role = User.FindFirstValue(ClaimTypes.Role);

            if (string.IsNullOrWhiteSpace(account) || string.IsNullOrWhiteSpace(role))
            {
                return Ok(new { isAuthenticated = false });
            }

            return role switch
            {
                "passenger" => Ok(new
                {
                    isAuthenticated = true,
                    role,
                    userId = account
                }),
                "driver" => Ok(new
                {
                    isAuthenticated = true,
                    role,
                    driverId = account
                }),
                _ => Ok(new
                {
                    isAuthenticated = true,
                    role
                })
            };
        }
    }
}
