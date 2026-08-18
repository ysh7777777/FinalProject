using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class DriverShiftSchedule
{
    public string ShiftId { get; set; } = null!;

    public string DriverId { get; set; } = null!;

    public string? LicensePlate { get; set; }

    public DateOnly? ShiftDate { get; set; }

    public TimeOnly? ShiftStart { get; set; }

    public TimeOnly? ShiftEnd { get; set; }

    public string? DriverStatus { get; set; }

    public virtual Driver Driver { get; set; } = null!;

    public virtual Vehicle? LicensePlateNavigation { get; set; }
}
