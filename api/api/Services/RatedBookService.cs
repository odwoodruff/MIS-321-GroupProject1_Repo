using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class RatedBookService
    {
        private readonly ApplicationDbContext _context;
        private readonly LoggingService _loggingService;

        public RatedBookService(ApplicationDbContext context, LoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<List<RatedBook>> GetRatedBooksForUserAsync(int userId)
        {
            try
            {
                return await _context.RatedBooks
                    .Where(rb => rb.UserId == userId && rb.IsActive)
                    .Include(rb => rb.User)
                    .Include(rb => rb.Book)
                    .Include(rb => rb.Rating)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving rated books for user", ex);
                return new List<RatedBook>();
            }
        }

        public async Task<bool> AddRatedBookAsync(int userId, int bookId, int ratingId)
        {
            try
            {
                // Check if already rated
                var existing = await _context.RatedBooks
                    .FirstOrDefaultAsync(rb => rb.UserId == userId && rb.BookId == bookId);

                if (existing == null)
                {
                    var ratedBook = new RatedBook
                    {
                        UserId = userId,
                        BookId = bookId,
                        RatingId = ratingId,
                        DateRated = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.RatedBooks.Add(ratedBook);
                    await _context.SaveChangesAsync();
                }
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding rated book record", ex);
                return false;
            }
        }

        public async Task<bool> RemoveRatedBookAsync(int userId, int bookId)
        {
            try
            {
                var ratedBook = await _context.RatedBooks
                    .FirstOrDefaultAsync(rb => rb.UserId == userId && rb.BookId == bookId);

                if (ratedBook != null)
                {
                    ratedBook.IsActive = false;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error removing rated book record", ex);
                return false;
            }
        }

        public async Task<bool> ClearRatedBooksForUserAsync(int userId)
        {
            try
            {
                var ratedBooks = await _context.RatedBooks
                    .Where(rb => rb.UserId == userId)
                    .ToListAsync();

                foreach (var rb in ratedBooks)
                {
                    rb.IsActive = false;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing rated books for user", ex);
                return false;
            }
        }

        public async Task<bool> HasUserRatedBookAsync(int userId, int bookId)
        {
            try
            {
                return await _context.RatedBooks
                    .AnyAsync(rb => rb.UserId == userId && rb.BookId == bookId && rb.IsActive);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error checking if user has rated book", ex);
                return false;
            }
        }
    }
}
