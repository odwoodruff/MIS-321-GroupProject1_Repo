using api.Models;
using api.Data;
using api.Constants;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class RatingService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserService _userService;

        public RatingService(ApplicationDbContext context, UserService userService)
        {
            _context = context;
            _userService = userService;
        }

        public async Task<Rating?> CreateRatingAsync(int raterId, int ratedUserId, int bookId, int score, string comment = "")
        {
            // Validate score
            if (score < ValidationConstants.MinRating || score > ValidationConstants.MaxRating)
            {
                Console.WriteLine($"Rating validation failed: Invalid score {score}");
                return null;
            }

            // Check if user already rated this person for this book
            if (await _context.Ratings.AnyAsync(r => r.RaterId == raterId && r.RatedUserId == ratedUserId && r.BookId == bookId && r.IsActive).ConfigureAwait(false))
            {
                Console.WriteLine($"Rating validation failed: User {raterId} already rated user {ratedUserId} for book {bookId}");
                return null; // Already rated
            }

            // Validate users exist
            var rater = await _userService.GetUserAsync(raterId).ConfigureAwait(false);
            var ratedUser = await _userService.GetUserAsync(ratedUserId).ConfigureAwait(false);
            
            if (rater == null)
            {
                Console.WriteLine($"Rating validation failed: Rater {raterId} does not exist");
                return null;
            }
            
            if (ratedUser == null)
            {
                Console.WriteLine($"Rating validation failed: Rated user {ratedUserId} does not exist");
                return null;
            }

            // Validate book exists
            var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == bookId).ConfigureAwait(false);
            if (book == null)
            {
                Console.WriteLine($"Rating validation failed: Book {bookId} does not exist");
                return null;
            }

            var rating = new Rating
            {
                RaterId = raterId,
                RatedUserId = ratedUserId,
                BookId = bookId,
                Score = score,
                Comment = comment,
                DateCreated = DateTime.Now,
                IsActive = true
            };

            _context.Ratings.Add(rating);
            await _context.SaveChangesAsync().ConfigureAwait(false);
            await UpdateUserRatingAsync(ratedUserId).ConfigureAwait(false);
            
            return rating;
        }

        public async Task<List<Rating>> GetRatingsForUserAsync(int userId)
        {
            return await _context.Ratings
                .Where(r => r.RatedUserId == userId && r.IsActive)
                .ToListAsync().ConfigureAwait(false);
        }

        public async Task<List<Rating>> GetRatingsByUserAsync(int userId)
        {
            return await _context.Ratings
                .Where(r => r.RaterId == userId && r.IsActive)
                .Include(r => r.RatedUser)
                .Include(r => r.Book)
                .ToListAsync().ConfigureAwait(false);
        }

        public async Task<Rating?> GetRatingAsync(int id)
        {
            return await _context.Ratings
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive).ConfigureAwait(false);
        }

        public async Task<bool> UpdateRatingAsync(int id, int score, string comment = "")
        {
            var rating = await _context.Ratings.FirstOrDefaultAsync(r => r.Id == id && r.IsActive).ConfigureAwait(false);
            if (rating == null || score < ValidationConstants.MinRating || score > ValidationConstants.MaxRating)
            {
                return false;
            }

            rating.Score = score;
            rating.Comment = comment;
            await _context.SaveChangesAsync().ConfigureAwait(false);
            await UpdateUserRatingAsync(rating.RatedUserId).ConfigureAwait(false);
            
            return true;
        }

        public async Task<bool> DeleteRatingAsync(int id)
        {
            var rating = await _context.Ratings.FirstOrDefaultAsync(r => r.Id == id && r.IsActive).ConfigureAwait(false);
            if (rating == null)
            {
                return false;
            }

            rating.IsActive = false;
            await _context.SaveChangesAsync().ConfigureAwait(false);
            await UpdateUserRatingAsync(rating.RatedUserId).ConfigureAwait(false);
            
            return true;
        }

        public async Task<double> GetAverageRatingForUserAsync(int userId)
        {
            var userRatings = await _context.Ratings
                .Where(r => r.RatedUserId == userId && r.IsActive)
                .ToListAsync().ConfigureAwait(false);
                
            Console.WriteLine($"User {userId} has {userRatings.Count} active ratings: {string.Join(", ", userRatings.Select(r => $"{r.Score}"))}");
                
            if (!userRatings.Any())
            {
                return 0.0;
            }

            return userRatings.Average(r => r.Score);
        }

        public async Task<int> GetRatingCountForUserAsync(int userId)
        {
            return await _context.Ratings
                .CountAsync(r => r.RatedUserId == userId && r.IsActive).ConfigureAwait(false);
        }

        public async Task<List<Rating>> GetAllRatingsAsync()
        {
            return await _context.Ratings
                .Where(r => r.IsActive)
                .ToListAsync().ConfigureAwait(false);
        }

        private async Task UpdateUserRatingAsync(int userId)
        {
            var user = await _userService.GetUserAsync(userId).ConfigureAwait(false);
            if (user != null)
            {
                var averageRating = await GetAverageRatingForUserAsync(userId).ConfigureAwait(false);
                var ratingCount = await GetRatingCountForUserAsync(userId).ConfigureAwait(false);
                
                Console.WriteLine($"Updating user {userId} ratings: Average={averageRating}, Count={ratingCount}");
                
                user.AverageRating = averageRating;
                user.RatingCount = ratingCount;
                await _userService.SaveUserAsync(user).ConfigureAwait(false);
                
                // Also update all books where this user is the seller
                var userBooks = await _context.Books
                    .Where(b => b.SellerEmail == user.Email)
                    .ToListAsync().ConfigureAwait(false);
                
                foreach (var book in userBooks)
                {
                    book.SellerRating = averageRating;
                    book.SellerRatingCount = ratingCount;
                }
                
                if (userBooks.Any())
                {
                    await _context.SaveChangesAsync().ConfigureAwait(false);
                    Console.WriteLine($"Updated {userBooks.Count} books for seller {user.Email} with rating {averageRating} (count: {ratingCount})");
                }
            }
        }

        // Legacy synchronous methods removed for safety - use async versions instead
        // These methods were causing deadlock issues with .Result calls
    }
}