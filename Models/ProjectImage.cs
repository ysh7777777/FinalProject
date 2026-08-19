using System;
using System.Collections.Generic;

namespace FinalProject.Models;

public partial class ProjectImage
{
    public int ImageId { get; set; }

    public string ImageTitle { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public string? Description { get; set; }
}
