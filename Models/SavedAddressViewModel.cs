namespace finalProject.Models
{
    public class SavedAddressViewModel
    {
        public int SavedAddressId { get; set; }

        public string AddressName { get; set; } = string.Empty;

        public string FormattedAddress { get; set; } = string.Empty;

        public decimal Latitude { get; set; }

        public decimal Longitude { get; set; }

        public string PlaceId { get; set; } = string.Empty;
    }
}
