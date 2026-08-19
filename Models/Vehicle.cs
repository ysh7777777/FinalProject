using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class Vehicle
{
    public string LicensePlate { get; set; } = null!;

    public string? BaseLocation { get; set; }

    public string? VehicleType { get; set; }

    public byte? MaxPassengers { get; set; }

    public byte? MaxLuggage { get; set; }

    public byte? ChildSeats { get; set; }

    public int? BaseFare { get; set; }

    public string? VehicleStatus { get; set; }

    public virtual ICollection<DriverShiftSchedule> DriverShiftSchedules { get; set; } = new List<DriverShiftSchedule>();

    public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
}
