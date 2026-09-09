namespace FinalProject.Models
{
    public partial class RidesRating
    {
        public int RatingId { get; set; }

        public string OrderNo { get; set; } = string.Empty;

        public string DriverName { get; set; } = string.Empty;

        public byte Score { get; set; }

        public string? Tags { get; set; }

        public Trip? Trip { get; set; }
    }
}
