using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class DataMigrationService
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailVerificationService _emailVerificationService;

        public DataMigrationService(ApplicationDbContext context, EmailVerificationService emailVerificationService)
        {
            _context = context;
            _emailVerificationService = emailVerificationService;
        }

        public async Task MigrateCsvToSqliteAsync()
        {
            try
            {
                // Ensure database is created
                await _context.Database.EnsureCreatedAsync();

                // Check if data already exists
                if (await _context.Users.AnyAsync())
                {
                    Console.WriteLine("Data already exists in SQLite database. Skipping migration.");
                    return;
                }

                Console.WriteLine("Creating initial data in SQLite database...");

                // Create sample admin user
                await CreateSampleUsersAsync();
                Console.WriteLine("Sample users created successfully.");

                // Create sample books
                await CreateSampleBooksAsync();
                Console.WriteLine("Sample books created successfully.");

                // Create sample ratings
                await CreateSampleRatingsAsync();
                Console.WriteLine("Sample ratings created successfully.");

                // Create email verification records for existing users
                await CreateEmailVerificationsForExistingUsersAsync();
                Console.WriteLine("Email verifications created for existing users.");

                // Update existing books to set IsActive = true
                await UpdateExistingBooksIsActiveAsync();
                Console.WriteLine("Updated existing books IsActive status.");

                // Update existing ratings to set IsActive = true
                await UpdateExistingRatingsIsActiveAsync();
                Console.WriteLine("Updated existing ratings IsActive status.");

                Console.WriteLine("Initial data creation completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during data creation: {ex.Message}");
                throw;
            }
        }

        public async Task CreateEmailVerificationsForExistingUsersAsync()
        {
            // Get all existing users
            var users = await _context.Users.ToListAsync();
            
            foreach (var user in users)
            {
                // Create a verification record that's already "used" (verified)
                var verification = new EmailVerification
                {
                    Email = user.Email.ToLowerInvariant(),
                    VerificationCode = "000000", // Dummy code
                    CreatedAt = DateTime.Now.AddDays(-1), // Created yesterday
                    ExpiresAt = DateTime.Now.AddDays(1), // Expires tomorrow
                    IsUsed = true, // Mark as already verified
                    Attempts = 0
                };

                _context.EmailVerifications.Add(verification);
            }

            await _context.SaveChangesAsync();
        }

        private async Task CreateSampleUsersAsync()
        {
            var users = new List<User>
            {
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@crimson.ua.edu",
                    FirstName = "Admin",
                    LastName = "User",
                    DateCreated = DateTime.Now,
                    IsActive = true,
                    AverageRating = 4.2,
                    RatingCount = 47
                },
                new User
                {
                    Id = 2,
                    Username = "alex.johnson",
                    Email = "alex.johnson@ua.edu",
                    FirstName = "Alex",
                    LastName = "Johnson",
                    DateCreated = DateTime.Parse("2025-09-01 10:30:00"),
                    IsActive = true,
                    AverageRating = 4.1,
                    RatingCount = 52
                },
                new User
                {
                    Id = 3,
                    Username = "sarah.williams",
                    Email = "sarah.williams@ua.edu",
                    FirstName = "Sarah",
                    LastName = "Williams",
                    DateCreated = DateTime.Parse("2025-09-02 14:15:00"),
                    IsActive = true,
                    AverageRating = 4.5,
                    RatingCount = 48
                }
            };

            _context.Users.AddRange(users);
            await _context.SaveChangesAsync();
        }

        private async Task CreateSampleBooksAsync()
        {
            var books = new List<Book>
            {
                new Book
                {
                    Id = 1,
                    Title = "Calculus: Early Transcendentals",
                    Author = "James Stewart",
                    Genre = "Textbook",
                    Year = 2021,
                    Description = "Comprehensive calculus textbook with practice problems and solutions. Used for MATH 125.",
                    Price = 85.00m,
                    Condition = "Good",
                    SellerName = "Alex Johnson",
                    SellerEmail = "alex.johnson@ua.edu",
                    CourseCode = "MATH 125",
                    Professor = "Dr. Smith",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-10 14:09:37"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Calculus",
                    SellerRating = 4.1,
                    SellerRatingCount = 52
                },
                new Book
                {
                    Id = 2,
                    Title = "Introduction to Psychology",
                    Author = "David Myers",
                    Genre = "Psychology",
                    Year = 2021,
                    Description = "Psychology textbook in excellent condition. Barely used, no highlighting.",
                    Price = 120.00m,
                    Condition = "Excellent",
                    SellerName = "Sarah Williams",
                    SellerEmail = "sarah.williams@ua.edu",
                    CourseCode = "PSY 101",
                    Professor = "Dr. Williams",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-13 14:09:37"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Psychology",
                    SellerRating = 4.5,
                    SellerRatingCount = 48
                },
                new Book
                {
                    Id = 3,
                    Title = "Principles of Economics",
                    Author = "N. Gregory Mankiw",
                    Genre = "Economics",
                    Year = 2022,
                    Description = "Micro and macroeconomics textbook. Some highlighting but in good condition.",
                    Price = 95.00m,
                    Condition = "Good",
                    SellerName = "Alex Johnson",
                    SellerEmail = "alex.johnson@ua.edu",
                    CourseCode = "EC 110",
                    Professor = "Dr. Brown",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-08 14:09:37"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Economics",
                    SellerRating = 4.1,
                    SellerRatingCount = 52
                },
                new Book
                {
                    Id = 4,
                    Title = "Organic Chemistry",
                    Author = "Paula Yurkanis Bruice",
                    Genre = "Chemistry",
                    Year = 2020,
                    Description = "Comprehensive organic chemistry textbook with detailed mechanisms and practice problems.",
                    Price = 150.00m,
                    Condition = "Very Good",
                    SellerName = "Sarah Williams",
                    SellerEmail = "sarah.williams@ua.edu",
                    CourseCode = "CH 231",
                    Professor = "Dr. Davis",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-12 09:15:00"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Chemistry",
                    SellerRating = 4.5,
                    SellerRatingCount = 48
                },
                new Book
                {
                    Id = 5,
                    Title = "Introduction to Computer Science",
                    Author = "John Zelle",
                    Genre = "Computer Science",
                    Year = 2021,
                    Description = "Python programming textbook with exercises and examples. Perfect for CS 100.",
                    Price = 75.00m,
                    Condition = "Excellent",
                    SellerName = "Alex Johnson",
                    SellerEmail = "alex.johnson@ua.edu",
                    CourseCode = "CS 100",
                    Professor = "Dr. Wilson",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-14 16:30:00"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Computer+Science",
                    SellerRating = 4.1,
                    SellerRatingCount = 52
                },
                new Book
                {
                    Id = 6,
                    Title = "American History: A Survey",
                    Author = "Alan Brinkley",
                    Genre = "History",
                    Year = 2019,
                    Description = "Comprehensive American history textbook covering colonial period to present.",
                    Price = 110.00m,
                    Condition = "Good",
                    SellerName = "Sarah Williams",
                    SellerEmail = "sarah.williams@ua.edu",
                    CourseCode = "HY 101",
                    Professor = "Dr. Thompson",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-11 11:45:00"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=History",
                    SellerRating = 4.5,
                    SellerRatingCount = 48
                },
                new Book
                {
                    Id = 7,
                    Title = "Physics for Scientists and Engineers",
                    Author = "Raymond Serway",
                    Genre = "Physics",
                    Year = 2020,
                    Description = "Physics textbook with calculus-based approach. Includes problem solutions.",
                    Price = 180.00m,
                    Condition = "Very Good",
                    SellerName = "Alex Johnson",
                    SellerEmail = "alex.johnson@ua.edu",
                    CourseCode = "PH 105",
                    Professor = "Dr. Martinez",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-09 13:20:00"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Physics",
                    SellerRating = 4.1,
                    SellerRatingCount = 52
                },
                new Book
                {
                    Id = 8,
                    Title = "Business Communication",
                    Author = "Courtland Bovee",
                    Genre = "Business",
                    Year = 2021,
                    Description = "Professional communication skills for business students. Includes writing and presentation guides.",
                    Price = 90.00m,
                    Condition = "Excellent",
                    SellerName = "Sarah Williams",
                    SellerEmail = "sarah.williams@ua.edu",
                    CourseCode = "MGT 300",
                    Professor = "Dr. Anderson",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-15 14:10:00"),
                    ImageUrl = "https://via.placeholder.com/300x400?text=Business",
                    SellerRating = 4.5,
                    SellerRatingCount = 48
                }
            };

            _context.Books.AddRange(books);
            await _context.SaveChangesAsync();
        }

        private async Task CreateSampleRatingsAsync()
        {
            var ratings = new List<Rating>
            {
                new Rating
                {
                    Id = 1,
                    RaterId = 2,
                    RatedUserId = 3,
                    BookId = 1,
                    Score = 5,
                    Comment = "Great seller! Book was exactly as described and arrived quickly.",
                    DateCreated = DateTime.Parse("2025-09-15 10:30:00"),
                    IsActive = true
                },
                new Rating
                {
                    Id = 2,
                    RaterId = 3,
                    RatedUserId = 2,
                    BookId = 2,
                    Score = 4,
                    Comment = "Good communication and fast shipping. Book had minor wear but overall good condition.",
                    DateCreated = DateTime.Parse("2025-09-16 14:20:00"),
                    IsActive = true
                }
            };

            _context.Ratings.AddRange(ratings);
            await _context.SaveChangesAsync();
        }

        private async Task UpdateExistingBooksIsActiveAsync()
        {
            // Update all existing books to set IsActive = true
            var books = await _context.Books.ToListAsync();
            foreach (var book in books)
            {
                book.IsActive = true;
            }
            await _context.SaveChangesAsync();
        }

        private async Task UpdateExistingRatingsIsActiveAsync()
        {
            // Update all existing ratings to set IsActive = true
            var ratings = await _context.Ratings.ToListAsync();
            foreach (var rating in ratings)
            {
                rating.IsActive = true;
            }
            await _context.SaveChangesAsync();
        }
    }
}