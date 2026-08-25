using System.ComponentModel.DataAnnotations;

namespace finalProject.Models
{
    public class SavedAddressViewModel
    {
        public int SavedAddressId { get; set; }

        [Required]
        [StringLength(20)]
        public string AddressName { get; set; } = string.Empty;

        [Required]
        [StringLength(200)]
        public string FormattedAddress { get; set; } = string.Empty;

        [Required]
        [Range(-90, 90)]
        public decimal? Latitude { get; set; }

        [Required]
        [Range(-180, 180)]
        public decimal? Longitude { get; set; }

        // Google Places 選取時使用；既有資料表沒有對應欄位，不寫入資料庫。
        public string? PlaceId { get; set; }
    }
}
