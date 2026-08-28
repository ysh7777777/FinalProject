using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public class OrdersViewModel
{
    public List<Trip> FutureOrders { get; set; } = new List<Trip> ();

    public List<Trip> HistoryOrders{ get; set; } = new List<Trip> ();
}

public partial class Trip
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

    // 新增資料
    public byte? BabySeat { get; set; }

    public int? Fare { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? CanceledAt { get; set; }

    public virtual Member AccountNavigation { get; set; } = null!;

    public virtual Driver? AssignedDriver { get; set; }

    public virtual Vehicle? LicensePlateNavigation { get; set; }
}
