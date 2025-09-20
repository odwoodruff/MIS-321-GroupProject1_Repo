using System.Text.RegularExpressions;

namespace api.Services
{
    public class ValidationService
    {
        // Email validation regex
        private static readonly Regex EmailRegex = new Regex(
            @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase);

        // Username validation regex (alphanumeric and underscore only)
        private static readonly Regex UsernameRegex = new Regex(
            @"^[a-zA-Z0-9_]{3,20}$",
            RegexOptions.Compiled);

        // SQL injection patterns to detect
        private static readonly string[] SqlInjectionPatterns = {
            "'", "\"", ";", "--", "/*", "*/", "xp_", "sp_", "exec", "execute",
            "union", "select", "insert", "update", "delete", "drop", "create",
            "alter", "script", "<script", "javascript:", "vbscript:"
        };

        public static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            return EmailRegex.IsMatch(email) && email.Length <= 100;
        }

        public static bool IsValidUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            return UsernameRegex.IsMatch(username);
        }

        public static bool IsValidPassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return false;

            // Password must be at least 8 characters, contain at least one letter and one number
            return password.Length >= 8 && 
                   password.Length <= 128 &&
                   password.Any(char.IsLetter) && 
                   password.Any(char.IsDigit);
        }

        public static bool IsValidName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return false;

            // Name should only contain letters, spaces, hyphens, and apostrophes
            return name.Length >= 1 && 
                   name.Length <= 50 && 
                   name.All(c => char.IsLetter(c) || char.IsWhiteSpace(c) || c == '-' || c == '\'');
        }

        public static bool IsValidBookTitle(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
                return false;

            return title.Length >= 1 && title.Length <= 200;
        }

        public static bool IsValidBookAuthor(string author)
        {
            if (string.IsNullOrWhiteSpace(author))
                return false;

            return author.Length >= 1 && author.Length <= 100;
        }

        public static bool IsValidPrice(decimal price)
        {
            return price >= 0 && price <= 10000; // Max $10,000
        }

        public static bool IsValidYear(int year)
        {
            return year >= 1900 && year <= DateTime.Now.Year + 5; // Reasonable book years
        }

        public static bool IsValidRating(int score)
        {
            return score >= 1 && score <= 5;
        }

        public static bool IsValidComment(string comment)
        {
            if (string.IsNullOrEmpty(comment))
                return true; // Comments are optional

            return comment.Length <= 500;
        }

        public static bool ContainsSqlInjection(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return false;

            var lowerInput = input.ToLowerInvariant();
            return SqlInjectionPatterns.Any(pattern => lowerInput.Contains(pattern));
        }

        public static string SanitizeInput(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;

            // Remove potentially dangerous characters
            return input.Trim()
                       .Replace("<", "&lt;")
                       .Replace(">", "&gt;")
                       .Replace("\"", "&quot;")
                       .Replace("'", "&#x27;")
                       .Replace("&", "&amp;");
        }

        public static bool IsValidSearchTerm(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return false;

            // Check for SQL injection
            if (ContainsSqlInjection(searchTerm))
                return false;

            // Check length
            return searchTerm.Length >= 1 && searchTerm.Length <= 100;
        }

        public static string SanitizeSearchTerm(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return string.Empty;

            // Remove special characters that could be used for injection
            var sanitized = Regex.Replace(searchTerm, @"[^\w\s-]", "");
            
            // Trim and limit length
            return sanitized.Trim().Substring(0, Math.Min(sanitized.Trim().Length, 100));
        }
    }
}
