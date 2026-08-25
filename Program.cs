using FinalProject.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 連線到資料庫，勿動。名稱 "letmesee" 與 appsettings.json 的名稱有關係
builder.Services.AddDbContext<RideHailingDbContext>(
            options => options.UseSqlServer(builder.Configuration.GetConnectionString("letmesee")));

// Add services to the container.
builder.Services.AddControllersWithViews();



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

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    //pattern: "{controller=Booking}/{action=BookingPage}/{id?}")
    pattern: "{controller=Members}/{action=Login}/{id?}")
    .WithStaticAssets();


app.Run();
