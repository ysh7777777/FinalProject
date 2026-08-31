using finalProject.Hubs;
using FinalProject.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 連線到資料庫，勿動。名稱 "letmesee" 與 appsettings.json 的名稱有關係
builder.Services.AddDbContext<RideHailingDbContext>(
            options => options.UseSqlServer(builder.Configuration.GetConnectionString("letmesee")));

// Add services to the container.
builder.Services.AddControllersWithViews();
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login";
        options.AccessDeniedPath = "/Login";
        options.Cookie.Name = "FinalProject.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromDays(1);
        options.SlidingExpiration = false;
    });



builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    //pattern: "{controller=Booking}/{action=BookingPage}/{id?}")
    //pattern: "{controller=Members}/{action=Login}/{id?}")
    //pattern: "{controller=Home}/{action=Index}/{id?}")
    pattern: "{controller=ClientHistory_New}/{action=ClientHistory_New}/{id?}")
    .WithStaticAssets();

app.MapHub<DriverLocationHub>(
    "/driverLocationHub"
);

app.Run();
