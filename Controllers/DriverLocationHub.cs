using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace finalProject.Hubs
{
    /// <summary>
    /// 管理司機與乘客的即時行程群組，並轉送司機位置及抵達狀態。
    /// </summary>
    [Authorize(Roles = "driver,passenger")]
    public class DriverLocationHub : Hub
    {
        // 資料庫行程狀態與登入角色固定值。
        private const string InProgressStatus = "行程中";
        private const string DriverRole = "driver";

        // SignalR 前端監聽的事件名稱。
        private const string ReceiveDriverLocationEvent = "ReceiveDriverLocation";
        private const string DriverOnlineEvent = "DriverOnline";
        private const string DriverArrivedPassengerEvent = "DriverArrivedPassenger";
        private const string DriverArrivedDestinationEvent = "DriverArrivedDestination";

        // 行程群組名稱由司機編號與訂單編號組成。
        private const char TripGroupSeparator = '|';

        private readonly RideHailingDbContext _context;

        /// <summary>
        /// 初始化司機位置即時通訊 Hub。
        /// </summary>
        /// <param name="context">叫車系統的資料庫內容。</param>
        public DriverLocationHub(RideHailingDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// 驗證連線者身分，並依角色加入其進行中行程的 SignalR 群組。
        /// </summary>
        /// <returns>非同步連線處理工作。</returns>
        public override async Task OnConnectedAsync()
        {
            var account = Context.User?
                .FindFirstValue(ClaimTypes.NameIdentifier);
            var role = Context.User?
                .FindFirstValue(ClaimTypes.Role);

            // 缺少帳號或角色宣告時立即終止連線，避免加入未授權群組。
            if (string.IsNullOrWhiteSpace(account) ||
                string.IsNullOrWhiteSpace(role))
            {
                Context.Abort();
                return;
            }

            var trips = _context.Trips
                .AsNoTracking()
                .Where(t =>
                    t.AssignedDriverId != null &&
                    t.TripStatus == InProgressStatus);

            // 司機依指派司機編號、乘客依訂單帳號取得可接收的行程群組。
            trips = role == DriverRole
                ? trips.Where(t => t.AssignedDriverId == account)
                : trips.Where(t => t.Account == account);

            var tripGroups = await trips
                .Select(t => new
                {
                    DriverId = t.AssignedDriverId!,
                    t.OrderNo
                })
                .ToListAsync(Context.ConnectionAborted);

            // 同一位使用者可能同時具有多筆進行中行程，因此逐筆加入群組。
            foreach (var trip in tripGroups)
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    BuildTripGroupName(trip.DriverId, trip.OrderNo),
                    Context.ConnectionAborted);
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// 驗證並將司機目前位置傳送給指定行程群組。
        /// </summary>
        /// <param name="tripSignalId">由司機編號與訂單編號組成的行程識別資料。</param>
        /// <param name="latitude">GPS 緯度。</param>
        /// <param name="longitude">GPS 經度。</param>
        /// <returns>非同步位置傳送工作。</returns>
        [Authorize(Roles = "driver")]
        public async Task SendDriverLocation(
            string tripSignalId,
            double latitude,
            double longitude)
        {
            // 同時排除 NaN、Infinity 與超出地理座標範圍的數值。
            if (!double.IsFinite(latitude) ||
                !double.IsFinite(longitude) ||
                latitude is < -90 or > 90 ||
                longitude is < -180 or > 180)
            {
                throw new HubException("GPS 座標格式不正確");
            }

            var authorizedTripSignalId =
                await GetAuthorizedTripSignalIdAsync(tripSignalId);

            await Clients.Group(authorizedTripSignalId).SendAsync(
                ReceiveDriverLocationEvent,
                authorizedTripSignalId,
                latitude,
                longitude,
                Context.ConnectionAborted);
        }

        /// <summary>
        /// 通知目前司機所有進行中行程的群組：司機已上線。
        /// </summary>
        /// <param name="driverId">前端傳入並需與登入身分相符的司機編號。</param>
        /// <returns>非同步通知工作。</returns>
        [Authorize(Roles = "driver")]
        public async Task DriverOnline(string driverId)
        {
            var currentDriverId = GetCurrentDriverId();

            // 不信任前端傳入的司機編號，必須與登入宣告再次核對。
            if (!string.Equals(
                    driverId,
                    currentDriverId,
                    StringComparison.Ordinal))
            {
                throw new HubException("司機身分不符");
            }

            var activeTripOrderNos = await _context.Trips
                .AsNoTracking()
                .Where(t =>
                    t.AssignedDriverId == currentDriverId &&
                    t.TripStatus == InProgressStatus)
                .Select(t => t.OrderNo)
                .ToListAsync(Context.ConnectionAborted);

            // 對每筆進行中訂單個別通知，避免不同乘客收到彼此的狀態。
            foreach (var orderNo in activeTripOrderNos)
            {
                await Clients
                    .Group(BuildTripGroupName(currentDriverId, orderNo))
                    .SendAsync(
                        DriverOnlineEvent,
                        currentDriverId,
                        Context.ConnectionAborted);
            }
        }

        /// <summary>
        /// 通知指定行程群組：司機已抵達乘客上車地點。
        /// </summary>
        /// <param name="tripSignalId">行程識別資料。</param>
        /// <returns>非同步通知工作。</returns>
        [Authorize(Roles = "driver")]
        public async Task DriverArrivedPassenger(string tripSignalId)
        {
            var authorizedTripSignalId =
                await GetAuthorizedTripSignalIdAsync(tripSignalId);

            await Clients.Group(authorizedTripSignalId).SendAsync(
                DriverArrivedPassengerEvent,
                authorizedTripSignalId,
                Context.ConnectionAborted);
        }

        /// <summary>
        /// 通知指定行程群組：司機已抵達目的地。
        /// </summary>
        /// <param name="tripSignalId">行程識別資料。</param>
        /// <returns>非同步通知工作。</returns>
        [Authorize(Roles = "driver")]
        public async Task DriverArrivedDestination(string tripSignalId)
        {
            var authorizedTripSignalId =
                await GetAuthorizedTripSignalIdAsync(tripSignalId);

            await Clients.Group(authorizedTripSignalId).SendAsync(
                DriverArrivedDestinationEvent,
                authorizedTripSignalId,
                Context.ConnectionAborted);
        }

        /// <summary>
        /// 從目前 SignalR 連線的登入宣告取得司機編號。
        /// </summary>
        /// <returns>目前登入的司機編號。</returns>
        /// <exception cref="HubException">連線中沒有有效司機身分時擲回。</exception>
        private string GetCurrentDriverId()
        {
            var driverId = Context.User?
                .FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(driverId))
            {
                throw new HubException("無法取得登入司機身分");
            }

            return driverId;
        }

        /// <summary>
        /// 驗證行程識別格式、司機身分與訂單所有權，並將目前連線加入該行程群組。
        /// </summary>
        /// <param name="tripSignalId">前端傳入的行程識別資料。</param>
        /// <returns>驗證後的標準行程群組名稱。</returns>
        /// <exception cref="HubException">識別資料無效或司機無權存取訂單時擲回。</exception>
        private async Task<string> GetAuthorizedTripSignalIdAsync(string tripSignalId)
        {
            var currentDriverId = GetCurrentDriverId();

            if (string.IsNullOrWhiteSpace(tripSignalId))
            {
                throw new HubException("缺少訂單識別資料");
            }

            var separatorIndex = tripSignalId.IndexOf(TripGroupSeparator);

            if (separatorIndex <= 0 ||
                separatorIndex == tripSignalId.Length - 1)
            {
                throw new HubException("訂單識別資料格式不正確");
            }

            var requestedDriverId = tripSignalId[..separatorIndex];
            var orderNo = tripSignalId[(separatorIndex + 1)..];

            // 行程識別中的司機編號必須與目前登入司機完全一致。
            if (!string.Equals(
                    requestedDriverId,
                    currentDriverId,
                    StringComparison.Ordinal))
            {
                throw new HubException("司機身分不符");
            }

            // 以資料庫訂單關聯作最後授權判斷，不能只信任前端組成的識別字串。
            var ownsTrip = await _context.Trips
                .AsNoTracking()
                .AnyAsync(t =>
                    t.OrderNo == orderNo &&
                    t.AssignedDriverId == currentDriverId,
                    Context.ConnectionAborted);

            if (!ownsTrip)
            {
                throw new HubException("無權存取此訂單");
            }

            var authorizedTripSignalId = BuildTripGroupName(
                currentDriverId,
                orderNo);

            // 司機傳送事件前確保目前連線已在對應群組中。
            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                authorizedTripSignalId,
                Context.ConnectionAborted);

            return authorizedTripSignalId;
        }

        /// <summary>
        /// 建立司機與乘客共同使用的行程 SignalR 群組名稱。
        /// </summary>
        /// <param name="driverId">司機編號。</param>
        /// <param name="orderNo">訂單編號。</param>
        /// <returns>格式為「司機編號|訂單編號」的群組名稱。</returns>
        private static string BuildTripGroupName(
            string driverId,
            string orderNo)
        {
            return $"{driverId}{TripGroupSeparator}{orderNo}";
        }
    }
}
