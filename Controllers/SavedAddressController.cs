using finalProject.Models;
using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace finalProject.Controllers
{
    [Authorize(Roles = "passenger")]
    public class SavedAddressController : Controller
    {
        private readonly RideHailingDbContext _context;

        public SavedAddressController(RideHailingDbContext context)
        {
            _context = context;
        }

        [HttpGet("SavedAddress")]
        public async Task<IActionResult> Index()
        {
            var account = GetCurrentPassengerAccount();
            if (string.IsNullOrEmpty(account))
            {
                return Forbid();
            }

            var addresses = await _context.MemberSavedAddresses
                .AsNoTracking()
                .Where(address => address.Account == account)
                .OrderByDescending(address => address.AddressId)
                .Select(address => new SavedAddressViewModel
                {
                    SavedAddressId = address.AddressId,
                    AddressName = address.Label,
                    FormattedAddress = address.AddressText,
                    Latitude = address.Latitude,
                    Longitude = address.Longitude
                })
                .ToListAsync();

            return View(addresses);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(SavedAddressViewModel model)
        {
            var account = GetCurrentPassengerAccount();
            if (string.IsNullOrEmpty(account))
            {
                return Forbid();
            }

            Normalize(model);
            if (!ModelState.IsValid)
            {
                TempData["ErrorMessage"] = "請輸入地址名稱，並從地址搜尋結果中選擇完整地址。";
                return RedirectToAction(nameof(Index));
            }

            _context.MemberSavedAddresses.Add(new MemberSavedAddress
            {
                Account = account,
                Label = model.AddressName,
                AddressText = model.FormattedAddress,
                Latitude = model.Latitude,
                Longitude = model.Longitude
            });

            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = "常用地址已新增。";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Update(SavedAddressViewModel model)
        {
            var account = GetCurrentPassengerAccount();
            if (string.IsNullOrEmpty(account))
            {
                return Forbid();
            }

            Normalize(model);
            if (model.SavedAddressId <= 0 || !ModelState.IsValid)
            {
                TempData["ErrorMessage"] = "常用地址資料不完整，請重新選擇後再儲存。";
                return RedirectToAction(nameof(Index));
            }

            var address = await _context.MemberSavedAddresses
                .FirstOrDefaultAsync(item =>
                    item.AddressId == model.SavedAddressId &&
                    item.Account == account);

            if (address == null)
            {
                return NotFound();
            }

            address.Label = model.AddressName;
            address.AddressText = model.FormattedAddress;
            address.Latitude = model.Latitude;
            address.Longitude = model.Longitude;

            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = "常用地址已更新。";

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int savedAddressId)
        {
            var account = GetCurrentPassengerAccount();
            if (string.IsNullOrEmpty(account))
            {
                return Forbid();
            }

            var address = await _context.MemberSavedAddresses
                .FirstOrDefaultAsync(item =>
                    item.AddressId == savedAddressId &&
                    item.Account == account);

            if (address == null)
            {
                return NotFound();
            }

            _context.MemberSavedAddresses.Remove(address);
            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = "常用地址已刪除。";

            return RedirectToAction(nameof(Index));
        }

        private string? GetCurrentPassengerAccount()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }

        private static void Normalize(SavedAddressViewModel model)
        {
            model.AddressName = model.AddressName?.Trim() ?? string.Empty;
            model.FormattedAddress = model.FormattedAddress?.Trim() ?? string.Empty;
        }
    }
}
