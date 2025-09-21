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
                .ToListAsync();
            var booksWithRatings = new List<Book>();
            
            foreach (var book in books)
            {
                var bookWithRating = book;
                
                // Find the seller user by email
                var seller = await _userService.GetUserByEmailAsync(book.SellerEmail);
                if (seller != null)
                {
                    // Add seller rating information to the book
                    bookWithRating.SellerRating = seller.AverageRating;
                    bookWithRating.SellerRatingCount = seller.RatingCount;
                }
                
                booksWithRatings.Add(bookWithRating);
            }
            
            return booksWithRatings;
        }

        public async Task<Book?> GetBookAsync(int id)
        {
            return await _context.Books.FirstOrDefaultAsync(b => b.Id == id && b.IsActive);
        }

        public async Task<Book> CreateBookAsync(Book book)
        {
            _context.Books.Add(book);
            await _context.SaveChangesAsync();
            return book;
        }

        public async Task<bool> UpdateBookAsync(int id, Book book)
        {
            var existingBook = await _context.Books.FirstOrDefaultAsync(b => b.Id == id && b.IsActive);
            if (existingBook == null)
                return false;

            existingBook.Title = book.Title;
            existingBook.Author = book.Author;
            existingBook.Genre = book.Genre;
            existingBook.Year = book.Year;
            existingBook.Description = book.Description;
            existingBook.Price = book.Price;
            existingBook.Condition = book.Condition;
            existingBook.SellerName = book.SellerName;
            existingBook.SellerEmail = book.SellerEmail;
            existingBook.CourseCode = book.CourseCode;
            existingBook.Professor = book.Professor;
            existingBook.IsAvailable = book.IsAvailable;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteBookAsync(int id)
        {
            var book = await _context.Books.FirstOrDefaultAsync(b => b.Id == id && b.IsActive);
            if (book == null)
                return false;

            // Soft delete - mark as inactive instead of removing
            book.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<Book>> SearchBooksAsync(string searchTerm)
        {
            if (string.IsNullOrEmpty(searchTerm))
                return await GetBooksAsync();

            var filteredBooks = await _context.Books
                .Where(b => b.IsActive && (
                    b.Title.Contains(searchTerm) ||
                    b.Author.Contains(searchTerm) ||
                    b.Genre.Contains(searchTerm) ||
                    b.CourseCode.Contains(searchTerm) ||
                    b.Professor.Contains(searchTerm) ||
                    b.SellerName.Contains(searchTerm)))
                .ToListAsync();

            var booksWithRatings = new List<Book>();
            
            foreach (var book in filteredBooks)
            {
                var bookWithRating = book;
                
                // Find the seller user by email
                var seller = await _userService.GetUserByEmailAsync(book.SellerEmail);
                if (seller != null)
                {
                    // Add seller rating information to the book
                    bookWithRating.SellerRating = seller.AverageRating;
                    bookWithRating.SellerRatingCount = seller.RatingCount;
                }
                
                booksWithRatings.Add(bookWithRating);
            }
            
            return booksWithRatings;
        }

        // Note: Legacy synchronous methods removed to avoid async/sync pattern confusion
        // All methods should use the async versions for consistency

        // Admin method to get all books including inactive ones
        public async Task<List<Book>> GetAllBooksAsync()
        {
            return await _context.Books.ToListAsync();
        }
    }
}