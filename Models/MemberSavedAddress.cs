using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class MemberSavedAddress
{
    public int AddressId { get; set; }

    public string Account { get; set; } = null!;

    public string Label { get; set; } = null!;

    public string AddressText { get; set; } = null!;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public virtual Member AccountNavigation { get; set; } = null!;
}
