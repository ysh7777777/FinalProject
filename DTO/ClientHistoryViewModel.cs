using FinalProject.Models;

namespace FinalProject.DTO
{
    public class ClientHistoryViewModel
    {
        public string OrderNoView { get; set; } = null!;

        public string AccountView { get; set; } = null!;

        public string? TripStatusView { get; set; }

        public DateTime? DepartureTimeView { get; set; }

        public int? EstimatedDurationView { get; set; }

        public string? PickupLocationView { get; set; }

        public string? DestinationView { get; set; }

        public string? LicensePlateView { get; set; }

        public string? VehicleTypeView { get; set; }

        public string? AssignedDriverIdView { get; set; }

        public byte? PassengerCountView { get; set; }

        public byte? LuggageCountView { get; set; }

        // 新增資料
        public byte? BabySeatView { get; set; }

        public int? FareView { get; set; }

        public DateTime? CompletedAtView { get; set; }

        public DateTime? CanceledAtView { get; set; }

        public virtual Member AccountNavigationView { get; set; } = null!;

        public virtual Driver? AssignedDriverView { get; set; }

        public virtual Vehicle? LicensePlateNavigationView { get; set; }

    }
}
