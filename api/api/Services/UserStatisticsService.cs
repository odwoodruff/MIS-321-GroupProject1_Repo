using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Services
{
    public class UserStatisticsService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserStatisticsService> _logger;

        public UserStatisticsService(ApplicationDbContext context, ILogger<UserStatisticsService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<UserStatistics> GetUserStatisticsAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new KeyNotFoundException("User not found");
                }

                _logger.LogInformation("Getting statistics for user {UserId} with email {Email}", userId, user.Email);

                // Get books listed by user
                _logger.LogInformation("Getting books listed for user {UserId}", userId);
                var booksListed = await _context.Books
                    .Where(b => b.SellerEmail == user.Email && b.IsActive)
                    .CountAsync();

                // Get books contacted by user
                _logger.LogInformation("Getting books contacted for user {UserId}", userId);
                var booksContacted = await _context.ContactedSellers
                    .Where(c => c.BuyerId == userId && c.IsActive)
                    .CountAsync();

                // Get ratings given by user
                _logger.LogInformation("Getting ratings given for user {UserId}", userId);
                var ratingsGivenList = await _context.Ratings
                    .Where(r => r.RaterId == userId && r.IsActive)
                    .ToListAsync();
                var ratingsGiven = ratingsGivenList.Count;

                // Calculate average rating given
                var averageRatingGiven = ratingsGivenList.Any() 
                    ? ratingsGivenList.Average(r => r.Score) 
                    : 0.0;

                // Get ratings received by user
                _logger.LogInformation("Getting ratings received for user {UserId}", userId);
                var ratingsReceived = await _context.Ratings
                    .Where(r => r.RatedUserId == userId && r.IsActive)
                    .ToListAsync();

                // Calculate average rating received
                var averageRatingReceived = ratingsReceived.Any() 
                    ? ratingsReceived.Average(r => r.Score) 
                    : 0.0;

                // Get books marked as sold (no longer available)
                _logger.LogInformation("Getting books sold for user {UserId}", userId);
                var booksSoldQuery = _context.Books
                    .Where(b => b.SellerEmail == user.Email && !b.IsAvailable && b.IsActive);
                var booksSold = booksSoldQuery.Count();

                // Get total sales value
                _logger.LogInformation("Getting total sales for user {UserId}", userId);
                var totalSales = booksSoldQuery.Any() ? booksSoldQuery.Sum(b => b.Price) : 0.0m;

                return new UserStatistics
                {
                    UserId = userId,
                    // Book statistics
                    BooksListed = booksListed,
                    BooksSold = booksSold,
                    BooksContacted = booksContacted,
                    TotalSales = totalSales,
                    // Rating statistics
                    RatingsGiven = ratingsGiven,
                    AverageRatingGiven = Math.Round(averageRatingGiven, 1),
                    RatingsReceived = ratingsReceived.Count,
                    AverageRatingReceived = Math.Round(averageRatingReceived, 1),
                    // Account info
                    MemberSince = user.DateCreated,
                    LastActive = DateTime.UtcNow // Could be tracked separately if needed
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics for user {UserId}. Error: {ErrorMessage}", userId, ex.Message);
                _logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
                throw;
            }
        }
    }

    public class UserStatistics
    {
        public int UserId { get; set; }
        
        // Book statistics
        public int BooksListed { get; set; }
        public int BooksSold { get; set; }
        public int BooksContacted { get; set; }
        public decimal TotalSales { get; set; }
        
        // Rating statistics
        public int RatingsGiven { get; set; }
        public double AverageRatingGiven { get; set; }
        public int RatingsReceived { get; set; }
        public double AverageRatingReceived { get; set; }
        
        // Account info
        public DateTime MemberSince { get; set; }
        public DateTime LastActive { get; set; }
    }
}
