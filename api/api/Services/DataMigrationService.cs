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
            // Check if users already exist to avoid unique constraint violations
            var existingUsers = await _context.Users.ToListAsync();
            var existingUsernames = existingUsers.Select(u => u.Username).ToHashSet();
            var existingEmails = existingUsers.Select(u => u.Email).ToHashSet();

            var usersToCreate = new List<User>();
            var random = new Random();

            // First names and last names for generating random users
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

            // Create admin user first
            if (!existingUsernames.Contains("admin") && !existingEmails.Contains("admin@crimson.ua.edu"))
            {
                usersToCreate.Add(new User
                {
                    Username = "admin",
                    Email = "admin@crimson.ua.edu",
                    FirstName = "Admin",
                    LastName = "User",
                    DateCreated = DateTime.Now,
                    IsActive = true,
                    AverageRating = 4.2,
                    RatingCount = 47
                });
            }

            // Create 55 random users (including the book sellers)
            var bookSellerEmails = new[] { "alex.johnson@ua.edu", "sarah.williams@ua.edu" };
            var createdEmails = new HashSet<string>(bookSellerEmails);

            for (int i = 0; i < 55; i++)
            {
                var firstName = firstNames[random.Next(firstNames.Length)];
                var lastName = lastNames[random.Next(lastNames.Length)];
                var username = $"{firstName.ToLower()}.{lastName.ToLower()}{i + 1}";
                var email = $"{firstName.ToLower()}.{lastName.ToLower()}{i + 1}@crimson.ua.edu";
                
                // Ensure unique email
                while (createdEmails.Contains(email) || existingEmails.Contains(email))
                {
                    var randomSuffix = random.Next(1000, 9999);
                    email = $"{firstName.ToLower()}.{lastName.ToLower()}{randomSuffix}@crimson.ua.edu";
                }
                createdEmails.Add(email);

                // Skip if user already exists
                if (existingUsernames.Contains(username) || existingEmails.Contains(email))
                    continue;

                usersToCreate.Add(new User
                {
                    Username = username,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    DateCreated = DateTime.Now.AddDays(-random.Next(60)), // Random date within last 60 days
                    IsActive = true,
                    AverageRating = Math.Round(random.NextDouble() * 2 + 3, 1), // Random rating between 3.0-5.0
                    RatingCount = random.Next(0, 50) // Random rating count 0-49
                });
            }

            // Ensure book sellers are included
            if (!existingUsernames.Contains("alex.johnson") && !existingEmails.Contains("alex.johnson@ua.edu"))
            {
                usersToCreate.Add(new User
                {
                    Username = "alex.johnson",
                    Email = "alex.johnson@ua.edu",
                    FirstName = "Alex",
                    LastName = "Johnson",
                    DateCreated = DateTime.Parse("2025-09-01 10:30:00"),
                    IsActive = true,
                    AverageRating = 4.1,
                    RatingCount = 52
                });
            }

            if (!existingUsernames.Contains("sarah.williams") && !existingEmails.Contains("sarah.williams@ua.edu"))
            {
                usersToCreate.Add(new User
                {
                    Username = "sarah.williams",
                    Email = "sarah.williams@ua.edu",
                    FirstName = "Sarah",
                    LastName = "Williams",
                    DateCreated = DateTime.Parse("2025-09-02 14:15:00"),
                    IsActive = true,
                    AverageRating = 4.5,
                    RatingCount = 48
                });
            }

            if (usersToCreate.Any())
            {
                _context.Users.AddRange(usersToCreate);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Created {usersToCreate.Count} new users");
            }
            else
            {
                Console.WriteLine("All sample users already exist, skipping user creation");
            }
        }

        private async Task CreateSampleBooksAsync()
        {
            // Check if books already exist to avoid unique constraint violations
            var existingBooks = await _context.Books.ToListAsync();
            var existingBookTitles = existingBooks.Select(b => b.Title).ToHashSet();

            var booksToCreate = new List<Book>();

            // Define sample books data
            var sampleBooks = new[]
            {
                new { Title = "Calculus: Early Transcendentals", Author = "James Stewart", Genre = "Textbook", Year = 2021, Description = "Comprehensive calculus textbook with practice problems and solutions. Used for MATH 125.", Price = 85.00m, Condition = "Good", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "MATH 125", Professor = "Dr. Smith", DatePosted = "2025-09-10 14:09:37", ImageUrl = "https://via.placeholder.com/300x400?text=Calculus", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Introduction to Psychology", Author = "David Myers", Genre = "Psychology", Year = 2021, Description = "Psychology textbook in excellent condition. Barely used, no highlighting.", Price = 120.00m, Condition = "Excellent", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "PSY 101", Professor = "Dr. Williams", DatePosted = "2025-09-13 14:09:37", ImageUrl = "https://via.placeholder.com/300x400?text=Psychology", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Principles of Economics", Author = "N. Gregory Mankiw", Genre = "Economics", Year = 2022, Description = "Micro and macroeconomics textbook. Some highlighting but in good condition.", Price = 95.00m, Condition = "Good", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "EC 110", Professor = "Dr. Brown", DatePosted = "2025-09-08 14:09:37", ImageUrl = "https://via.placeholder.com/300x400?text=Economics", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Organic Chemistry", Author = "Paula Yurkanis Bruice", Genre = "Chemistry", Year = 2020, Description = "Comprehensive organic chemistry textbook with detailed mechanisms and practice problems.", Price = 150.00m, Condition = "Very Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "CH 231", Professor = "Dr. Davis", DatePosted = "2025-09-12 09:15:00", ImageUrl = "https://via.placeholder.com/300x400?text=Chemistry", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Introduction to Computer Science", Author = "John Zelle", Genre = "Computer Science", Year = 2021, Description = "Python programming textbook with exercises and examples. Perfect for CS 100.", Price = 75.00m, Condition = "Excellent", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "CS 100", Professor = "Dr. Wilson", DatePosted = "2025-09-14 16:30:00", ImageUrl = "https://via.placeholder.com/300x400?text=Computer+Science", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "American History: A Survey", Author = "Alan Brinkley", Genre = "History", Year = 2019, Description = "Comprehensive American history textbook covering colonial period to present.", Price = 110.00m, Condition = "Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "HY 101", Professor = "Dr. Thompson", DatePosted = "2025-09-11 11:45:00", ImageUrl = "https://via.placeholder.com/300x400?text=History", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Physics for Scientists and Engineers", Author = "Raymond Serway", Genre = "Physics", Year = 2020, Description = "Physics textbook with calculus-based approach. Includes problem solutions.", Price = 180.00m, Condition = "Very Good", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "PH 105", Professor = "Dr. Martinez", DatePosted = "2025-09-09 13:20:00", ImageUrl = "https://via.placeholder.com/300x400?text=Physics", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Business Communication", Author = "Courtland Bovee", Genre = "Business", Year = 2021, Description = "Professional communication skills for business students. Includes writing and presentation guides.", Price = 90.00m, Condition = "Excellent", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "MGT 300", Professor = "Dr. Anderson", DatePosted = "2025-09-15 14:10:00", ImageUrl = "https://via.placeholder.com/300x400?text=Business", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Linear Algebra and Its Applications", Author = "David Lay", Genre = "Mathematics", Year = 2022, Description = "Linear algebra textbook with clear explanations and practice problems. Used for MATH 237.", Price = 125.00m, Condition = "Good", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "MATH 237", Professor = "Dr. Garcia", DatePosted = "2025-09-16 10:15:00", ImageUrl = "https://via.placeholder.com/300x400?text=Linear+Algebra", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Abnormal Psychology", Author = "Ronald Comer", Genre = "Psychology", Year = 2021, Description = "Comprehensive abnormal psychology textbook. Some highlighting but in good condition.", Price = 135.00m, Condition = "Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "PSY 240", Professor = "Dr. Rodriguez", DatePosted = "2025-09-17 14:30:00", ImageUrl = "https://via.placeholder.com/300x400?text=Abnormal+Psychology", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Financial Accounting", Author = "Jerry Weygandt", Genre = "Accounting", Year = 2023, Description = "Financial accounting textbook with practice exercises. Like new condition.", Price = 160.00m, Condition = "Excellent", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "AC 210", Professor = "Dr. Lee", DatePosted = "2025-09-18 09:45:00", ImageUrl = "https://via.placeholder.com/300x400?text=Accounting", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "General Biology", Author = "Sylvia Mader", Genre = "Biology", Year = 2022, Description = "Biology textbook with detailed illustrations. Some wear but still very usable.", Price = 140.00m, Condition = "Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "BSC 114", Professor = "Dr. Kim", DatePosted = "2025-09-19 16:20:00", ImageUrl = "https://via.placeholder.com/300x400?text=Biology", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Data Structures and Algorithms", Author = "Mark Weiss", Genre = "Computer Science", Year = 2021, Description = "Advanced computer science textbook. Perfect for CS 201. Minimal highlighting.", Price = 95.00m, Condition = "Very Good", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "CS 201", Professor = "Dr. Patel", DatePosted = "2025-09-20 11:10:00", ImageUrl = "https://via.placeholder.com/300x400?text=Data+Structures", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "World Literature", Author = "Damrosch & Pike", Genre = "Literature", Year = 2020, Description = "Comprehensive world literature anthology. Some highlighting but in good condition.", Price = 85.00m, Condition = "Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "EN 205", Professor = "Dr. Taylor", DatePosted = "2025-09-21 13:25:00", ImageUrl = "https://via.placeholder.com/300x400?text=Literature", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Marketing Management", Author = "Philip Kotler", Genre = "Marketing", Year = 2022, Description = "Marketing textbook with case studies. Excellent condition, no marks.", Price = 120.00m, Condition = "Excellent", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "MKT 300", Professor = "Dr. Johnson", DatePosted = "2025-09-22 15:40:00", ImageUrl = "https://via.placeholder.com/300x400?text=Marketing", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Environmental Science", Author = "G. Tyler Miller", Genre = "Environmental", Year = 2021, Description = "Environmental science textbook with current data and case studies.", Price = 105.00m, Condition = "Very Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "GEO 105", Professor = "Dr. Green", DatePosted = "2025-09-23 08:50:00", ImageUrl = "https://via.placeholder.com/300x400?text=Environmental", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Statistics for Business", Author = "David Anderson", Genre = "Statistics", Year = 2023, Description = "Business statistics textbook with Excel integration. Like new condition.", Price = 130.00m, Condition = "Excellent", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "ST 260", Professor = "Dr. White", DatePosted = "2025-09-24 12:35:00", ImageUrl = "https://via.placeholder.com/300x400?text=Statistics", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Art History", Author = "Marilyn Stokstad", Genre = "Art", Year = 2020, Description = "Comprehensive art history textbook with color plates. Some wear but good condition.", Price = 115.00m, Condition = "Good", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "ARH 101", Professor = "Dr. Brown", DatePosted = "2025-09-25 14:15:00", ImageUrl = "https://via.placeholder.com/300x400?text=Art+History", SellerRating = 4.5, SellerRatingCount = 48 },
                new { Title = "Philosophy: The Quest for Truth", Author = "Louis Pojman", Genre = "Philosophy", Year = 2021, Description = "Philosophy textbook with primary source readings. Minimal highlighting.", Price = 75.00m, Condition = "Very Good", SellerName = "Alex Johnson", SellerEmail = "alex.johnson@ua.edu", CourseCode = "PHL 100", Professor = "Dr. Moore", DatePosted = "2025-09-26 10:30:00", ImageUrl = "https://via.placeholder.com/300x400?text=Philosophy", SellerRating = 4.1, SellerRatingCount = 52 },
                new { Title = "Spanish Language and Culture", Author = "José Díaz", Genre = "Language", Year = 2022, Description = "Spanish textbook with audio CDs. Excellent condition, barely used.", Price = 100.00m, Condition = "Excellent", SellerName = "Sarah Williams", SellerEmail = "sarah.williams@ua.edu", CourseCode = "SP 101", Professor = "Dr. Martinez", DatePosted = "2025-09-27 16:45:00", ImageUrl = "https://via.placeholder.com/300x400?text=Spanish", SellerRating = 4.5, SellerRatingCount = 48 }
            };

            // Only create books that don't already exist
            foreach (var bookData in sampleBooks)
            {
                if (!existingBookTitles.Contains(bookData.Title))
                {
                    booksToCreate.Add(new Book
                    {
                        Title = bookData.Title,
                        Author = bookData.Author,
                        Genre = bookData.Genre,
                        Year = bookData.Year,
                        Description = bookData.Description,
                        Price = bookData.Price,
                        Condition = bookData.Condition,
                        SellerName = bookData.SellerName,
                        SellerEmail = bookData.SellerEmail,
                        CourseCode = bookData.CourseCode,
                        Professor = bookData.Professor,
                        IsAvailable = true,
                        DatePosted = DateTime.Parse(bookData.DatePosted),
                        ImageUrl = bookData.ImageUrl,
                        SellerRating = bookData.SellerRating,
                        SellerRatingCount = bookData.SellerRatingCount
                    });
                }
            }

            if (booksToCreate.Any())
            {
                _context.Books.AddRange(booksToCreate);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Created {booksToCreate.Count} new books");
            }
            else
            {
                Console.WriteLine("All sample books already exist, skipping book creation");
            }
        }

        private async Task CreateSampleRatingsAsync()
        {
            // Check if ratings already exist to avoid duplicates
            var existingRatings = await _context.Ratings.ToListAsync();
            var ratingsToCreate = new List<Rating>();
            var random = new Random();

            // Get users and books for creating ratings
            var users = await _context.Users.ToListAsync();
            var books = await _context.Books.ToListAsync();

            if (users.Count < 2 || books.Count == 0)
            {
                Console.WriteLine("Not enough users or books to create ratings");
                return;
            }

            // Sample comments for realistic ratings
            var comments = new[]
            {
                "Great seller! Book was exactly as described and arrived quickly.",
                "Good communication and fast shipping. Book had minor wear but overall good condition.",
                "Excellent transaction! Book was in perfect condition as advertised.",
                "Fast response and easy transaction. Would buy from again.",
                "Book was okay, some highlighting as described but still usable.",
                "Perfect condition, would buy again!",
                "Good communication, book as described.",
                "Quick delivery, satisfied with purchase.",
                "Book had some wear but overall good condition.",
                "Seller was very helpful and responsive.",
                "Exactly as described, great price!",
                "Book arrived quickly and in good condition.",
                "Minor issues but seller was understanding and helpful.",
                "Good value for the price, would recommend.",
                "Book was better than expected, very happy with purchase.",
                "Smooth transaction, no issues at all.",
                "Book had some notes but that was clearly stated.",
                "Great packaging, book arrived safely.",
                "Seller was professional and easy to work with.",
                "Book was exactly what I needed for my class."
            };

            // Create random ratings between users and books
            // Each user has a 30% chance of rating each book (some might rate none, some might rate all)
            var ratingProbability = 0.3;
            var maxRatingsPerUser = Math.Min(books.Count, 10); // Limit to 10 ratings per user max

            foreach (var rater in users)
            {
                var ratingsThisUser = 0;
                var booksToRate = books.OrderBy(x => random.Next()).Take(random.Next(0, maxRatingsPerUser + 1)).ToList();

                foreach (var book in booksToRate)
                {
                    // Skip if user is rating themselves
                    if (rater.Email == book.SellerEmail)
                        continue;

                    // 30% chance to create a rating
                    if (random.NextDouble() > ratingProbability)
                        continue;

                    // Find the seller user
                    var sellerUser = users.FirstOrDefault(u => u.Email == book.SellerEmail);
                    if (sellerUser == null)
                        continue;

                    // Check if this rating already exists
                    var existingRating = existingRatings.Any(r => 
                        r.RaterId == rater.Id && 
                        r.RatedUserId == sellerUser.Id && 
                        r.BookId == book.Id);

                    if (existingRating)
                        continue;

                    // Create the rating
                    var score = random.Next(1, 6); // Random score 1-5
                    var comment = comments[random.Next(comments.Length)];
                    var daysAgo = random.Next(1, 60); // Random date within last 60 days

                    ratingsToCreate.Add(new Rating
                    {
                        RaterId = rater.Id,
                        RatedUserId = sellerUser.Id,
                        BookId = book.Id,
                        Score = score,
                        Comment = comment,
                        DateCreated = DateTime.Now.AddDays(-daysAgo),
                        IsActive = true
                    });

                    ratingsThisUser++;
                }
            }

            if (ratingsToCreate.Any())
            {
                _context.Ratings.AddRange(ratingsToCreate);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Created {ratingsToCreate.Count} new ratings");
            }
            else
            {
                Console.WriteLine("All sample ratings already exist, skipping rating creation");
            }
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

        public async Task ForceRemigrateWithNewDataAsync()
        {
            try
            {
                Console.WriteLine("Force re-migrating with new data structure...");

                // Clear existing data
                await ClearAllDataAsync();

                // Create new data
                await CreateSampleUsersAsync();
                Console.WriteLine("Sample users created successfully.");

                await CreateSampleBooksAsync();
                Console.WriteLine("Sample books created successfully.");

                await CreateSampleRatingsAsync();
                Console.WriteLine("Sample ratings created successfully.");

                await CreateEmailVerificationsForExistingUsersAsync();
                Console.WriteLine("Email verifications created for existing users.");

                await UpdateExistingBooksIsActiveAsync();
                Console.WriteLine("Updated existing books IsActive status.");

                await UpdateExistingRatingsIsActiveAsync();
                Console.WriteLine("Updated existing ratings IsActive status.");

                Console.WriteLine("Force re-migration completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during force re-migration: {ex.Message}");
                throw;
            }
        }

        private async Task ClearAllDataAsync()
        {
            // Clear all data in reverse order of dependencies
            _context.Ratings.RemoveRange(_context.Ratings);
            _context.Books.RemoveRange(_context.Books);
            _context.EmailVerifications.RemoveRange(_context.EmailVerifications);
            _context.Users.RemoveRange(_context.Users);
            
            await _context.SaveChangesAsync();
            Console.WriteLine("Cleared all existing data");
        }
    }
}