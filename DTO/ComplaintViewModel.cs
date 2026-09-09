using System.ComponentModel.DataAnnotations;

namespace FinalProject.DTO
{
    public class ComplaintViewModel
    {
        // ==============================
        // 訂單資訊
        // ==============================

        public string? OrderNoView { get; set; }

        public string? AccountView { get; set; }

        public string? FullNameView { get; set; }

        public string? PhoneNumberView { get; set; }

        public string? EmailView { get; set; }


        // ==============================
        // 申訴內容
        // ==============================

        [Required(ErrorMessage = "請選擇申訴類型")]
        public string? ComplaintTypeView { get; set; }


        [Required(ErrorMessage = "請輸入問題說明")]
        public string? DescriptionView { get; set; }


        // ==============================
        // 上傳圖片
        // ==============================

        public List<IFormFile>? ImagesView { get; set; } = new List<IFormFile>();
    }
}
