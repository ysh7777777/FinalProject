using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;


namespace finalProject.Hubs
{
    public class DriverLocationHub : Hub
    {
        public async Task SendDriverLocation(
            string driverId,
            double latitude,
            double longitude)
        {
            Console.WriteLine(
                $"Driver: {driverId}, Lat: {latitude}, Lng: {longitude}"
            );

            await Clients.All.SendAsync(
                "ReceiveDriverLocation",
                driverId,
                latitude,
                longitude
            );
        }

        public async Task DriverOnline(string driverId)
        {
            await Clients.All.SendAsync(
                "DriverOnline",
                driverId
            );
        }

        public async Task DriverArrivedPassenger(string driverId)
        {
            await Clients.All.SendAsync(
                "DriverArrivedPassenger",
                driverId
            );
        }
        public async Task DriverArrivedDestination(string driverId)
        {
            await Clients.All.SendAsync(
                "DriverArrivedDestination",
                driverId
            );
        }




    }
}