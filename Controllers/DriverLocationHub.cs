using Microsoft.AspNetCore.Mvc;
using FinalProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;


namespace finalProject.Hubs
{
    [Authorize(Roles = "driver,passenger")]
    public class DriverLocationHub : Hub
    {
        private readonly RideHailingDbContext _context;

        public DriverLocationHub(RideHailingDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            var account =
                Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
            var role =
                Context.User?.FindFirstValue(ClaimTypes.Role);

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
                    t.TripStatus == "行程中");

            trips = role == "driver"
                ? trips.Where(t => t.AssignedDriverId == account)
                : trips.Where(t => t.Account == account);

            var tripGroups = await trips
                .Select(t => new
                {
                    DriverId = t.AssignedDriverId!,
                    t.OrderNo
                })
                .ToListAsync(Context.ConnectionAborted);

            foreach (var trip in tripGroups)
            {
                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    BuildTripGroupName(
                        trip.DriverId,
                        trip.OrderNo),
                    Context.ConnectionAborted);
            }

            await base.OnConnectedAsync();
        }

        [Authorize(Roles = "driver")]
        public async Task SendDriverLocation(
            string tripSignalId,
            double latitude,
            double longitude)
        {
            if (!double.IsFinite(latitude) ||
                !double.IsFinite(longitude) ||
                latitude is < -90 or > 90 ||
                longitude is < -180 or > 180)
            {
                throw new HubException("GPS 座標格式不正確");
            }

            var authorizedTripSignalId =
                await GetAuthorizedTripSignalIdAsync(
                    tripSignalId);

            await Clients.Group(authorizedTripSignalId).SendAsync(
                "ReceiveDriverLocation",
                authorizedTripSignalId,
                latitude,
                longitude,
                Context.ConnectionAborted);
        }

        [Authorize(Roles = "driver")]
        public async Task DriverOnline(string driverId)
        {
            var currentDriverId = GetCurrentDriverId();

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
                    t.TripStatus == "行程中")
                .Select(t => t.OrderNo)
                .ToListAsync(Context.ConnectionAborted);

            foreach (var orderNo in activeTripOrderNos)
            {
                await Clients
                    .Group(BuildTripGroupName(
                        currentDriverId,
                        orderNo))
                    .SendAsync(
                        "DriverOnline",
                        currentDriverId,
                        Context.ConnectionAborted);
            }
        }

        [Authorize(Roles = "driver")]
        public async Task DriverArrivedPassenger(
            string tripSignalId)
        {
            var authorizedTripSignalId =
                await GetAuthorizedTripSignalIdAsync(
                    tripSignalId);

            await Clients.Group(authorizedTripSignalId).SendAsync(
                "DriverArrivedPassenger",
                authorizedTripSignalId,
                Context.ConnectionAborted);
        }

        [Authorize(Roles = "driver")]
        public async Task DriverArrivedDestination(
            string tripSignalId)
        {
            var authorizedTripSignalId =
                await GetAuthorizedTripSignalIdAsync(
                    tripSignalId);

            await Clients.Group(authorizedTripSignalId).SendAsync(
                "DriverArrivedDestination",
                authorizedTripSignalId,
                Context.ConnectionAborted);
        }




        private string GetCurrentDriverId()
        {
            var driverId =
                Context.User?.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(driverId))
            {
                throw new HubException("無法取得登入司機身分");
            }

            return driverId;
        }

        private async Task<string> GetAuthorizedTripSignalIdAsync(
            string tripSignalId)
        {
            var currentDriverId = GetCurrentDriverId();

            if (string.IsNullOrWhiteSpace(tripSignalId))
            {
                throw new HubException("缺少訂單識別資料");
            }

            var separatorIndex = tripSignalId.IndexOf('|');

            if (separatorIndex <= 0 ||
                separatorIndex == tripSignalId.Length - 1)
            {
                throw new HubException("訂單識別資料格式不正確");
            }

            var requestedDriverId =
                tripSignalId[..separatorIndex];
            var orderNo =
                tripSignalId[(separatorIndex + 1)..];

            if (!string.Equals(
                    requestedDriverId,
                    currentDriverId,
                    StringComparison.Ordinal))
            {
                throw new HubException("司機身分不符");
            }

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

            var authorizedTripSignalId =
                BuildTripGroupName(
                    currentDriverId,
                    orderNo);

            await Groups.AddToGroupAsync(
                Context.ConnectionId,
                authorizedTripSignalId,
                Context.ConnectionAborted);

            return authorizedTripSignalId;
        }

        private static string BuildTripGroupName(
            string driverId,
            string orderNo)
        {
            return $"{driverId}|{orderNo}";
        }
    }
}
