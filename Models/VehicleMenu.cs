using System;
using System.Collections.Generic;

namespace FinalProject.Models;

// 因為新增 VehicleMenu 表單，所以新增 (08/23 益)
public partial class VehicleMenu
{
    public int VehicleId { get; set; }

    public string? VehicleType { get; set; }

    public byte? MaxPassengers { get; set; }

    public byte? MaxLuggage { get; set; }

    public byte? ChildSeats { get; set; }

    public int? BaseFare { get; set; }

    public string? ImageTitle { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? Description { get; set; }



    //public virtual ICollection<Vehicle> DriverShiftSchedules { get; set; } = new List<Vehicle>();
}
