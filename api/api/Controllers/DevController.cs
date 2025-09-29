using Microsoft.AspNetCore.Mvc;
using api.Services;
using api.Models;
using api.Data;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DevController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailVerificationService _emailVerificationService;
        private readonly LoggingService _loggingService;
        private readonly JwtService _jwtService;

        public DevController(ApplicationDbContext context, EmailVerificationService emailVerificationService, LoggingService loggingService, JwtService jwtService)
        {
            _context = context;
            _emailVerificationService = emailVerificationService;
            _loggingService = loggingService;
            _jwtService = jwtService;
        }

        // Development-only endpoint to verify existing users
        [HttpPost("verify-existing-user")]
        public async Task<IActionResult> VerifyExistingUser([FromBody] VerifyExistingUserRequest request)
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Create or update email verification record
                var existingVerification = await _context.EmailVerifications
                    .FirstOrDefaultAsync(v => v.Email == request.Email.ToLowerInvariant());

                if (existingVerification == null)
                {
                    var verification = new EmailVerification
                    {
                        Email = request.Email.ToLowerInvariant(),
                        VerificationCode = "000000",
                        CreatedAt = DateTime.Now.AddDays(-1),
                        ExpiresAt = DateTime.Now.AddDays(1),
                        IsUsed = false, // Must be false for verification to work
                        Attempts = 0
                    };

                    _context.EmailVerifications.Add(verification);
                }
                else
                {
                    // Update existing verification to make it usable
                    existingVerification.VerificationCode = "000000";
                    existingVerification.CreatedAt = DateTime.Now.AddDays(-1);
                    existingVerification.ExpiresAt = DateTime.Now.AddDays(1);
                    existingVerification.IsUsed = false; // Reset to unused
                    existingVerification.Attempts = 0;
                }

                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevUserVerified", user.Id.ToString(), 
                    $"Development user {request.Email} verified for testing");

                return Ok(new { 
                    message = "User verified for development",
                    user = new {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        dateCreated = user.DateCreated
                    }
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error verifying existing user", ex);
                return StatusCode(500, new { message = "An error occurred while verifying user" });
            }
        }

        // Development-only endpoint to get all existing users
        [HttpGet("existing-users")]
        public async Task<IActionResult> GetExistingUsers()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var users = await _context.Users
                    .Select(u => new {
                        id = u.Id,
                        username = u.Username,
                        email = u.Email,
                        firstName = u.FirstName,
                        lastName = u.LastName,
                        isActive = u.IsActive
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error getting existing users", ex);
                return StatusCode(500, new { message = "An error occurred while getting users" });
            }
        }

        // Development-only endpoint to create verification for all existing users
        [HttpPost("verify-all-existing-users")]
        public async Task<IActionResult> VerifyAllExistingUsers()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var users = await _context.Users.ToListAsync();
                var verifiedCount = 0;

                foreach (var user in users)
                {
                    var existingVerification = await _context.EmailVerifications
                        .FirstOrDefaultAsync(v => v.Email == user.Email.ToLowerInvariant());

                    if (existingVerification == null)
                    {
                        var verification = new EmailVerification
                        {
                            Email = user.Email.ToLowerInvariant(),
                            VerificationCode = "000000",
                            CreatedAt = DateTime.Now.AddDays(-1),
                            ExpiresAt = DateTime.Now.AddDays(1),
                            IsUsed = false, // Must be false for verification to work
                            Attempts = 0
                        };

                        _context.EmailVerifications.Add(verification);
                        verifiedCount++;
                    }
                    else
                    {
                        // Update existing verification to make it usable
                        existingVerification.VerificationCode = "000000";
                        existingVerification.CreatedAt = DateTime.Now.AddDays(-1);
                        existingVerification.ExpiresAt = DateTime.Now.AddDays(1);
                        existingVerification.IsUsed = false; // Reset to unused
                        existingVerification.Attempts = 0;
                        verifiedCount++;
                    }
                }

                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevAllUsersVerified", null, 
                    $"Verified {verifiedCount} existing users for development");

                return Ok(new { 
                    message = $"Verified {verifiedCount} existing users",
                    verifiedCount = verifiedCount
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error verifying all existing users", ex);
                return StatusCode(500, new { message = "An error occurred while verifying users" });
            }
        }

        // Development-only endpoint to check ratings for a user
        [HttpPost("check-user-ratings")]
        public async Task<IActionResult> CheckUserRatings([FromBody] ClearUserRatingsRequest request)
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Get all ratings by this user
                var ratingsByUser = await _context.Ratings
                    .Where(r => r.RaterId == user.Id && r.IsActive)
                    .Select(r => new {
                        id = r.Id,
                        raterId = r.RaterId,
                        ratedUserId = r.RatedUserId,
                        bookId = r.BookId,
                        score = r.Score,
                        comment = r.Comment,
                        dateCreated = r.DateCreated
                    })
                    .ToListAsync();

                // Get all ratings for this user
                var ratingsForUser = await _context.Ratings
                    .Where(r => r.RatedUserId == user.Id && r.IsActive)
                    .Select(r => new {
                        id = r.Id,
                        raterId = r.RaterId,
                        ratedUserId = r.RatedUserId,
                        bookId = r.BookId,
                        score = r.Score,
                        comment = r.Comment,
                        dateCreated = r.DateCreated
                    })
                    .ToListAsync();

                return Ok(new { 
                    message = $"Found {ratingsByUser.Count} ratings by user and {ratingsForUser.Count} ratings for user",
                    ratingsByUser = ratingsByUser,
                    ratingsForUser = ratingsForUser
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error checking user ratings", ex);
                return StatusCode(500, new { message = "An error occurred while checking ratings" });
            }
        }

        // Development-only endpoint to clear specific rating
        [HttpPost("clear-specific-rating")]
        public async Task<IActionResult> ClearSpecificRating([FromBody] ClearSpecificRatingRequest request)
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var rating = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.RaterId == request.RaterId && 
                                            r.RatedUserId == request.RatedUserId && 
                                            r.BookId == request.BookId && 
                                            r.IsActive);

                if (rating == null)
                {
                    return NotFound(new { message = "Rating not found" });
                }

                rating.IsActive = false;
                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevSpecificRatingCleared", request.RaterId.ToString(), 
                    $"Cleared rating: RaterId={request.RaterId}, RatedUserId={request.RatedUserId}, BookId={request.BookId}");

                return Ok(new { 
                    message = "Specific rating cleared successfully",
                    clearedRating = new {
                        id = rating.Id,
                        raterId = rating.RaterId,
                        ratedUserId = rating.RatedUserId,
                        bookId = rating.BookId,
                        score = rating.Score
                    }
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing specific rating", ex);
                return StatusCode(500, new { message = "An error occurred while clearing rating" });
            }
        }

        // Development-only endpoint to create dummy users
        [HttpPost("create-dummy-user")]
        public async Task<IActionResult> CreateDummyUser([FromBody] CreateDummyUserRequest request)
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                // Check if user already exists by email
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (existingUser != null)
                {
                    return Ok(new { message = "Dummy user already exists", userId = existingUser.Id });
                }

                // Create dummy user (let SQLite auto-increment the ID)
                var user = new User
                {
                    Username = request.Username,
                    Email = request.Email,
                    FirstName = request.FirstName,
                    LastName = request.LastName,
                    DateCreated = DateTime.Now,
                    IsActive = true,
                    AverageRating = 0.0,
                    RatingCount = 0
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevDummyUserCreated", user.Id.ToString(), 
                    $"Created dummy user: {request.Username} ({request.Email}) with ID {user.Id}");

                return Ok(new { 
                    message = "Dummy user created successfully",
                    userId = user.Id,
                    username = user.Username
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating dummy user", ex);
                return StatusCode(500, new { message = "An error occurred while creating dummy user" });
            }
        }

        // Development-only endpoint to seed database with dummy data
        [HttpPost("seed-database")]
        public async Task<IActionResult> SeedDatabase()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                // Clear existing data first
                await ClearAllBooks();
                await ClearAllRatings();
                
                // Create 60 dummy users (treat as real users)
                var dummyUsers = new List<User>();
                var firstNames = new[] { "John", "Jane", "Mike", "Sarah", "Alex", "Emily", "David", "Lisa", "Chris", "Amy", 
                                       "Ryan", "Jessica", "Matt", "Ashley", "Kevin", "Jennifer", "Brian", "Amanda", "Josh", "Stephanie",
                                       "Daniel", "Nicole", "Andrew", "Rachel", "Justin", "Lauren", "Brandon", "Megan", "Tyler", "Samantha",
                                       "Jacob", "Brittany", "Zachary", "Kayla", "Nathan", "Courtney", "Adam", "Rebecca", "Sean", "Danielle",
                                       "Eric", "Michelle", "Jordan", "Kimberly", "Aaron", "Heather", "Caleb", "Elizabeth", "Luke", "Katherine",
                                       "Noah", "Victoria", "Ethan", "Christina", "Logan", "Amber", "Connor", "Melissa", "Owen", "Stephanie" };
                
                var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                                      "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                                      "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
                                      "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
                                      "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts" };

                for (int i = 0; i < 60; i++)
                {
                    var firstName = firstNames[i % firstNames.Length];
                    var lastName = lastNames[i % lastNames.Length];
                    var username = $"{firstName.ToLower()}_{lastName.ToLower()}_{i + 1}";
                    var email = $"{firstName.ToLower()}.{lastName.ToLower()}{i + 1}@crimson.ua.edu";
                    
                    dummyUsers.Add(new User
                    {
                        Username = username,
                        Email = email,
                        FirstName = firstName,
                        LastName = lastName,
                        DateCreated = DateTime.Now.AddDays(-(60 - i)), // Staggered creation dates
                        IsActive = true,
                        AverageRating = 0.0,
                        RatingCount = 0
                    });
                }

                _context.Users.AddRange(dummyUsers);
                await _context.SaveChangesAsync();

                // Create ~12 books with real Alabama course codes
                var alabamaCourses = new[]
                {
                    new { Title = "Introduction to Psychology", Author = "David G. Myers", CourseCode = "PSY 101", Professor = "Dr. Smith", Price = 89.99m, Condition = "Excellent" },
                    new { Title = "Calculus: Early Transcendentals", Author = "James Stewart", CourseCode = "MATH 125", Professor = "Dr. Johnson", Price = 125.50m, Condition = "Good" },
                    new { Title = "Principles of Economics", Author = "N. Gregory Mankiw", CourseCode = "EC 110", Professor = "Dr. Brown", Price = 95.00m, Condition = "Very Good" },
                    new { Title = "Organic Chemistry", Author = "Paula Yurkanis Bruice", CourseCode = "CH 231", Professor = "Dr. Davis", Price = 150.75m, Condition = "Fair" },
                    new { Title = "Introduction to Computer Science", Author = "John Zelle", CourseCode = "CS 100", Professor = "Dr. Wilson", Price = 75.25m, Condition = "Excellent" },
                    new { Title = "General Biology", Author = "Campbell & Reece", CourseCode = "BSC 114", Professor = "Dr. Miller", Price = 120.00m, Condition = "Good" },
                    new { Title = "American History", Author = "Eric Foner", CourseCode = "HY 101", Professor = "Dr. Anderson", Price = 85.50m, Condition = "Very Good" },
                    new { Title = "Introduction to Sociology", Author = "Anthony Giddens", CourseCode = "SOC 101", Professor = "Dr. Taylor", Price = 78.25m, Condition = "Good" },
                    new { Title = "Financial Accounting", Author = "Jerry Weygandt", CourseCode = "AC 210", Professor = "Dr. White", Price = 135.00m, Condition = "Excellent" },
                    new { Title = "Public Speaking", Author = "Stephen Lucas", CourseCode = "COM 123", Professor = "Dr. Garcia", Price = 65.75m, Condition = "Good" },
                    new { Title = "World Literature", Author = "Norton Anthology", CourseCode = "EN 205", Professor = "Dr. Martinez", Price = 95.00m, Condition = "Very Good" },
                    new { Title = "Introduction to Philosophy", Author = "Bertrand Russell", CourseCode = "PHL 100", Professor = "Dr. Thompson", Price = 72.50m, Condition = "Good" }
                };

                var dummyBooks = new List<Book>();
                var random = new Random();
                
                for (int i = 0; i < alabamaCourses.Length; i++)
                {
                    var course = alabamaCourses[i];
                    var seller = dummyUsers[random.Next(dummyUsers.Count)];
                    
                    dummyBooks.Add(new Book
                    {
                        Title = course.Title,
                        Author = course.Author,
                        Genre = GetGenreFromCourseCode(course.CourseCode),
                        Year = 2020 + random.Next(4), // Random year between 2020-2023
                        Description = $"Required textbook for {course.CourseCode} - {course.Professor}. {GetDescriptionForCourse(course.CourseCode)}",
                        Price = course.Price + (decimal)(random.NextDouble() * 20 - 10), // Add some price variation
                        Condition = course.Condition,
                        SellerName = $"{seller.FirstName} {seller.LastName}",
                        SellerEmail = seller.Email,
                        CourseCode = course.CourseCode,
                        Professor = course.Professor,
                        IsAvailable = random.NextDouble() > 0.25, // 25% chance of being sold
                        DatePosted = DateTime.Now.AddDays(-random.Next(30)), // Random posting date within last 30 days
                        SellerRating = 0.0,
                        SellerRatingCount = 0
                    });
                }

                _context.Books.AddRange(dummyBooks);
                await _context.SaveChangesAsync();

                // Create realistic sample ratings between users
                var sampleRatings = new List<Rating>();
                var comments = new[]
                {
                    "Great seller, book was in excellent condition!",
                    "Fast response and easy transaction.",
                    "Book was okay, some highlighting as described.",
                    "Perfect condition, would buy again!",
                    "Good communication, book as described.",
                    "Quick delivery, satisfied with purchase.",
                    "Book had some wear but overall good condition.",
                    "Seller was very helpful and responsive.",
                    "Exactly as described, great price!",
                    "Book arrived quickly and in good condition."
                };

                // Create 20-30 random ratings between different users
                for (int i = 0; i < 25; i++)
                {
                    var rater = dummyUsers[random.Next(dummyUsers.Count)];
                    var ratedUser = dummyUsers[random.Next(dummyUsers.Count)];
                    var book = dummyBooks[random.Next(dummyBooks.Count)];
                    
                    // Ensure user doesn't rate themselves and hasn't already rated this person for this book
                    if (rater.Id != ratedUser.Id && 
                        !sampleRatings.Any(r => r.RaterId == rater.Id && r.RatedUserId == ratedUser.Id && r.BookId == book.Id))
                    {
                        sampleRatings.Add(new Rating
                        {
                            RaterId = rater.Id,
                            RatedUserId = ratedUser.Id,
                            BookId = book.Id,
                            Score = random.Next(1, 6), // Random score 1-5
                            Comment = comments[random.Next(comments.Length)],
                            DateCreated = DateTime.Now.AddDays(-random.Next(30)), // Random date within last 30 days
                            IsActive = true
                        });
                    }
                }

                _context.Ratings.AddRange(sampleRatings);
                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevDatabaseSeeded", null, 
                    $"Seeded database with {dummyUsers.Count} users, {dummyBooks.Count} books, and {sampleRatings.Count} ratings");

                return Ok(new { 
                    message = "Database seeded successfully",
                    usersCreated = dummyUsers.Count,
                    booksCreated = dummyBooks.Count,
                    ratingsCreated = sampleRatings.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error seeding database", ex);
                return StatusCode(500, new { message = "An error occurred while seeding database" });
            }
        }

        // Development-only endpoint to redistribute books from Alex and Sarah
        [HttpPost("redistribute-books")]
        public async Task<IActionResult> RedistributeBooks()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                // Get all books
                var allBooks = await _context.Books.ToListAsync();
                
                // Get all users except Alex and Sarah
                var otherUsers = await _context.Users
                    .Where(u => u.Email != "alex.johnson@ua.edu" && u.Email != "sarah.williams@ua.edu")
                    .ToListAsync();

                if (otherUsers.Count == 0)
                {
                    return BadRequest("No other users found to redistribute books to");
                }

                var random = new Random();
                var redistributedCount = 0;

                // Find books by Alex and Sarah
                var alexBooks = allBooks.Where(b => b.SellerEmail == "alex.johnson@ua.edu").ToList();
                var sarahBooks = allBooks.Where(b => b.SellerEmail == "sarah.williams@ua.edu").ToList();

                // Keep only 1 book for Alex, redistribute the rest
                if (alexBooks.Count > 1)
                {
                    var booksToRedistribute = alexBooks.Skip(1).ToList();
                    foreach (var book in booksToRedistribute)
                    {
                        var newSeller = otherUsers[random.Next(otherUsers.Count)];
                        book.SellerName = $"{newSeller.FirstName} {newSeller.LastName}";
                        book.SellerEmail = newSeller.Email;
                        book.SellerRating = 0.0;
                        book.SellerRatingCount = 0;
                        redistributedCount++;
                    }
                }

                // Keep only 1 book for Sarah, redistribute the rest
                if (sarahBooks.Count > 1)
                {
                    var booksToRedistribute = sarahBooks.Skip(1).ToList();
                    foreach (var book in booksToRedistribute)
                    {
                        var newSeller = otherUsers[random.Next(otherUsers.Count)];
                        book.SellerName = $"{newSeller.FirstName} {newSeller.LastName}";
                        book.SellerEmail = newSeller.Email;
                        book.SellerRating = 0.0;
                        book.SellerRatingCount = 0;
                        redistributedCount++;
                    }
                }

                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevBooksRedistributed", null, 
                    $"Redistributed {redistributedCount} books from Alex and Sarah to other users");

                return Ok(new { 
                    message = $"Redistributed {redistributedCount} books from Alex and Sarah to other users",
                    redistributedCount = redistributedCount,
                    alexBooksRemaining = alexBooks.Take(1).Count(),
                    sarahBooksRemaining = sarahBooks.Take(1).Count()
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error redistributing books", ex);
                return StatusCode(500, new { message = "An error occurred while redistributing books" });
            }
        }

        // Development-only endpoint to clear all books
        [HttpPost("clear-all-books")]
        public async Task<IActionResult> ClearAllBooks()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var allBooks = await _context.Books.ToListAsync();
                _context.Books.RemoveRange(allBooks);
                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevAllBooksCleared", null, 
                    $"Cleared {allBooks.Count} books from database");

                return Ok(new { 
                    message = $"Cleared {allBooks.Count} books from database",
                    clearedCount = allBooks.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing all books", ex);
                return StatusCode(500, new { message = "An error occurred while clearing books" });
            }
        }

        // Development-only endpoint to clear all ratings
        [HttpPost("clear-all-ratings")]
        public async Task<IActionResult> ClearAllRatings()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var allRatings = await _context.Ratings
                    .Where(r => r.IsActive)
                    .ToListAsync();

                foreach (var rating in allRatings)
                {
                    rating.IsActive = false;
                }

                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevAllRatingsCleared", null, 
                    $"Cleared {allRatings.Count} ratings from database");

                return Ok(new { 
                    message = $"Cleared {allRatings.Count} ratings from database",
                    clearedCount = allRatings.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing all ratings", ex);
                return StatusCode(500, new { message = "An error occurred while clearing ratings" });
            }
        }

        // Development-only endpoint to identify orphaned records
        [HttpGet("check-orphaned-records")]
        public async Task<IActionResult> CheckOrphanedRecords()
        {
            try
            {
                // Find books with seller emails that don't match any user
                var allUsers = await _context.Users.ToListAsync();
                var allBooks = await _context.Books.ToListAsync();
                var allRatings = await _context.Ratings.ToListAsync();

                var userEmails = allUsers.Select(u => u.Email.ToLower()).ToHashSet();
                var userIds = allUsers.Select(u => u.Id).ToHashSet();

                var orphanedBooks = allBooks.Where(b => !userEmails.Contains(b.SellerEmail.ToLower())).ToList();
                var orphanedRatings = allRatings.Where(r => !userIds.Contains(r.RaterId) || !userIds.Contains(r.RatedUserId)).ToList();

                return Ok(new
                {
                    message = "Orphaned records check completed",
                    totalUsers = allUsers.Count,
                    totalBooks = allBooks.Count,
                    totalRatings = allRatings.Count,
                    orphanedBooks = orphanedBooks.Select(b => new { 
                        id = b.Id, 
                        title = b.Title, 
                        sellerEmail = b.SellerEmail,
                        sellerName = b.SellerName 
                    }),
                    orphanedRatings = orphanedRatings.Select(r => new { 
                        id = r.Id, 
                        raterId = r.RaterId, 
                        ratedUserId = r.RatedUserId, 
                        bookId = r.BookId 
                    }),
                    orphanedBooksCount = orphanedBooks.Count,
                    orphanedRatingsCount = orphanedRatings.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error checking orphaned records", ex);
                return StatusCode(500, new { message = "An error occurred while checking orphaned records" });
            }
        }

        // Development-only endpoint to check and clear ratings for a user
        [HttpPost("clear-user-ratings")]
        public async Task<IActionResult> ClearUserRatings([FromBody] ClearUserRatingsRequest request)
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Get all ratings by this user
                var ratingsByUser = await _context.Ratings
                    .Where(r => r.RaterId == user.Id)
                    .ToListAsync();

                // Get all ratings for this user
                var ratingsForUser = await _context.Ratings
                    .Where(r => r.RatedUserId == user.Id)
                    .ToListAsync();

                // Clear all ratings by this user
                foreach (var rating in ratingsByUser)
                {
                    rating.IsActive = false;
                }

                // Clear all ratings for this user
                foreach (var rating in ratingsForUser)
                {
                    rating.IsActive = false;
                }

                await _context.SaveChangesAsync();

                _loggingService.LogUserAction("DevRatingsCleared", user.Id.ToString(), 
                    $"Cleared {ratingsByUser.Count} ratings by user and {ratingsForUser.Count} ratings for user {request.Email}");

                return Ok(new { 
                    message = $"Cleared {ratingsByUser.Count} ratings by user and {ratingsForUser.Count} ratings for user",
                    ratingsByUser = ratingsByUser.Count,
                    ratingsForUser = ratingsForUser.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing user ratings", ex);
                return StatusCode(500, new { message = "An error occurred while clearing ratings" });
            }
        }


        // Helper method to get genre from course code
        private string GetGenreFromCourseCode(string courseCode)
        {
            return courseCode switch
            {
                var code when code.StartsWith("PSY") => "Psychology",
                var code when code.StartsWith("MATH") => "Mathematics",
                var code when code.StartsWith("EC") => "Economics",
                var code when code.StartsWith("CH") => "Chemistry",
                var code when code.StartsWith("CS") => "Computer Science",
                var code when code.StartsWith("BSC") => "Biology",
                var code when code.StartsWith("HY") => "History",
                var code when code.StartsWith("SOC") => "Sociology",
                var code when code.StartsWith("AC") => "Accounting",
                var code when code.StartsWith("COM") => "Communication",
                var code when code.StartsWith("EN") => "English",
                var code when code.StartsWith("PHL") => "Philosophy",
                _ => "General"
            };
        }

        // Helper method to get description for course
        private string GetDescriptionForCourse(string courseCode)
        {
            return courseCode switch
            {
                "PSY 101" => "Comprehensive introduction to psychology with latest research and real-world applications.",
                "MATH 125" => "Complete calculus textbook with practice problems and solutions.",
                "EC 110" => "Introduction to micro and macroeconomics principles.",
                "CH 231" => "Comprehensive organic chemistry textbook with detailed explanations.",
                "CS 100" => "Python programming and computer science fundamentals.",
                "BSC 114" => "General biology covering cell biology, genetics, and evolution.",
                "HY 101" => "Survey of American history from colonial times to present.",
                "SOC 101" => "Introduction to sociological concepts and theories.",
                "AC 210" => "Financial accounting principles and practices.",
                "COM 123" => "Public speaking and communication skills development.",
                "EN 205" => "Survey of world literature from ancient to modern times.",
                "PHL 100" => "Introduction to philosophical thinking and major philosophers.",
                _ => "Required textbook for this course."
            };
        }

        [HttpGet("test-migration-ratings")]
        public async Task<IActionResult> TestMigrationRatings()
        {
            try
            {
                // Test 1: Total ratings count
                var totalRatings = await _context.Ratings.CountAsync();
                
                // Test 2: Active ratings count
                var activeRatings = await _context.Ratings.CountAsync(r => r.IsActive);
                
                // Test 3: Inactive ratings count
                var inactiveRatings = await _context.Ratings.CountAsync(r => !r.IsActive);
                
                // Test 4: Show sample ratings
                var sampleRatings = await _context.Ratings
                    .OrderBy(r => r.Id)
                    .Take(10)
                    .Select(r => new { 
                        r.Id, 
                        r.RaterId, 
                        r.RatedUserId, 
                        r.BookId, 
                        r.Score, 
                        r.IsActive, 
                        r.DateCreated 
                    })
                    .ToListAsync();

                // Test 5: Check if all ratings are active
                var allRatingsActive = totalRatings == activeRatings;
                var migrationSuccessful = allRatingsActive && inactiveRatings == 0;

                return Ok(new
                {
                    message = "Migration test results",
                    totalRatings,
                    activeRatings,
                    inactiveRatings,
                    allRatingsActive,
                    migrationSuccessful,
                    sampleRatings = sampleRatings.Select(r => new
                    {
                        r.Id,
                        r.RaterId,
                        r.RatedUserId,
                        r.BookId,
                        r.Score,
                        r.IsActive,
                        DateCreated = r.DateCreated.ToString("yyyy-MM-dd HH:mm:ss")
                    }).ToList()
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("TestMigrationRatings", ex);
                return StatusCode(500, new { error = "Failed to test migration", details = ex.Message });
            }
        }

        [HttpPost("dev-login-alex")]
        public async Task<IActionResult> DevLoginAlex()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var alexUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "alex.johnson@ua.edu");
                
                if (alexUser == null)
                {
                    return NotFound(new { message = "Alex Johnson user not found. Run Force Remigrate first." });
                }

                // Generate JWT token directly
                var jwtService = HttpContext.RequestServices.GetRequiredService<JwtService>();
                var token = jwtService.GenerateToken(alexUser);

                _loggingService.LogUserAction("DevLoginAlex", alexUser.Id.ToString(), 
                    "Development login as Alex Johnson");

                return Ok(new { 
                    message = "Development login successful",
                    token = token,
                    user = new {
                        id = alexUser.Id,
                        username = alexUser.Username,
                        email = alexUser.Email,
                        firstName = alexUser.FirstName,
                        lastName = alexUser.LastName,
                        dateCreated = alexUser.DateCreated
                    }
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error during dev login as Alex", ex);
                return StatusCode(500, new { message = "An error occurred during dev login", details = ex.Message });
            }
        }

        [HttpPost("force-remigrate")]
        public async Task<IActionResult> ForceRemigrate()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var migrationService = HttpContext.RequestServices.GetRequiredService<DataMigrationService>();
                await migrationService.ForceRemigrateWithNewDataAsync();

                _loggingService.LogUserAction("DevForceRemigrate", null, 
                    "Force re-migration completed with new data structure");

                return Ok(new { 
                    message = "Force re-migration completed successfully!",
                    details = "Created 55+ users with random ratings across all books"
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error during force re-migration", ex);
                return StatusCode(500, new { message = "An error occurred during force re-migration", details = ex.Message });
            }
        }

        [HttpPost("force-alex-data")]
        public async Task<IActionResult> ForceAlexData()
        {
            // Only allow in development
            if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
            {
                return NotFound();
            }

            try
            {
                var migrationService = HttpContext.RequestServices.GetRequiredService<DataMigrationService>();
                await migrationService.EnsureAlexJohnsonDataAsync();
                await migrationService.CreateAlexNotificationsAsync();

                _loggingService.LogUserAction("DevForceAlexData", null, 
                    "Force recreated Alex Johnson demo data");

                return Ok(new { 
                    message = "Alex Johnson demo data force recreated successfully!",
                    details = "Books, notifications, and ratings recreated for demo purposes"
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error during force Alex data recreation", ex);
                return StatusCode(500, new { message = "An error occurred during Alex data recreation", details = ex.Message });
            }
        }

        [HttpGet("contacted-sellers")]
        public async Task<IActionResult> GetContactedSellers()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                var contactedSellers = await _context.ContactedSellers
                    .Where(cs => cs.BuyerId == userId && cs.IsActive)
                    .Include(cs => cs.Seller)
                    .Include(cs => cs.Buyer)
                    .Select(cs => new { 
                        sellerEmail = cs.Seller.Email,
                        bookId = cs.BookId,
                        contactKey = $"{cs.Buyer.Email}-{cs.Seller.Email}-{cs.BookId}"
                    })
                    .ToListAsync();

                return Ok(contactedSellers.Select(cs => cs.contactKey).ToList());
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving contacted sellers", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving contacted sellers", details = ex.Message });
            }
        }

        [HttpPost("contacted-sellers")]
        public async Task<IActionResult> AddContactedSeller([FromBody] AddContactedSellerRequest request)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                // Look up seller ID from email
                var seller = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.SellerEmail);
                
                if (seller == null)
                    return BadRequest("Seller not found");

                // Check if already contacted for this book
                var existing = await _context.ContactedSellers
                    .FirstOrDefaultAsync(cs => cs.BuyerId == userId && cs.SellerId == seller.Id && cs.BookId == request.BookId);

                if (existing == null)
                {
                    var contactedSeller = new ContactedSeller
                    {
                        BuyerId = userId,
                        SellerId = seller.Id,
                        BookId = request.BookId,
                        DateContacted = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.ContactedSellers.Add(contactedSeller);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Seller added to contacted list" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding contacted seller", ex);
                return StatusCode(500, new { message = "An error occurred while adding contacted seller", details = ex.Message });
            }
        }

        [HttpDelete("contacted-sellers")]
        public async Task<IActionResult> ClearContactedSellers()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                var contactedSellers = await _context.ContactedSellers
                    .Where(cs => cs.BuyerId == userId)
                    .ToListAsync();

                _context.ContactedSellers.RemoveRange(contactedSellers);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Contacted sellers cleared" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing contacted sellers", ex);
                return StatusCode(500, new { message = "An error occurred while clearing contacted sellers", details = ex.Message });
            }
        }

        [HttpGet("rated-books")]
        public async Task<IActionResult> GetRatedBooks()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                var ratedBooks = await _context.Ratings
                    .Where(r => r.RaterId == userId && r.IsActive)
                    .Include(r => r.Rater)
                    .Include(r => r.RatedUser)
                    .Select(r => new { 
                        raterEmail = r.Rater.Email,
                        sellerEmail = r.RatedUser.Email,
                        bookId = r.BookId,
                        ratingKey = $"{r.Rater.Email}-{r.RatedUser.Email}-{r.BookId}"
                    })
                    .ToListAsync();

                return Ok(ratedBooks.Select(rb => rb.ratingKey).ToList());
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving rated books", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving rated books", details = ex.Message });
            }
        }

        [HttpPost("rated-books")]
        public async Task<IActionResult> AddRatedBook([FromBody] AddRatedBookRequest request)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                // Check if already rated
                var existing = await _context.Ratings
                    .FirstOrDefaultAsync(r => r.RaterId == userId && r.BookId == request.BookId);

                if (existing == null)
                {
                    // This would typically be handled by the rating creation endpoint
                    return BadRequest("Use the rating creation endpoint to add rated books");
                }

                return Ok(new { message = "Book already rated" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding rated book", ex);
                return StatusCode(500, new { message = "An error occurred while adding rated book", details = ex.Message });
            }
        }

        [HttpGet("prompted-to-rate")]
        public async Task<IActionResult> GetPromptedToRate()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                var promptedToRate = await _context.PromptedToRates
                    .Where(ptr => ptr.UserId == userId && ptr.IsActive)
                    .Include(ptr => ptr.User)
                    .Include(ptr => ptr.Seller)
                    .Select(ptr => new { 
                        userEmail = ptr.User.Email,
                        sellerEmail = ptr.Seller.Email,
                        bookId = ptr.BookId,
                        promptKey = $"{ptr.User.Email}-{ptr.Seller.Email}-{ptr.BookId}"
                    })
                    .ToListAsync();

                return Ok(promptedToRate.Select(ptr => ptr.promptKey).ToList());
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving prompted to rate", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving prompted to rate", details = ex.Message });
            }
        }

        [HttpPost("prompted-to-rate")]
        public async Task<IActionResult> AddPromptedToRate([FromBody] AddPromptedToRateRequest request)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid token");

                // Look up seller ID from email
                var seller = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.SellerEmail);
                
                if (seller == null)
                    return BadRequest("Seller not found");

                // Check if already prompted for this book
                var existing = await _context.PromptedToRates
                    .FirstOrDefaultAsync(ptr => ptr.UserId == userId && ptr.SellerId == seller.Id && ptr.BookId == request.BookId);

                if (existing == null)
                {
                    var promptedToRate = new PromptedToRate
                    {
                        UserId = userId,
                        SellerId = seller.Id,
                        BookId = request.BookId,
                        DatePrompted = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.PromptedToRates.Add(promptedToRate);
                    await _context.SaveChangesAsync();
                }

                return Ok(new { message = "Prompted to rate added" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding prompted to rate", ex);
                return StatusCode(500, new { message = "An error occurred while adding prompted to rate", details = ex.Message });
            }
        }

        [HttpPost("test-alex-data")]
        public async Task<IActionResult> TestAlexData()
        {
            try
            {
                var alexUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "alex.johnson@ua.edu");
                if (alexUser == null)
                {
                    return NotFound(new { message = "Alex Johnson user not found" });
                }

                var alexBooks = await _context.Books.Where(b => b.SellerEmail == "alex.johnson@ua.edu").ToListAsync();
                var alexNotifications = await _context.Notifications.Where(n => n.UserId == alexUser.Id).ToListAsync();
                var ratingsForAlex = await _context.Ratings.Where(r => r.RatedUserId == alexUser.Id).ToListAsync();
                var ratingsByAlex = await _context.Ratings.Where(r => r.RaterId == alexUser.Id).ToListAsync();

                return Ok(new
                {
                    alexUser = new { id = alexUser.Id, email = alexUser.Email, firstName = alexUser.FirstName, lastName = alexUser.LastName },
                    booksCount = alexBooks.Count,
                    books = alexBooks.Select(b => new { id = b.Id, title = b.Title, price = b.Price }).ToList(),
                    notificationsCount = alexNotifications.Count,
                    notifications = alexNotifications.Select(n => new { id = n.Id, message = n.Message, isRead = n.IsRead, dateCreated = n.DateCreated }).ToList(),
                    ratingsForAlexCount = ratingsForAlex.Count,
                    ratingsByAlexCount = ratingsByAlex.Count,
                    ratingsForAlex = ratingsForAlex.Select(r => new { id = r.Id, score = r.Score, comment = r.Comment, raterId = r.RaterId }).ToList(),
                    ratingsByAlex = ratingsByAlex.Select(r => new { id = r.Id, score = r.Score, comment = r.Comment, ratedUserId = r.RatedUserId }).ToList()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error testing Alex data", error = ex.Message });
            }
        }

        [HttpPost("create-support-tickets-table")]
        public async Task<IActionResult> CreateSupportTicketsTable()
        {
            try
            {
                // Only allow in development
                if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
                {
                    return NotFound();
                }

                // Create the SupportTickets table using raw SQL
                var createTableSql = @"
                    CREATE TABLE IF NOT EXISTS SupportTickets (
                        Id INTEGER PRIMARY KEY AUTOINCREMENT,
                        UserId INTEGER NOT NULL,
                        Subject TEXT NOT NULL,
                        Description TEXT NOT NULL,
                        Status TEXT NOT NULL DEFAULT 'Open',
                        Priority TEXT NOT NULL DEFAULT 'Medium',
                        DateCreated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        DateUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (UserId) REFERENCES Users(Id)
                    );";

                await _context.Database.ExecuteSqlRawAsync(createTableSql);

                _loggingService.LogUserAction("SupportTickets table created successfully");
                return Ok(new { message = "SupportTickets table created successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating SupportTickets table", ex);
                return StatusCode(500, new { message = "Error creating SupportTickets table", details = ex.Message });
            }
        }

        [HttpPost("create-sample-support-tickets")]
        public async Task<IActionResult> CreateSampleSupportTickets()
        {
            try
            {
                // Only allow in development
                if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
                {
                    return NotFound();
                }

                // Get real users from the database
                var users = await _context.Users.Where(u => u.IsActive).Take(10).ToListAsync();
                if (users.Count == 0)
                {
                    return BadRequest(new { message = "No active users found in database. Create some users first." });
                }

                _loggingService.LogUserAction("SampleSupportTicketsStart", null, 
                    $"Found {users.Count} active users for sample ticket creation");

                var supportTicketService = HttpContext.RequestServices.GetRequiredService<SupportTicketService>();
                var sampleTickets = new List<object>();

                // Sample ticket subjects and messages
                var ticketData = new[]
                {
                    new { Subject = "Account Issues", Message = "I'm having trouble logging into my account. It keeps saying my password is incorrect even though I'm sure it's right." },
                    new { Subject = "Book Listing Problems", Message = "I tried to list a book but it's not showing up in the search results. Can you help me figure out what went wrong?" },
                    new { Subject = "Payment Issues", Message = "I'm trying to contact a seller about a book but I can't find their contact information. How do I get in touch with them?" },
                    new { Subject = "Technical Problems", Message = "The website is running very slowly for me. Is there a known issue or is it just on my end?" },
                    new { Subject = "Report User", Message = "I had a bad experience with a seller. They were unresponsive and rude when I tried to ask questions about a book." },
                    new { Subject = "Report Book", Message = "I found a book listing that seems to be a duplicate or has incorrect information. The price seems too good to be true." },
                    new { Subject = "General Question", Message = "How do I change my profile information? I can't find the settings page." },
                    new { Subject = "Feature Request", Message = "It would be great if we could filter books by condition or price range. Any plans to add this feature?" },
                    new { Subject = "Bug Report", Message = "When I try to upload a book image, it sometimes fails and I have to try multiple times. This is frustrating." },
                    new { Subject = "Other", Message = "I have a question about the book trading policies. Can someone explain the rules about returns and refunds?" }
                };

                var statuses = new[] { "Open", "In Progress", "Resolved", "Closed" };
                var random = new Random();

                // Create 15-20 sample tickets
                var ticketCount = random.Next(15, 21);
                _loggingService.LogUserAction("SampleTicketCount", null, 
                    $"Creating {ticketCount} sample tickets");
                
                for (int i = 0; i < ticketCount; i++)
                {
                    try
                    {
                        _loggingService.LogUserAction("TicketLoop", (i + 1).ToString(), 
                            $"Creating ticket {i + 1} of {ticketCount}");
                            
                        var user = users[random.Next(users.Count)];
                        var ticketInfo = ticketData[random.Next(ticketData.Length)];
                        var status = statuses[random.Next(statuses.Length)];
                        
                        // Create the ticket
                        _loggingService.LogUserAction("CreatingTicket", user.Id.ToString(), 
                            $"Creating ticket for user {user.Email} with subject: {ticketInfo.Subject}");
                        
                        var ticket = await supportTicketService.CreateSupportTicketAsync(
                            user.Id, 
                            ticketInfo.Subject, 
                            ticketInfo.Message
                        );
                        
                        _loggingService.LogUserAction("TicketCreated", ticket.Id.ToString(), 
                            $"Successfully created ticket {ticket.Id} for user {user.Email}");

                        // Randomly update some tickets to different statuses
                        if (status != "Open")
                        {
                            var adminResponse = status switch
                            {
                                "In Progress" => "Thank you for contacting us. We're looking into this issue and will get back to you soon.",
                                "Resolved" => "This issue has been resolved. Please let us know if you need any further assistance.",
                                "Closed" => "This ticket has been closed. If you have additional questions, please create a new ticket.",
                                _ => null
                            };

                            await supportTicketService.UpdateSupportTicketAsync(ticket.Id, status, adminResponse);
                        }

                        sampleTickets.Add(new
                        {
                            id = ticket.Id,
                            subject = ticket.Subject,
                            user = new { id = user.Id, name = $"{user.FirstName} {user.LastName}", email = user.Email },
                            status = status,
                            dateCreated = ticket.DateCreated
                        });
                        
                        _loggingService.LogUserAction("TicketAddedToList", ticket.Id.ToString(), 
                            $"Added ticket {ticket.Id} to sample tickets list. Total so far: {sampleTickets.Count}");
                    }
                    catch (Exception ex)
                    {
                        _loggingService.LogError($"Error creating ticket {i + 1} of {ticketCount}", ex);
                        // Continue with the next ticket instead of stopping the entire process
                    }
                }

                _loggingService.LogUserAction("SampleSupportTicketsCreated", null, 
                    $"Created {sampleTickets.Count} sample support tickets from real users (requested {ticketCount})");

                return Ok(new { 
                    message = $"Successfully created {sampleTickets.Count} sample support tickets (requested {ticketCount})", 
                    tickets = sampleTickets,
                    requested = ticketCount,
                    created = sampleTickets.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating sample support tickets", ex);
                return StatusCode(500, new { message = "Error creating sample support tickets", details = ex.Message });
            }
        }

        [HttpPost("add-test-support-tickets")]
        public async Task<IActionResult> AddTestSupportTickets()
        {
            try
            {
                // Only allow in development
                if (!HttpContext.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment())
                {
                    return NotFound();
                }

                var supportTicketService = HttpContext.RequestServices.GetRequiredService<SupportTicketService>();
                var testTickets = new List<object>();

                // Get a real user from the database
                var user = await _context.Users.Where(u => u.IsActive).FirstOrDefaultAsync();
                if (user == null)
                {
                    return BadRequest(new { message = "No active users found in database" });
                }

                // Create 5 test tickets
                var testData = new[]
                {
                    new { Subject = "Login Issues", Message = "I can't log into my account. It keeps saying invalid credentials." },
                    new { Subject = "Book Not Showing", Message = "I listed a book but it's not appearing in the search results." },
                    new { Subject = "Payment Problem", Message = "I'm having trouble contacting sellers about books I want to buy." },
                    new { Subject = "Website Slow", Message = "The website is running very slowly for me today." },
                    new { Subject = "Account Settings", Message = "How do I change my profile picture and update my information?" }
                };

                for (int i = 0; i < testData.Length; i++)
                {
                    var ticketData = testData[i];
                    var status = i < 2 ? "Open" : (i < 4 ? "In Progress" : "Resolved");
                    
                    var ticket = await supportTicketService.CreateSupportTicketAsync(
                        user.Id, 
                        ticketData.Subject, 
                        ticketData.Message
                    );

                    // Update status if not Open
                    if (status != "Open")
                    {
                        var adminResponse = status == "In Progress" 
                            ? "We're looking into this issue and will get back to you soon."
                            : "This issue has been resolved. Please let us know if you need any further assistance.";
                            
                        await supportTicketService.UpdateSupportTicketAsync(ticket.Id, status, adminResponse);
                    }

                    testTickets.Add(new
                    {
                        id = ticket.Id,
                        subject = ticket.Subject,
                        user = new { id = user.Id, name = $"{user.FirstName} {user.LastName}", email = user.Email },
                        status = status,
                        dateCreated = ticket.DateCreated
                    });
                }

                _loggingService.LogUserAction("TestSupportTicketsCreated", null, 
                    $"Created {testTickets.Count} test support tickets for user {user.Email}");

                return Ok(new { 
                    message = $"Successfully created {testTickets.Count} test support tickets", 
                    tickets = testTickets 
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating test support tickets", ex);
                return StatusCode(500, new { message = "Error creating test support tickets", details = ex.Message });
            }
        }
    }

    public class VerifyExistingUserRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ClearUserRatingsRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ClearSpecificRatingRequest
    {
        public int RaterId { get; set; }
        public int RatedUserId { get; set; }
        public int BookId { get; set; }
    }

    public class CreateDummyUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    }

