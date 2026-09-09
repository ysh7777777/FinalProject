using FinalProject.DTO;
using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client.NativeInterop;
using System.Security.Claims;

namespace FinalProject.Controllers
{
    [Authorize(Roles = "passenger")]
    public class ComplaintController : Controller
    {
        private readonly RideHailingDbContext _context;

        public ComplaintController(RideHailingDbContext context)
        {
            _context = context;
        }

        public IActionResult ComplaintPage()
        {
            // 取得目前登入會員帳號
            string? currentAccount = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(currentAccount))
            { return Unauthorized(); }

            return View();
        }
        // ==========================================
        // GET：投訴頁面
        // ==========================================
        [HttpGet]
        public IActionResult ComplaintPage(string orderNumber)
        {

            // 1. 檢查是否有訂單編號
            if (string.IsNullOrEmpty(orderNumber))
            {
                return BadRequest("缺少訂單編號");
            }
            // 2. 根據訂單編號取得訂單
            var order = _context.Trips
                .Include(o => o.AccountNavigation)
                .FirstOrDefault(o => o.OrderNo == orderNumber);
            // 3. 找不到訂單
            if (order == null)
            {
                return NotFound("找不到此訂單");
            }
            // 4. 將資料放入 ViewModel
            var model = new ComplaintViewModel
            {
                OrderNoView = order.OrderNo,
                FullNameView = order.AccountNavigation.FullName,
                PhoneNumberView = order.AccountNavigation.PhoneNumber,
                EmailView = order.AccountNavigation.Email,
                AccountView = order.AccountNavigation.Account,
            };
            return View(model);
        }

        // 生成訂單編號(與建立訂單日同)
        public string GenerateOrderNumber()
        {
            string date = DateTime.Now.ToString("yyyyMMdd");

            // 產生隨機數
            Random number = new Random();
            HashSet<int> used = new HashSet<int>();
            int result;
            do { result = number.Next(100, 1000); }
            while (!used.Add(result));
            string random = result.ToString();

            // 產出完整訂單號
            return $"C{date}{random}";
        }






        // ==========================================
        // POST：送出申訴
        // ==========================================
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Submit(ComplaintViewModel model)
        {
            foreach (var item in ModelState)
                {
                    foreach (var error in item.Value.Errors)
                    {
                        Console.WriteLine( $"欄位：{item.Key}，錯誤：{error.ErrorMessage}" );
                    }
                }

            if (!ModelState.IsValid)
            {
                return View("ComplaintPage", model);
            }
            // 建立申訴資料
            var complaint = new Complaint
            {
                ComplaintId = GenerateOrderNumber(),
                OrderNo = model.OrderNoView,
                // 下面依照你的 ViewModel 欄位修改
                Account = model.AccountView,
                FullName = model.FullNameView,
                ComplaintType = model.ComplaintTypeView,
                Description = model.DescriptionView,
                Status = "Pending",
                // ComplaintContent = model.ComplaintContent,
                // ...
            };

            // 加入 DbContext
            _context.Complaints.Add(complaint);

            // 寫入資料庫
            await _context.SaveChangesAsync();
            var imagePaths = new List<string>();

            if (model.ImagesView != null && model.ImagesView.Count > 0)
            {
                var image = model.ImagesView[0];
                if (image.Length > 0)
                    {
                    var extension = Path.GetExtension(image.FileName);
                    // 產生檔名(隨機 GUID.原始副檔名)
                    var fileName = Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);
                    // 產生檔名(原始檔名_隨機 GUID.原始副檔名)
                    //var fileName = Path.GetFileNameWithoutExtension(image.FileName) + "_" + Guid.NewGuid().ToString() + Path.GetExtension(image.FileName);

                        // 儲存位置
                        var uploadPath = Path.Combine(
                            Directory.GetCurrentDirectory(),
                            "wwwroot",
                            "ComplaintImg"
                        );

                        // 如果資料夾不存在就建立
                        Directory.CreateDirectory(uploadPath);

                        var filePath = Path.Combine(uploadPath, fileName);

                        // 儲存圖片
                        using (var stream = new FileStream(filePath, FileMode.Create))
                        { await image.CopyToAsync(stream); }

                        // 存圖片路徑
                        complaint.ImagePath = "/ComplaintImg/" + fileName;

                    // 圖片路徑有修改
                    _context.Complaints.Update(complaint);

                    await _context.SaveChangesAsync();
                }
            }
            TempData["SuccessMessage"] = "申訴已成功送出，我們會盡快為您處理。";

            return RedirectToAction("ComplaintPage");
        }

    }
}
