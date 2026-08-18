using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class Driver
{
    public string DriverId { get; set; } = null!;

    public string DriverName { get; set; } = null!;

    public string? BaseLocation { get; set; }

    public string Password { get; set; } = null!;

    public virtual ICollection<DriverLocationLog> DriverLocationLogs { get; set; } = new List<DriverLocationLog>();

    public virtual ICollection<DriverShiftSchedule> DriverShiftSchedules { get; set; } = new List<DriverShiftSchedule>();

    public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
}
