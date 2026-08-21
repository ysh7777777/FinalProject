using FinalProject.Models;
using Microsoft.EntityFrameworkCore;

namespace FinalProject.Services
{
    public class MembersServices
    {
        private readonly RideHailingDbContext _context;

        public MembersServices(RideHailingDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message)> RegisterAsync(Member request)
        {
            // 1. 檢查有沒有收到資料
            if (request == null)
            {
                return (false, "沒有收到註冊資料");
            }

            // 2. 檢查帳號、密碼
            if (string.IsNullOrWhiteSpace(request.Account) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return (false, "帳號與密碼不可為空");
            }

            // 3. 檢查帳號是否存在
            bool accountExist = await _context.Members
                .AnyAsync(m => m.Account == request.Account);

            if (accountExist)
            {
                return (false, "帳號已經註冊過");
            }

            // 4. 檢查 Email 是否存在 (須先確認 Email 不是空的才查 DB)
            if (!string.IsNullOrWhiteSpace(request.Email))
            {
                bool emailExist = await _context.Members
                    .AnyAsync(m => m.Email == request.Email);

                if (emailExist)
                {
                    return (false, "Email 已經註冊過");
                }
            }

            // 5. 密碼 Hash
            request.Password =
                BCrypt.Net.BCrypt.HashPassword(request.Password);

            // 6. 加入資料庫
            _context.Members.Add(request);

            // 7. 儲存
            await _context.SaveChangesAsync();

            return (true, "註冊成功");
        }
    }
}