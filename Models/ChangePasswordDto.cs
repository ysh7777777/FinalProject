using System.ComponentModel.DataAnnotations;

namespace FinalProject.Models
{
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "請輸入原密碼")]
        public string OldPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "請輸入新密碼")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "請再次輸入新密碼")]
        [Compare("NewPassword", ErrorMessage = "新密碼與確認密碼不相符")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
  
}
