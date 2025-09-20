using api.Services;
using System.Text;

namespace api.Middleware
{
    public class SecurityMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SecurityMiddleware> _logger;
        private readonly RateLimitingService _rateLimitingService;
        private readonly LoggingService _loggingService;

        public SecurityMiddleware(RequestDelegate next, ILogger<SecurityMiddleware> logger, 
            RateLimitingService rateLimitingService, LoggingService loggingService)
        {
            _next = next;
            _logger = logger;
            _rateLimitingService = rateLimitingService;
            _loggingService = loggingService;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var startTime = DateTime.UtcNow;
            var clientIp = GetClientIpAddress(context);
            var userAgent = context.Request.Headers["User-Agent"].ToString();
            var requestPath = context.Request.Path.Value ?? "";
            var requestMethod = context.Request.Method;

            // Log the API call
            _loggingService.LogApiCall(requestMethod, requestPath, 0, 0);

            // Check for suspicious user agents
            if (IsSuspiciousUserAgent(userAgent))
            {
                _loggingService.LogSecurityEvent("SuspiciousActivity", 
                    $"Suspicious user agent detected: {userAgent}", null, clientIp);
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("Access denied");
                return;
            }

            // Check for SQL injection in query parameters
            if (ContainsSqlInjection(context.Request.QueryString.Value ?? ""))
            {
                _loggingService.LogSecurityEvent("SuspiciousActivity", 
                    $"Potential SQL injection attempt in query string: {context.Request.QueryString}", null, clientIp);
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Invalid request");
                return;
            }

            // Rate limiting
            var identifier = GetRateLimitIdentifier(context);
            var actionType = GetActionType(requestPath);
            
            if (_rateLimitingService.IsRateLimited(identifier, actionType))
            {
                _loggingService.LogSecurityEvent("RateLimitExceeded", 
                    $"Rate limit exceeded for {identifier} on {requestPath}", null, clientIp);
                
                context.Response.StatusCode = 429;
                context.Response.Headers.Add("Retry-After", "60");
                await context.Response.WriteAsync("Rate limit exceeded. Please try again later.");
                return;
            }

            // Add security headers
            AddSecurityHeaders(context);

            // Continue to next middleware
            await _next(context);

            // Log completion
            var duration = (DateTime.UtcNow - startTime).TotalMilliseconds;
            _loggingService.LogApiCall(requestMethod, requestPath, context.Response.StatusCode, (long)duration);
        }

        private string GetClientIpAddress(HttpContext context)
        {
            // Check for forwarded IP first (for load balancers/proxies)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private bool IsSuspiciousUserAgent(string userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return true;

            var suspiciousPatterns = new[]
            {
                "sqlmap", "nmap", "nikto", "w3af", "acunetix", "nessus",
                "curl", "wget", "python-requests", "bot", "crawler", "spider"
            };

            var lowerUserAgent = userAgent.ToLowerInvariant();
            return suspiciousPatterns.Any(pattern => lowerUserAgent.Contains(pattern));
        }

        private bool ContainsSqlInjection(string input)
        {
            if (string.IsNullOrEmpty(input))
                return false;

            var sqlPatterns = new[]
            {
                "'", "\"", ";", "--", "/*", "*/", "xp_", "sp_", "exec", "execute",
                "union", "select", "insert", "update", "delete", "drop", "create",
                "alter", "script", "<script", "javascript:", "vbscript:"
            };

            var lowerInput = input.ToLowerInvariant();
            return sqlPatterns.Any(pattern => lowerInput.Contains(pattern));
        }

        private string GetRateLimitIdentifier(HttpContext context)
        {
            // Use IP address as primary identifier
            var clientIp = GetClientIpAddress(context);
            
            // If user is authenticated, use user ID instead
            var userId = context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(userId))
            {
                return $"user_{userId}";
            }

            return $"ip_{clientIp}";
        }

        private string GetActionType(string requestPath)
        {
            if (requestPath.Contains("/login") || requestPath.Contains("/register"))
            {
                return "login";
            }

            return "general";
        }

        private void AddSecurityHeaders(HttpContext context)
        {
            // Prevent clickjacking
            context.Response.Headers.Add("X-Frame-Options", "DENY");
            
            // Prevent MIME type sniffing
            context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
            
            // Enable XSS protection
            context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
            
            // Strict transport security (HTTPS only)
            context.Response.Headers.Add("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            
            // Content Security Policy
            context.Response.Headers.Add("Content-Security-Policy", 
                "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
            
            // Referrer Policy
            context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
            
            // Remove server information
            context.Response.Headers.Remove("Server");
        }
    }
}
