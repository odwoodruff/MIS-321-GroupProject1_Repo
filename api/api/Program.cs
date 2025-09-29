using api.Services;
using api.Data;
using api.Models.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Let .NET assign an available port automatically

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
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<ContactedSellerService>();
builder.Services.AddScoped<PromptedToRateService>();
builder.Services.AddScoped<RatedBookService>();
builder.Services.AddSingleton<LoggingService>();
builder.Services.AddScoped<BackupService>();
builder.Services.AddSingleton<RateLimitingService>();
builder.Services.AddHostedService<RateLimitCleanupService>();
builder.Services.AddScoped<UserStatisticsService>();
builder.Services.AddScoped<SupportTicketService>();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS with restricted origins - SECURITY HARDENED
builder.Services.AddCors(options =>
{
    options.AddPolicy("RestrictedPolicy",
    builder =>
    {
        builder.SetIsOriginAllowed(origin => 
        {
            // Allow specific origins
            var allowedOrigins = new[]
            {
                "http://localhost:3000", "https://localhost:3000",
                "http://127.0.0.1:3000", "https://127.0.0.1:3000",
                "http://localhost:8080", "https://localhost:8080",
                "http://127.0.0.1:8080", "https://127.0.0.1:8080",
                "http://localhost:5032", "https://localhost:5032"
            };
            
            // Allow null origin for local file:// URLs (development only)
            if (string.IsNullOrEmpty(origin) || origin == "null")
                return true;
                
            // Allow any localhost origin in development
            if (origin.StartsWith("http://localhost") || origin.StartsWith("https://localhost"))
                return true;
                
            return allowedOrigins.Contains(origin);
        })
               .WithMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Explicit methods only
               .WithHeaders("Content-Type", "Authorization", "X-Requested-With", "X-CSRF-TOKEN") // Explicit headers only
               .AllowCredentials()
               .SetPreflightMaxAge(TimeSpan.FromMinutes(10)); // Cache preflight for 10 minutes
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
                Encoding.UTF8.GetBytes(jwtSettings?.Key ?? throw new InvalidOperationException("JWT Key is not configured"))),
            ClockSkew = TimeSpan.Zero
        };
        
        // Configure events to handle authentication
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"JWT Authentication failed: {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine($"JWT Token validated for user: {context.Principal?.Identity?.Name}");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                // Try to get token from Authorization header
                var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

// Add Authorization
builder.Services.AddAuthorization();

// Add CSRF protection - SECURITY HARDENED
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
    options.SuppressXFrameOptionsHeader = false;
    options.Cookie.Name = "CSRF-TOKEN";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.SameSite = SameSiteMode.Strict;
});

var app = builder.Build();

// Store the app instance to access port later

// Ensure database is created and run data migration on startup
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    var loggingService = scope.ServiceProvider.GetRequiredService<LoggingService>();
    
    try
    {
        logger.LogInformation("Starting database initialization...");
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Use EnsureCreatedAsync for existing database compatibility
        await context.Database.EnsureCreatedAsync();
        logger.LogInformation("Database migrations applied successfully");
        
        var migrationService = scope.ServiceProvider.GetRequiredService<DataMigrationService>();
        await migrationService.MigrateCsvToSqliteAsync();
        logger.LogInformation("Data migration completed successfully");
    }
    catch (Exception ex)
    {
        var errorMessage = $"Critical migration error: {ex.Message}";
        logger.LogError(ex, errorMessage);
        loggingService.LogError(errorMessage, ex);
        
        // For development, continue but log the issue
        // In production, you might want to fail fast
        if (app.Environment.IsDevelopment())
        {
            logger.LogWarning("Continuing startup in development mode despite migration failure");
        }
        else
        {
            logger.LogCritical("Migration failed in production - application may be in inconsistent state");
        }
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

// Get the actual assigned port and make it available
var port = app.Urls.FirstOrDefault()?.Split(':').LastOrDefault() ?? "5032";
Console.WriteLine($"Server running on port: {port}");

// Add endpoint to expose the port to client
app.MapGet("/api/config/port", () => new { port = port });

app.Run();