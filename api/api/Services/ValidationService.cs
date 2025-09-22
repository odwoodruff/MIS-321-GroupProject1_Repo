using System.Text.RegularExpressions;
using api.Constants;

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

            return EmailRegex.IsMatch(email) && email.Length <= ValidationConstants.MaxEmailLength;
        }

        public static bool IsValidUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return false;

            return UsernameRegex.IsMatch(username);
        }


        public static bool IsValidName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return false;

            // Name should only contain letters, spaces, hyphens, and apostrophes
            return name.Length >= 1 && 
                   name.Length <= ValidationConstants.MaxNameLength && 
                   name.All(c => char.IsLetter(c) || char.IsWhiteSpace(c) || c == '-' || c == '\'');
        }

        public static bool IsValidBookTitle(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
                return false;

            return title.Length >= 1 && title.Length <= ValidationConstants.MaxBookTitleLength;
        }

        public static bool IsValidBookAuthor(string author)
        {
            if (string.IsNullOrWhiteSpace(author))
                return false;

            return author.Length >= 1 && author.Length <= ValidationConstants.MaxBookAuthorLength;
        }

        public static bool IsValidPrice(decimal price)
        {
            return price >= ValidationConstants.MinPrice && price <= ValidationConstants.MaxPrice;
        }

        public static bool IsValidYear(int year)
        {
            return year >= ValidationConstants.MinYear && year <= ValidationConstants.MaxYear;
        }

        public static bool IsValidRating(int score)
        {
            return score >= ValidationConstants.MinRating && score <= ValidationConstants.MaxRating;
        }

        public static bool IsValidComment(string comment)
        {
            if (string.IsNullOrEmpty(comment))
                return true; // Comments are optional

            return comment.Length <= ValidationConstants.MaxCommentLength;
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
            return searchTerm.Length >= 1 && searchTerm.Length <= ValidationConstants.MaxSearchTermLength;
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

        public static bool IsValidId(int id)
        {
            return id > 0 && id <= int.MaxValue;
        }

        public static bool IsValidPageNumber(int pageNumber)
        {
            return pageNumber > 0 && pageNumber <= 1000; // Reasonable page limit
        }

        public static bool IsValidPageSize(int pageSize)
        {
            return pageSize > 0 && pageSize <= 100; // Max 100 items per page
        }

        public static bool IsValidCondition(string condition)
        {
            if (string.IsNullOrWhiteSpace(condition))
                return false;

            var validConditions = new[] { "Excellent", "Very Good", "Good", "Fair", "Poor" };
            return validConditions.Contains(condition, StringComparer.OrdinalIgnoreCase);
        }

        public static bool IsValidGenre(string genre)
        {
            if (string.IsNullOrWhiteSpace(genre))
                return false;

            return genre.Length >= 1 && genre.Length <= 50 && 
                   !ContainsSqlInjection(genre);
        }

        public static bool IsValidCourseCode(string courseCode)
        {
            if (string.IsNullOrWhiteSpace(courseCode))
                return false;

            // Course codes should be like "CS 101", "MATH 201", etc. (letters space numbers)
            var courseCodeRegex = new Regex(@"^[A-Za-z]{2,4}\s+\d{1,4}$", RegexOptions.Compiled);
            return courseCodeRegex.IsMatch(courseCode) && courseCode.Length <= 20;
        }

        public static bool IsValidProfessorName(string professorName)
        {
            if (string.IsNullOrWhiteSpace(professorName))
                return false;

            return professorName.Length >= 2 && professorName.Length <= 100 &&
                   IsValidName(professorName) && !ContainsSqlInjection(professorName);
        }
    }
}
