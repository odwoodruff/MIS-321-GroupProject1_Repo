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

        public DevController(ApplicationDbContext context, EmailVerificationService emailVerificationService, LoggingService loggingService)
        {
            _context = context;
            _emailVerificationService = emailVerificationService;
            _loggingService = loggingService;
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
                        IsUsed = true,
                        Attempts = 0
                    };

                    _context.EmailVerifications.Add(verification);
                    await _context.SaveChangesAsync();
                }

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
                            IsUsed = true,
                            Attempts = 0
                        };

                        _context.EmailVerifications.Add(verification);
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
                        IsAvailable = true,
                        DatePosted = DateTime.Now.AddDays(-random.Next(30)), // Random posting date within last 30 days
                        ImageUrl = "",
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
