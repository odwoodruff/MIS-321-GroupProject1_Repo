using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class ContactedSellerService
    {
        private readonly ApplicationDbContext _context;
        private readonly LoggingService _loggingService;

        public ContactedSellerService(ApplicationDbContext context, LoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<List<ContactedSeller>> GetContactedSellersForUserAsync(int userId)
        {
            try
            {
                return await _context.ContactedSellers
                    .Where(cs => cs.BuyerId == userId && cs.IsActive)
                    .Include(cs => cs.Seller)
                    .Include(cs => cs.Book)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving contacted sellers for user", ex);
                return new List<ContactedSeller>();
            }
        }

        public async Task<bool> AddContactedSellerAsync(int buyerId, string sellerEmail, int bookId)
        {
            try
            {
                // Look up seller ID from email
                var seller = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == sellerEmail);
                
                if (seller == null)
                    return false;

                // Check if already contacted
                var existing = await _context.ContactedSellers
                    .FirstOrDefaultAsync(cs => cs.BuyerId == buyerId && cs.SellerId == seller.Id && cs.BookId == bookId);

                if (existing == null)
                {
                    var contactedSeller = new ContactedSeller
                    {
                        BuyerId = buyerId,
                        SellerId = seller.Id,
                        BookId = bookId,
                        DateContacted = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.ContactedSellers.Add(contactedSeller);
                    await _context.SaveChangesAsync();
                }
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding contacted seller", ex);
                return false;
            }
        }

        public async Task<bool> RemoveContactedSellerAsync(int buyerId, int sellerId, int bookId)
        {
            try
            {
                var contactedSeller = await _context.ContactedSellers
                    .FirstOrDefaultAsync(cs => cs.BuyerId == buyerId && cs.SellerId == sellerId && cs.BookId == bookId);

                if (contactedSeller != null)
                {
                    contactedSeller.IsActive = false;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error removing contacted seller", ex);
                return false;
            }
        }

        public async Task<bool> ClearContactedSellersForUserAsync(int userId)
        {
            try
            {
                var contactedSellers = await _context.ContactedSellers
                    .Where(cs => cs.BuyerId == userId)
                    .ToListAsync();

                foreach (var cs in contactedSellers)
                {
                    cs.IsActive = false;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing contacted sellers for user", ex);
                return false;
            }
        }
    }
}
