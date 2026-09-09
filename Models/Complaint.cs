namespace FinalProject.Models
{
    public partial class Complaint
    {
        public string? ComplaintId { get; set; }

        public string? OrderNo { get; set; }

        public string? Account { get; set; }

        public string? FullName { get; set; }

        public string? ComplaintType { get; set; }

        public string? Description { get; set; }

        public string? Status { get; set; } = "Pending";

        public string? ImagePath { get; set; }

        public Trip? Trip { get; set; }

        public Member? Member { get; set; }
    }
}
