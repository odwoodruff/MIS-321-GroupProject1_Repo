using api.Services;
using api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=books.db"));

// Add services to the container.
builder.Services.AddScoped<BookService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<RatingService>();
builder.Services.AddScoped<DataMigrationService>();
builder.Services.AddScoped<ValidationService>();
builder.Services.AddSingleton<LoggingService>();
builder.Services.AddScoped<BackupService>();
builder.Services.AddSingleton<RateLimitingService>();
builder.Services.AddHostedService<RateLimitCleanupService>();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("OpenPolicy",
    builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// Run data migration on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var migrationService = scope.ServiceProvider.GetRequiredService<DataMigrationService>();
        await migrationService.MigrateCsvToSqliteAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Migration error: {ex.Message}");
        // Continue with app startup even if migration fails
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Add security middleware
app.UseMiddleware<api.Middleware.SecurityMiddleware>();

app.UseCors("OpenPolicy");

app.UseAuthorization();

app.MapControllers();

app.Run();