namespace FinalProject.Models
{
    public partial class Complaint
    {
        public string ComplaintId { get; set; } = string.Empty;

        public string OrderNo { get; set; } = string.Empty;

        public string Account { get; set; } = string.Empty;

        public string ComplaintType { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending";

        public Trip? Trip { get; set; }

        public Member? Member { get; set; }
    }
}
