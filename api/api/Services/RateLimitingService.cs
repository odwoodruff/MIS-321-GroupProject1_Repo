using System.Collections.Concurrent;

namespace api.Services
{
    public class RateLimitingService
    {
        private readonly ConcurrentDictionary<string, List<DateTime>> _requestHistory = new();
        private readonly ConcurrentDictionary<string, List<DateTime>> _loginAttempts = new();
        
        // Rate limiting configuration
        private const int MaxRequestsPerMinute = 60;
        private const int MaxLoginAttemptsPerMinute = 5;
        private const int MaxLoginAttemptsPerHour = 20;
        private const int MaxRequestsPerHour = 1000;

        public bool IsRateLimited(string identifier, string actionType = "general")
        {
            var now = DateTime.UtcNow;
            var key = $"{identifier}_{actionType}";

            switch (actionType)
            {
                case "login":
                    return IsLoginRateLimited(identifier, now);
                case "general":
                default:
                    return IsGeneralRateLimited(identifier, now);
            }
        }

        private bool IsLoginRateLimited(string identifier, DateTime now)
        {
            if (!_loginAttempts.TryGetValue(identifier, out var attempts))
            {
                attempts = new List<DateTime>();
                _loginAttempts[identifier] = attempts;
            }

            // Remove old attempts (older than 1 hour)
            attempts.RemoveAll(t => now - t > TimeSpan.FromHours(1));

            // Check hourly limit
            if (attempts.Count >= MaxLoginAttemptsPerHour)
            {
                return true;
            }

            // Check per-minute limit
            var recentAttempts = attempts.Count(t => now - t <= TimeSpan.FromMinutes(1));
            if (recentAttempts >= MaxLoginAttemptsPerMinute)
            {
                return true;
            }

            // Add current attempt
            attempts.Add(now);
            return false;
        }

        private bool IsGeneralRateLimited(string identifier, DateTime now)
        {
            if (!_requestHistory.TryGetValue(identifier, out var requests))
            {
                requests = new List<DateTime>();
                _requestHistory[identifier] = requests;
            }

            // Remove old requests (older than 1 hour)
            requests.RemoveAll(t => now - t > TimeSpan.FromHours(1));

            // Check hourly limit
            if (requests.Count >= MaxRequestsPerHour)
            {
                return true;
            }

            // Check per-minute limit
            var recentRequests = requests.Count(t => now - t <= TimeSpan.FromMinutes(1));
            if (recentRequests >= MaxRequestsPerMinute)
            {
                return true;
            }

            // Add current request
            requests.Add(now);
            return false;
        }

        public int GetRemainingRequests(string identifier, string actionType = "general")
        {
            var now = DateTime.UtcNow;
            var key = $"{identifier}_{actionType}";

            switch (actionType)
            {
                case "login":
                    return GetRemainingLoginAttempts(identifier, now);
                case "general":
                default:
                    return GetRemainingGeneralRequests(identifier, now);
            }
        }

        private int GetRemainingLoginAttempts(string identifier, DateTime now)
        {
            if (!_loginAttempts.TryGetValue(identifier, out var attempts))
            {
                return MaxLoginAttemptsPerHour;
            }

            // Remove old attempts
            attempts.RemoveAll(t => now - t > TimeSpan.FromHours(1));

            return Math.Max(0, MaxLoginAttemptsPerHour - attempts.Count);
        }

        private int GetRemainingGeneralRequests(string identifier, DateTime now)
        {
            if (!_requestHistory.TryGetValue(identifier, out var requests))
            {
                return MaxRequestsPerHour;
            }

            // Remove old requests
            requests.RemoveAll(t => now - t > TimeSpan.FromHours(1));

            return Math.Max(0, MaxRequestsPerHour - requests.Count);
        }

        public void ResetRateLimit(string identifier, string actionType = "general")
        {
            var key = $"{identifier}_{actionType}";
            
            switch (actionType)
            {
                case "login":
                    _loginAttempts.TryRemove(identifier, out _);
                    break;
                case "general":
                default:
                    _requestHistory.TryRemove(identifier, out _);
                    break;
            }
        }

        public void CleanupOldEntries()
        {
            var now = DateTime.UtcNow;
            var cutoff = now - TimeSpan.FromHours(2); // Keep 2 hours of history

            // Cleanup general requests
            var keysToRemove = _requestHistory
                .Where(kvp => kvp.Value.All(t => t < cutoff))
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in keysToRemove)
            {
                _requestHistory.TryRemove(key, out _);
            }

            // Cleanup login attempts
            var loginKeysToRemove = _loginAttempts
                .Where(kvp => kvp.Value.All(t => t < cutoff))
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var key in loginKeysToRemove)
            {
                _loginAttempts.TryRemove(key, out _);
            }
        }
    }
}
