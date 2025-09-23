using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class PromptedToRateService
    {
        private readonly ApplicationDbContext _context;
        private readonly LoggingService _loggingService;

        public PromptedToRateService(ApplicationDbContext context, LoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<List<PromptedToRate>> GetPromptedToRateForUserAsync(int userId)
        {
            try
            {
                return await _context.PromptedToRates
                    .Where(ptr => ptr.UserId == userId && ptr.IsActive)
                    .Include(ptr => ptr.User)
                    .Include(ptr => ptr.Seller)
                    .Include(ptr => ptr.Book)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving prompted to rate records for user", ex);
                return new List<PromptedToRate>();
            }
        }

        public async Task<bool> AddPromptedToRateAsync(int userId, string sellerEmail, int bookId)
        {
            try
            {
                // Look up seller ID from email
                var seller = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == sellerEmail);
                
                if (seller == null)
                    return false;

                // Check if already prompted
                var existing = await _context.PromptedToRates
                    .FirstOrDefaultAsync(ptr => ptr.UserId == userId && ptr.SellerId == seller.Id && ptr.BookId == bookId);

                if (existing == null)
                {
                    var promptedToRate = new PromptedToRate
                    {
                        UserId = userId,
                        SellerId = seller.Id,
                        BookId = bookId,
                        DatePrompted = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.PromptedToRates.Add(promptedToRate);
                    await _context.SaveChangesAsync();
                }
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding prompted to rate record", ex);
                return false;
            }
        }

        public async Task<bool> RemovePromptedToRateAsync(int userId, int sellerId, int bookId)
        {
            try
            {
                var promptedToRate = await _context.PromptedToRates
                    .FirstOrDefaultAsync(ptr => ptr.UserId == userId && ptr.SellerId == sellerId && ptr.BookId == bookId);

                if (promptedToRate != null)
                {
                    promptedToRate.IsActive = false;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error removing prompted to rate record", ex);
                return false;
            }
        }

        public async Task<bool> ClearPromptedToRateForUserAsync(int userId)
        {
            try
            {
                var promptedToRates = await _context.PromptedToRates
                    .Where(ptr => ptr.UserId == userId)
                    .ToListAsync();

                foreach (var ptr in promptedToRates)
                {
                    ptr.IsActive = false;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing prompted to rate records for user", ex);
                return false;
            }
        }
    }
}
