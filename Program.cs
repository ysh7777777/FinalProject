using System.Text.Encodings.Web;
using System.Text.Unicode;
using FinalProject.Models;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 連線到資料庫，勿動。名稱 "letmesee" 與 appsettings.json 的名稱有關係
builder.Services.AddDbContext<RideHailingDbContext>(
            options => options.UseSqlServer(builder.Configuration.GetConnectionString("letmesee")));

// 這段是 JSON 回傳中文時，盡量直接顯示中文
builder.Services.AddControllersWithViews().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Encoder =
        JavaScriptEncoder.Create(UnicodeRanges.All);
});

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
    pattern: "{controller=Logic}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
