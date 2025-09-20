using System.Text.Json;

namespace api.Services
{
    public class LoggingService
    {
        private readonly ILogger<LoggingService> _logger;
        private readonly string _logFilePath;

        public LoggingService(ILogger<LoggingService> logger)
        {
            _logger = logger;
            _logFilePath = Path.Combine(Directory.GetCurrentDirectory(), "logs", "security.log");
            
            // Ensure logs directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(_logFilePath)!);
        }

        public void LogSecurityEvent(string eventType, string message, string? userId = null, string? ipAddress = null)
        {
            var logEntry = new
            {
                Timestamp = DateTime.UtcNow,
                EventType = eventType,
                Message = message,
                UserId = userId,
                IpAddress = ipAddress,
                Severity = GetSeverityLevel(eventType)
            };

            var logMessage = JsonSerializer.Serialize(logEntry);
            
            // Log to file
            File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
            
            // Log to console/application insights
            _logger.LogWarning("Security Event: {EventType} - {Message}", eventType, message);
        }

        public void LogError(string message, Exception? exception = null, string? userId = null)
        {
            var logEntry = new
            {
                Timestamp = DateTime.UtcNow,
                EventType = "Error",
                Message = message,
                Exception = exception?.ToString(),
                UserId = userId,
                Severity = "High"
            };

            var logMessage = JsonSerializer.Serialize(logEntry);
            File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
            
            _logger.LogError(exception, "Error: {Message}", message);
        }

        public void LogUserAction(string action, string? userId = null, string? details = null)
        {
            var logEntry = new
            {
                Timestamp = DateTime.UtcNow,
                EventType = "UserAction",
                Action = action,
                UserId = userId,
                Details = details,
                Severity = "Info"
            };

            var logMessage = JsonSerializer.Serialize(logEntry);
            File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
            
            _logger.LogInformation("User Action: {Action} by User {UserId}", action, userId);
        }

        public void LogApiCall(string method, string endpoint, int statusCode, long durationMs, string? userId = null)
        {
            var logEntry = new
            {
                Timestamp = DateTime.UtcNow,
                EventType = "ApiCall",
                Method = method,
                Endpoint = endpoint,
                StatusCode = statusCode,
                DurationMs = durationMs,
                UserId = userId,
                Severity = statusCode >= 400 ? "Warning" : "Info"
            };

            var logMessage = JsonSerializer.Serialize(logEntry);
            File.AppendAllText(_logFilePath, logMessage + Environment.NewLine);
        }

        private string GetSeverityLevel(string eventType)
        {
            return eventType switch
            {
                "LoginAttempt" => "Info",
                "FailedLogin" => "Warning",
                "SuspiciousActivity" => "High",
                "DataBreach" => "Critical",
                "UnauthorizedAccess" => "High",
                "InputValidation" => "Warning",
                _ => "Info"
            };
        }
    }
}
