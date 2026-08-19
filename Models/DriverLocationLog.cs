using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class DriverLocationLog
{
    public long LocationId { get; set; }

    public string DriverId { get; set; } = null!;

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }

    public short? Heading { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Driver Driver { get; set; } = null!;
}
