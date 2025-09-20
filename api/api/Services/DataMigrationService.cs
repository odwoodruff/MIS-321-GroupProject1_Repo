using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class DataMigrationService
    {
        private readonly ApplicationDbContext _context;

        public DataMigrationService(ApplicationDbContext context)
        {
            _context = context;
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

                Console.WriteLine("Initial data creation completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during data creation: {ex.Message}");
                throw;
            }
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
                    PasswordHash = "JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=", // admin123
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
                    PasswordHash = "JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=",
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
                    PasswordHash = "JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=",
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
                    SellerName = "alex Student",
                    SellerEmail = "alex.johnson@ua.edu",
                    CourseCode = "MATH 125",
                    Professor = "Dr. Smith",
                    IsAvailable = true,
                    DatePosted = DateTime.Parse("2025-09-10 14:09:37")
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
                    DatePosted = DateTime.Parse("2025-09-13 14:09:37")
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
                    DatePosted = DateTime.Parse("2025-09-08 14:09:37")
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
    }
}