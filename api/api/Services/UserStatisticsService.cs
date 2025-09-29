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
                int booksListed = 0;
                try
                {
                    booksListed = await _context.Books
                        .Where(b => b.SellerEmail == user.Email && b.IsActive)
                        .CountAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting books listed for user {UserId}: {ErrorMessage}", userId, ex.Message);
                    booksListed = 0;
                }

                // Get books contacted by user - with error handling
                _logger.LogInformation("Getting books contacted for user {UserId}", userId);
                int booksContacted = 0;
                try
                {
                    booksContacted = await _context.ContactedSellers
                        .Where(c => c.BuyerId == userId && c.IsActive)
                        .CountAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting books contacted for user {UserId}: {ErrorMessage}", userId, ex.Message);
                    booksContacted = 0; // Default to 0 if there's an error
                }

                // Get ratings given by user
                _logger.LogInformation("Getting ratings given for user {UserId}", userId);
                var ratingsGivenList = new List<Rating>();
                int ratingsGiven = 0;
                double averageRatingGiven = 0.0;
                try
                {
                    ratingsGivenList = await _context.Ratings
                        .Where(r => r.RaterId == userId && r.IsActive)
                        .ToListAsync();
                    ratingsGiven = ratingsGivenList.Count;
                    averageRatingGiven = ratingsGivenList.Any() 
                        ? ratingsGivenList.Average(r => r.Score) 
                        : 0.0;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting ratings given for user {UserId}: {ErrorMessage}", userId, ex.Message);
                    ratingsGiven = 0;
                    averageRatingGiven = 0.0;
                }

                // Get ratings received by user
                _logger.LogInformation("Getting ratings received for user {UserId}", userId);
                var ratingsReceived = new List<Rating>();
                int ratingsReceivedCount = 0;
                double averageRatingReceived = 0.0;
                try
                {
                    ratingsReceived = await _context.Ratings
                        .Where(r => r.RatedUserId == userId && r.IsActive)
                        .ToListAsync();
                    ratingsReceivedCount = ratingsReceived.Count;
                    averageRatingReceived = ratingsReceived.Any() 
                        ? ratingsReceived.Average(r => r.Score) 
                        : 0.0;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting ratings received for user {UserId}: {ErrorMessage}", userId, ex.Message);
                    ratingsReceivedCount = 0;
                    averageRatingReceived = 0.0;
                }

                // Get books marked as sold (no longer available)
                _logger.LogInformation("Getting books sold for user {UserId}", userId);
                int booksSold = 0;
                decimal totalSales = 0.0m;
                try
                {
                    var booksSoldQuery = _context.Books
                        .Where(b => b.SellerEmail == user.Email && !b.IsAvailable && b.IsActive);
                    booksSold = booksSoldQuery.Count();
                    totalSales = booksSoldQuery.Any() ? booksSoldQuery.Sum(b => b.Price) : 0.0m;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error getting books sold for user {UserId}: {ErrorMessage}", userId, ex.Message);
                    booksSold = 0;
                    totalSales = 0.0m;
                }

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
                    RatingsReceived = ratingsReceivedCount,
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
