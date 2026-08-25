namespace FinalProject.DTO
{
    public class TempBooking
    {
        public string OrderNo { get; set; } = null!;

        public string Account { get; set; } = null!;

        public string? TripStatus { get; set; }

        public DateTime? DepartureTime { get; set; }

        public int? EstimatedDuration { get; set; }

        public string? PickupLocation { get; set; }

        public decimal? PickupLat { get; set; }

        public decimal? PickupLng { get; set; }

        public string? Destination { get; set; }

        public decimal? DestinationLat { get; set; }

        public decimal? DestinationLng { get; set; }

        public string? LicensePlate { get; set; }

        public string? AssignedDriverId { get; set; }

        public string? VehicleType { get; set; }

        public byte? PassengerCount { get; set; }

        public byte? LuggageCount { get; set; }

        public DateTime? CompletedAt { get; set; }

        public DateTime? CanceledAt { get; set; }
    }
}
