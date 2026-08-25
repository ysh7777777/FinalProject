using finalProject.Models;
using Microsoft.AspNetCore.Mvc;

namespace finalProject.Controllers
{
    public class SavedAddressController : Controller
    {
        private static List<SavedAddressViewModel> _addresses = new();

        public IActionResult Index()
        {
            return View(_addresses);
        }

        [HttpPost]
        public IActionResult Create(
            string addressName,
            string formattedAddress,
            decimal latitude,
            decimal longitude,
            string placeId)
        {
            var newAddress = new SavedAddressViewModel
            {
                SavedAddressId = _addresses.Count + 1,
                AddressName = addressName,
                FormattedAddress = formattedAddress,
                Latitude = latitude,
                Longitude = longitude,
                PlaceId = placeId
            };

            _addresses.Add(newAddress);

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public IActionResult Delete(int savedAddressId)
        {
            var target = _addresses
                .FirstOrDefault(x => x.SavedAddressId == savedAddressId);

            if (target != null)
            {
                _addresses.Remove(target);
            }

            return RedirectToAction(nameof(Index));
        }
    }
}