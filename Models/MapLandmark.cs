using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class MapLandmark
{
    public int LandmarkId { get; set; }

    public string LandmarkName { get; set; } = null!;

    public string? AddressText { get; set; }

    public decimal Latitude { get; set; }

    public decimal Longitude { get; set; }
}
