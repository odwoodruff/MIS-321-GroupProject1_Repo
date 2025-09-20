using api.Services;

namespace api.Services
{
    public class RateLimitCleanupService : BackgroundService
    {
        private readonly RateLimitingService _rateLimitingService;
        private readonly ILogger<RateLimitCleanupService> _logger;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromMinutes(30);

        public RateLimitCleanupService(RateLimitingService rateLimitingService, ILogger<RateLimitCleanupService> logger)
        {
            _rateLimitingService = rateLimitingService;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _rateLimitingService.CleanupOldEntries();
                    _logger.LogInformation("Rate limiting cleanup completed");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during rate limiting cleanup");
                }

                await Task.Delay(_cleanupInterval, stoppingToken);
            }
        }
    }
}
