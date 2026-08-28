using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class Member
{
    public string Account { get; set; } = null!;

    public string Password { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? Gender { get; set; }

    public string Email { get; set; } = null!;

    public string PhoneNumber { get; set; } = null!;

    public DateOnly Birthday { get; set; }

    public virtual ICollection<MemberSavedAddress> MemberSavedAddresses { get; set; } = new List<MemberSavedAddress>();

    public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();
}
