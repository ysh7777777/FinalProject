namespace FinalProject.DTO
{
    public class CreateBookingDto
    {
        public DateTime? DepartureTime { get; set; }

        public string? PickupLocation { get; set; }

        public decimal? PickupLat { get; set; }

        public decimal? PickupLng { get; set; }

        public string? Destination { get; set; }

        public decimal? DestinationLat { get; set; }

        public decimal? DestinationLng { get; set; }

        public string? VehicleType { get; set; }

        public byte? PassengerCount { get; set; }

        public byte? LuggageCount { get; set; }
    }
}
