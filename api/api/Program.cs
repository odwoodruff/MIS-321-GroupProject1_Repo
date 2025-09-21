using api.Services;
using api.Data;
using api.Models.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure settings
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AdminSettings>(builder.Configuration.GetSection("AdminSettings"));

// Add Entity Framework
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=books.db"));

// Add services to the container.
builder.Services.AddScoped<BookService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<RatingService>();
builder.Services.AddScoped<DataMigrationService>();
builder.Services.AddScoped<ValidationService>();
builder.Services.AddScoped<EmailVerificationService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddSingleton<LoggingService>();
builder.Services.AddScoped<BackupService>();
builder.Services.AddSingleton<RateLimitingService>();
builder.Services.AddHostedService<RateLimitCleanupService>();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS with restricted origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("RestrictedPolicy",
    builder =>
    {
        builder.WithOrigins("http://localhost:3000", "https://localhost:3000", 
                           "http://127.0.0.1:3000", "https://127.0.0.1:3000",
                           "http://localhost:8080", "https://localhost:8080",
                           "http://127.0.0.1:8080", "https://127.0.0.1:8080",
                           "null")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});

// Add JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings?.Issuer ?? "BookTradingApp",
            ValidAudience = jwtSettings?.Audience ?? "BookTradingApp",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings?.Key ?? throw new InvalidOperationException("JWT Key is not configured")))
        };
    });

// Add Authorization
builder.Services.AddAuthorization();

// Add CSRF protection
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.SuppressXFrameOptionsHeader = false;
});

var app = builder.Build();

// Ensure database is created and run data migration on startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.EnsureCreatedAsync();
        
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

// Add global exception handling middleware
app.UseMiddleware<api.Middleware.GlobalExceptionMiddleware>();

// Add security middleware
app.UseMiddleware<api.Middleware.SecurityMiddleware>();

app.UseCors("RestrictedPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();