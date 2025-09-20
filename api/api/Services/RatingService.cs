using api.Models;
using api.Data;
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
            if (score < 1 || score > 5)
            {
                return null;
            }

            // Check if user already rated this person for this book
            if (await _context.Ratings.AnyAsync(r => r.RaterId == raterId && r.RatedUserId == ratedUserId && r.BookId == bookId && r.IsActive))
            {
                return null; // Already rated
            }

            // Validate users exist
            var rater = await _userService.GetUserAsync(raterId);
            var ratedUser = await _userService.GetUserAsync(ratedUserId);
            
            if (rater == null || ratedUser == null)
            {
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
            await _context.SaveChangesAsync();
            await UpdateUserRatingAsync(ratedUserId);
            
            return rating;
        }

        public async Task<List<Rating>> GetRatingsForUserAsync(int userId)
        {
            return await _context.Ratings
                .Where(r => r.RatedUserId == userId && r.IsActive)
                .ToListAsync();
        }

        public async Task<List<Rating>> GetRatingsByUserAsync(int userId)
        {
            return await _context.Ratings
                .Where(r => r.RaterId == userId && r.IsActive)
                .ToListAsync();
        }

        public async Task<Rating?> GetRatingAsync(int id)
        {
            return await _context.Ratings
                .FirstOrDefaultAsync(r => r.Id == id && r.IsActive);
        }

        public async Task<bool> UpdateRatingAsync(int id, int score, string comment = "")
        {
            var rating = await _context.Ratings.FirstOrDefaultAsync(r => r.Id == id && r.IsActive);
            if (rating == null || score < 1 || score > 5)
            {
                return false;
            }

            rating.Score = score;
            rating.Comment = comment;
            await _context.SaveChangesAsync();
            await UpdateUserRatingAsync(rating.RatedUserId);
            
            return true;
        }

        public async Task<bool> DeleteRatingAsync(int id)
        {
            var rating = await _context.Ratings.FirstOrDefaultAsync(r => r.Id == id && r.IsActive);
            if (rating == null)
            {
                return false;
            }

            rating.IsActive = false;
            await _context.SaveChangesAsync();
            await UpdateUserRatingAsync(rating.RatedUserId);
            
            return true;
        }

        public async Task<double> GetAverageRatingForUserAsync(int userId)
        {
            var userRatings = await _context.Ratings
                .Where(r => r.RatedUserId == userId && r.IsActive)
                .ToListAsync();
                
            if (!userRatings.Any())
            {
                return 0.0;
            }

            return userRatings.Average(r => r.Score);
        }

        public async Task<int> GetRatingCountForUserAsync(int userId)
        {
            return await _context.Ratings
                .CountAsync(r => r.RatedUserId == userId && r.IsActive);
        }

        public async Task<List<Rating>> GetAllRatingsAsync()
        {
            return await _context.Ratings
                .Where(r => r.IsActive)
                .ToListAsync();
        }

        private async Task UpdateUserRatingAsync(int userId)
        {
            var user = await _userService.GetUserAsync(userId);
            if (user != null)
            {
                user.AverageRating = await GetAverageRatingForUserAsync(userId);
                user.RatingCount = await GetRatingCountForUserAsync(userId);
                await _userService.SaveUserAsync(user);
            }
        }

        // Legacy synchronous methods for backward compatibility
        public Rating? CreateRating(int raterId, int ratedUserId, int bookId, int score, string comment = "")
        {
            return CreateRatingAsync(raterId, ratedUserId, bookId, score, comment).Result;
        }

        public List<Rating> GetRatingsForUser(int userId)
        {
            return GetRatingsForUserAsync(userId).Result;
        }

        public List<Rating> GetRatingsByUser(int userId)
        {
            return GetRatingsByUserAsync(userId).Result;
        }

        public Rating? GetRating(int id)
        {
            return GetRatingAsync(id).Result;
        }

        public bool UpdateRating(int id, int score, string comment = "")
        {
            return UpdateRatingAsync(id, score, comment).Result;
        }

        public bool DeleteRating(int id)
        {
            return DeleteRatingAsync(id).Result;
        }

        public double GetAverageRatingForUser(int userId)
        {
            return GetAverageRatingForUserAsync(userId).Result;
        }

        public int GetRatingCountForUser(int userId)
        {
            return GetRatingCountForUserAsync(userId).Result;
        }

        public List<Rating> GetAllRatings()
        {
            return GetAllRatingsAsync().Result;
        }
    }
}