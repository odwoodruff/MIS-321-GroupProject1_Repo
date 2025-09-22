namespace api.Constants
{
    public static class ValidationConstants
    {
        // Rating validation
        public const int MinRating = 1;
        public const int MaxRating = 5;
        
        // Rate limiting
        public const int MaxLoginAttemptsPerMinute = 5;
        public const int MaxLoginAttemptsPerHour = 20;
        public const int MaxRequestsPerMinute = 60;
        public const int MaxRequestsPerHour = 1000;
        
        // String length limits
        public const int MaxEmailLength = 100;
        public const int MaxUsernameLength = 50;
        public const int MaxNameLength = 50;
        public const int MaxBookTitleLength = 200;
        public const int MaxBookAuthorLength = 100;
        public const int MaxBookDescriptionLength = 1000;
        public const int MaxCommentLength = 500;
        public const int MaxSearchTermLength = 100;
        public const int MaxCourseCodeLength = 20;
        public const int MaxProfessorNameLength = 100;
        public const int MaxConditionLength = 20;
        public const int MaxGenreLength = 50;
        
        // Numeric limits
        public const decimal MinPrice = 0;
        public const decimal MaxPrice = 10000;
        public const int MinYear = 1900;
        public const int MaxYear = 2030;
        public const int MinPageNumber = 1;
        public const int MaxPageNumber = 1000;
        public const int MinPageSize = 1;
        public const int MaxPageSize = 100;
        
        // Verification codes
        public const int VerificationCodeLength = 6;
        public const int VerificationCodeExpiryMinutes = 10;
        public const int MaxVerificationAttempts = 5;
        
        // File upload limits
        public const int MaxImageSizeBytes = 5 * 1024 * 1024; // 5MB
        public const int MaxImageWidth = 2000;
        public const int MaxImageHeight = 2000;
        
        // Cache settings
        public const int CacheExpiryMinutes = 30;
        public const int RateLimitCleanupHours = 2;
        
        // Pagination
        public const int DefaultPageSize = 20;
        public const int MaxPageSizeLimit = 100;
    }
}
