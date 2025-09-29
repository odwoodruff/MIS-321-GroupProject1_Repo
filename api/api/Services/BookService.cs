using api.Models;
using api.Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class BookService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserService _userService;
        private readonly RatingService _ratingService;

        public BookService(ApplicationDbContext context, UserService userService, RatingService ratingService)
        {
            _context = context;
            _userService = userService;
            _ratingService = ratingService;
        }

        public async Task<List<Book>> GetBooksAsync()
        {
            var books = await _context.Books
                .Where(b => b.IsActive)
                .Include(b => b.Seller) // Load seller data in single query
                .ToListAsync().ConfigureAwait(false);
            
            // Update seller rating information from the loaded seller data
            foreach (var book in books)
            {
                if (book.Seller != null)
                {
                    book.SellerRating = book.Seller.AverageRating;
                    book.SellerRatingCount = book.Seller.RatingCount;
                }
            }
            
            return books;
        }

        public async Task<Book?> GetBookAsync(int id)
        {
            return await _context.Books.FirstOrDefaultAsync(b => b.Id == id && b.IsActive).ConfigureAwait(false);
        }


        public async Task<Book> CreateBookAsync(Book book)
        {
            _context.Books.Add(book);
            await _context.SaveChangesAsync().ConfigureAwait(false);
            return book;
        }

        public async Task<bool> UpdateBookAsync(int id, Book book)
        {
            var existingBook = await _context.Books.FirstOrDefaultAsync(b => b.Id == id && b.IsActive).ConfigureAwait(false);
            if (existingBook == null)
                return false;

            Console.WriteLine($"BookService: Updating book {id}. Original price: {existingBook.Price}, New price: {book.Price}");

            // Update only the fields that should be editable
            existingBook.Title = book.Title;
            existingBook.Author = book.Author;
            existingBook.Genre = book.Genre;
            existingBook.Year = book.Year;
            existingBook.Description = book.Description;
            existingBook.Price = book.Price;
            existingBook.Condition = book.Condition;
            existingBook.CourseCode = book.CourseCode;
            existingBook.Professor = book.Professor;
            existingBook.IsAvailable = book.IsAvailable;
            
            // Only update seller info if provided (for admin edits)
            if (!string.IsNullOrEmpty(book.SellerName))
                existingBook.SellerName = book.SellerName;
            if (!string.IsNullOrEmpty(book.SellerEmail))
                existingBook.SellerEmail = book.SellerEmail;

            Console.WriteLine($"BookService: After update, price is: {existingBook.Price}");

            await _context.SaveChangesAsync().ConfigureAwait(false);
            
            Console.WriteLine($"BookService: After SaveChanges, price is: {existingBook.Price}");
            return true;
        }

        public async Task<bool> DeleteBookAsync(int id)
        {
            var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id && b.IsActive).ConfigureAwait(false);
            if (book == null)
                return false;

            // Soft delete - mark as inactive instead of removing
            book.IsActive = false;
            await _context.SaveChangesAsync().ConfigureAwait(false);
            return true;
        }

        public async Task<List<Book>> SearchBooksAsync(string searchTerm)
        {
            if (string.IsNullOrEmpty(searchTerm))
                return await GetAllBooksAsync();

            var searchTermLower = searchTerm.ToLower();
            return await _context.Books
                .Where(b => b.IsActive && 
                    (b.Title.ToLower().Contains(searchTermLower) || 
                     b.Author.ToLower().Contains(searchTermLower) ||
                     b.SellerName.ToLower().Contains(searchTermLower)))
                .Include(b => b.Seller)
                .OrderByDescending(b => b.DatePosted)
                .ToListAsync();
        }

        // Note: Legacy synchronous methods removed to avoid async/sync pattern confusion
        // All methods should use the async versions for consistency

        // Admin method to get all books including inactive ones
        public async Task<List<Book>> GetAllBooksAsync()
        {
            return await _context.Books
                .Where(b => b.IsActive)
                .Include(b => b.Seller)
                .OrderByDescending(b => b.DatePosted)
                .ToListAsync();
        }

        public async Task<List<Book>> SearchBooksByIdAsync(string idPrefix)
        {
            if (string.IsNullOrEmpty(idPrefix) || !int.TryParse(idPrefix, out _))
            {
                return new List<Book>();
            }

            return await _context.Books
                .Where(b => b.Id.ToString().StartsWith(idPrefix) && b.IsActive)
                .Include(b => b.Seller)
                .OrderBy(b => b.Id)
                .ToListAsync();
        }
    }
}