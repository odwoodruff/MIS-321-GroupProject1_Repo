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

                // Create admin user first
                await CreateAdminUserAsync();

                // Create sample users
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

        private async Task CreateAdminUserAsync()
        {
            // Check if admin user already exists
            var existingAdmin = await _context.Users.FirstOrDefaultAsync(u => u.Email == "ccsmith33@crimson.ua.edu");
            if (existingAdmin == null)
            {
                var adminUser = new User
                {
                    Username = "ccsmith33",
                    Email = "ccsmith33@crimson.ua.edu",
                    FirstName = "Clayton",
                    LastName = "Smith",
                    DateCreated = DateTime.Parse("2025-09-01 08:00:00"), // Admin created first
                    IsActive = true,
                    AverageRating = 5.0, // Perfect admin rating
                    RatingCount = 0
                };

                _context.Users.Add(adminUser);
                await _context.SaveChangesAsync();
                Console.WriteLine("Admin user Clayton Smith created successfully");
            }
            else
            {
                Console.WriteLine("Admin user already exists");
            }
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
            if (!existingUsernames.Contains("ccsmith33") && !existingEmails.Contains("ccsmith33@crimson.ua.edu"))
            {
                usersToCreate.Add(new User
                {
                    Username = "ccsmith33",
                    Email = "ccsmith33@crimson.ua.edu",
                    FirstName = "Clayton",
                    LastName = "Smith",
                    DateCreated = DateTime.Parse("2025-09-01 08:00:00"), // Admin created first
                    IsActive = true,
                    AverageRating = 5.0, // Perfect admin rating
                    RatingCount = 0
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

            // Get all users to distribute books among them
            var users = await _context.Users.Where(u => u.IsActive).ToListAsync();
            if (users.Count == 0)
            {
                Console.WriteLine("No active users found, cannot create books");
                return;
            }

            var booksToCreate = new List<Book>();
            var random = new Random();

            // Define sample books data (without hardcoded sellers)
            var sampleBooks = new[]
            {
                new { Title = "Calculus: Early Transcendentals", Author = "James Stewart", Genre = "Textbook", Year = 2021, Description = "Comprehensive calculus textbook with practice problems and solutions. Used for MATH 125.", Price = 85.00m, Condition = "Good", CourseCode = "MATH 125", Professor = "Dr. Smith", DatePosted = "2025-09-10 14:09:37" },
                new { Title = "Introduction to Psychology", Author = "David Myers", Genre = "Psychology", Year = 2021, Description = "Psychology textbook in excellent condition. Barely used, no highlighting.", Price = 120.00m, Condition = "Excellent", CourseCode = "PSY 101", Professor = "Dr. Williams", DatePosted = "2025-09-13 14:09:37" },
                new { Title = "Principles of Economics", Author = "N. Gregory Mankiw", Genre = "Economics", Year = 2022, Description = "Micro and macroeconomics textbook. Some highlighting but in good condition.", Price = 95.00m, Condition = "Good", CourseCode = "EC 110", Professor = "Dr. Brown", DatePosted = "2025-09-08 14:09:37" },
                new { Title = "Organic Chemistry", Author = "Paula Yurkanis Bruice", Genre = "Chemistry", Year = 2020, Description = "Comprehensive organic chemistry textbook with detailed mechanisms and practice problems.", Price = 150.00m, Condition = "Very Good", CourseCode = "CH 231", Professor = "Dr. Davis", DatePosted = "2025-09-12 09:15:00" },
                new { Title = "Introduction to Computer Science", Author = "John Zelle", Genre = "Computer Science", Year = 2021, Description = "Python programming textbook with exercises and examples. Perfect for CS 100.", Price = 75.00m, Condition = "Excellent", CourseCode = "CS 100", Professor = "Dr. Wilson", DatePosted = "2025-09-14 16:30:00" },
                new { Title = "American History: A Survey", Author = "Alan Brinkley", Genre = "History", Year = 2019, Description = "Comprehensive American history textbook covering colonial period to present.", Price = 110.00m, Condition = "Good", CourseCode = "HY 101", Professor = "Dr. Thompson", DatePosted = "2025-09-11 11:45:00" },
                new { Title = "Physics for Scientists and Engineers", Author = "Raymond Serway", Genre = "Physics", Year = 2020, Description = "Physics textbook with calculus-based approach. Includes problem solutions.", Price = 180.00m, Condition = "Very Good", CourseCode = "PH 105", Professor = "Dr. Martinez", DatePosted = "2025-09-09 13:20:00" },
                new { Title = "Business Communication", Author = "Courtland Bovee", Genre = "Business", Year = 2021, Description = "Professional communication skills for business students. Includes writing and presentation guides.", Price = 90.00m, Condition = "Excellent", CourseCode = "MGT 300", Professor = "Dr. Anderson", DatePosted = "2025-09-15 14:10:00" },
                new { Title = "Linear Algebra and Its Applications", Author = "David Lay", Genre = "Mathematics", Year = 2022, Description = "Linear algebra textbook with clear explanations and practice problems. Used for MATH 237.", Price = 125.00m, Condition = "Good", CourseCode = "MATH 237", Professor = "Dr. Garcia", DatePosted = "2025-09-16 10:15:00" },
                new { Title = "Abnormal Psychology", Author = "Ronald Comer", Genre = "Psychology", Year = 2021, Description = "Comprehensive abnormal psychology textbook. Some highlighting but in good condition.", Price = 135.00m, Condition = "Good", CourseCode = "PSY 240", Professor = "Dr. Rodriguez", DatePosted = "2025-09-17 14:30:00" },
                new { Title = "Financial Accounting", Author = "Jerry Weygandt", Genre = "Accounting", Year = 2023, Description = "Financial accounting textbook with practice exercises. Like new condition.", Price = 160.00m, Condition = "Excellent", CourseCode = "AC 210", Professor = "Dr. Lee", DatePosted = "2025-09-18 09:45:00" },
                new { Title = "General Biology", Author = "Sylvia Mader", Genre = "Biology", Year = 2022, Description = "Biology textbook with detailed illustrations. Some wear but still very usable.", Price = 140.00m, Condition = "Good", CourseCode = "BSC 114", Professor = "Dr. Kim", DatePosted = "2025-09-19 16:20:00" },
                new { Title = "Data Structures and Algorithms", Author = "Mark Weiss", Genre = "Computer Science", Year = 2021, Description = "Advanced computer science textbook. Perfect for CS 201. Minimal highlighting.", Price = 95.00m, Condition = "Very Good", CourseCode = "CS 201", Professor = "Dr. Patel", DatePosted = "2025-09-20 11:10:00" },
                new { Title = "World Literature", Author = "Damrosch & Pike", Genre = "Literature", Year = 2020, Description = "Comprehensive world literature anthology. Some highlighting but in good condition.", Price = 85.00m, Condition = "Good", CourseCode = "EN 205", Professor = "Dr. Taylor", DatePosted = "2025-09-21 13:25:00" },
                new { Title = "Marketing Management", Author = "Philip Kotler", Genre = "Marketing", Year = 2022, Description = "Marketing textbook with case studies. Excellent condition, no marks.", Price = 120.00m, Condition = "Excellent", CourseCode = "MKT 300", Professor = "Dr. Johnson", DatePosted = "2025-09-22 15:40:00" },
                new { Title = "Environmental Science", Author = "G. Tyler Miller", Genre = "Environmental", Year = 2021, Description = "Environmental science textbook with current data and case studies.", Price = 105.00m, Condition = "Very Good", CourseCode = "GEO 105", Professor = "Dr. Green", DatePosted = "2025-09-23 08:50:00" },
                new { Title = "Statistics for Business", Author = "David Anderson", Genre = "Statistics", Year = 2023, Description = "Business statistics textbook with Excel integration. Like new condition.", Price = 130.00m, Condition = "Excellent", CourseCode = "ST 260", Professor = "Dr. White", DatePosted = "2025-09-24 12:35:00" },
                new { Title = "Art History", Author = "Marilyn Stokstad", Genre = "Art", Year = 2020, Description = "Comprehensive art history textbook with color plates. Some wear but good condition.", Price = 115.00m, Condition = "Good", CourseCode = "ARH 101", Professor = "Dr. Brown", DatePosted = "2025-09-25 14:15:00" },
                new { Title = "Philosophy: The Quest for Truth", Author = "Louis Pojman", Genre = "Philosophy", Year = 2021, Description = "Philosophy textbook with primary source readings. Minimal highlighting.", Price = 75.00m, Condition = "Very Good", CourseCode = "PHL 100", Professor = "Dr. Moore", DatePosted = "2025-09-26 10:30:00" },
                new { Title = "Spanish Language and Culture", Author = "José Díaz", Genre = "Language", Year = 2022, Description = "Spanish textbook with audio CDs. Excellent condition, barely used.", Price = 100.00m, Condition = "Excellent", CourseCode = "SP 101", Professor = "Dr. Martinez", DatePosted = "2025-09-27 16:45:00" }
            };

            // Create additional books to distribute among all users
            var additionalBooks = new[]
            {
                new { Title = "Advanced Calculus", Author = "Michael Spivak", Genre = "Mathematics", Year = 2020, Description = "Rigorous calculus textbook for advanced students.", Price = 95.00m, Condition = "Very Good", CourseCode = "MATH 301", Professor = "Dr. Adams", DatePosted = "2025-09-28 10:00:00" },
                new { Title = "Social Psychology", Author = "Elliot Aronson", Genre = "Psychology", Year = 2021, Description = "Comprehensive social psychology textbook with research studies.", Price = 110.00m, Condition = "Good", CourseCode = "PSY 250", Professor = "Dr. Clark", DatePosted = "2025-09-29 14:30:00" },
                new { Title = "Microeconomics", Author = "Robert Pindyck", Genre = "Economics", Year = 2022, Description = "Intermediate microeconomics with mathematical approach.", Price = 125.00m, Condition = "Excellent", CourseCode = "EC 301", Professor = "Dr. Taylor", DatePosted = "2025-09-30 09:15:00" },
                new { Title = "Inorganic Chemistry", Author = "Gary Miessler", Genre = "Chemistry", Year = 2021, Description = "Inorganic chemistry textbook with molecular orbital theory.", Price = 145.00m, Condition = "Very Good", CourseCode = "CH 232", Professor = "Dr. Wilson", DatePosted = "2025-10-01 11:45:00" },
                new { Title = "Database Systems", Author = "Ramez Elmasri", Genre = "Computer Science", Year = 2020, Description = "Database design and implementation textbook.", Price = 105.00m, Condition = "Good", CourseCode = "CS 301", Professor = "Dr. Chen", DatePosted = "2025-10-02 16:20:00" },
                new { Title = "European History", Author = "John Merriman", Genre = "History", Year = 2019, Description = "Comprehensive European history from Renaissance to present.", Price = 98.00m, Condition = "Good", CourseCode = "HY 201", Professor = "Dr. Johnson", DatePosted = "2025-10-03 13:10:00" },
                new { Title = "Quantum Physics", Author = "David Griffiths", Genre = "Physics", Year = 2021, Description = "Introduction to quantum mechanics with problems and solutions.", Price = 165.00m, Condition = "Excellent", CourseCode = "PH 301", Professor = "Dr. Singh", DatePosted = "2025-10-04 08:30:00" },
                new { Title = "Strategic Management", Author = "Michael Porter", Genre = "Business", Year = 2022, Description = "Strategic management concepts and case studies.", Price = 115.00m, Condition = "Very Good", CourseCode = "MGT 400", Professor = "Dr. Davis", DatePosted = "2025-10-05 15:45:00" },
                new { Title = "Differential Equations", Author = "William Boyce", Genre = "Mathematics", Year = 2020, Description = "Ordinary and partial differential equations textbook.", Price = 88.00m, Condition = "Good", CourseCode = "MATH 238", Professor = "Dr. Miller", DatePosted = "2025-10-06 12:00:00" },
                new { Title = "Cognitive Psychology", Author = "Robert Sternberg", Genre = "Psychology", Year = 2021, Description = "Cognitive processes and mental representations.", Price = 128.00m, Condition = "Very Good", CourseCode = "PSY 350", Professor = "Dr. Thompson", DatePosted = "2025-10-07 10:15:00" }
            };

            // Combine all books
            var allBooks = sampleBooks.Concat(additionalBooks).ToArray();

            // Only create books that don't already exist and distribute among users
            foreach (var bookData in allBooks)
            {
                if (!existingBookTitles.Contains(bookData.Title))
                {
                    // Randomly select a seller from all users
                    var seller = users[random.Next(users.Count)];
                    
                    booksToCreate.Add(new Book
                    {
                        Title = bookData.Title,
                        Author = bookData.Author,
                        Genre = bookData.Genre,
                        Year = bookData.Year,
                        Description = bookData.Description,
                        Price = bookData.Price,
                        Condition = bookData.Condition,
                        SellerName = $"{seller.FirstName} {seller.LastName}",
                        SellerEmail = seller.Email,
                        CourseCode = bookData.CourseCode,
                        Professor = bookData.Professor,
                        IsAvailable = random.NextDouble() > 0.2, // 20% chance of being sold
                        DatePosted = DateTime.Parse(bookData.DatePosted),
                        SellerRating = seller.AverageRating,
                        SellerRatingCount = seller.RatingCount
                    });
                }
            }

            if (booksToCreate.Any())
            {
                _context.Books.AddRange(booksToCreate);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Created {booksToCreate.Count} new books distributed among {users.Count} users");
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

                // Create admin user first
                await CreateAdminUserAsync();

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

                // Ensure alex.johnson@ua.edu has required data
                await EnsureAlexJohnsonDataAsync();
                Console.WriteLine("Alex Johnson data ensured.");

                // Populate new tracking tables with sample data
                await PopulateTrackingDataAsync();
                Console.WriteLine("Tracking data populated.");

                // Create comprehensive notifications for Alex (after all data is created)
                await CreateAlexNotificationsAsync();
                Console.WriteLine("Alex notifications created.");

                Console.WriteLine("Force re-migration completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during force re-migration: {ex.Message}");
                throw;
            }
        }

        public async Task EnsureAlexJohnsonDataAsync()
        {
            try
            {
                var alexUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "alex.johnson@ua.edu");
                if (alexUser == null)
                {
                    Console.WriteLine("Alex Johnson user not found, skipping data creation");
                    return;
                }

                // 1. Always ensure Alex has books for demo (clear and recreate if needed)
                var alexBooks = await _context.Books.Where(b => b.SellerEmail == "alex.johnson@ua.edu").ToListAsync();
                
                // For demo purposes, always ensure Alex has at least 5 books
                if (alexBooks.Count < 5)
                {
                    var booksToCreate = new[]
                    {
                        new Book
                        {
                            Title = "Introduction to Computer Science",
                            Author = "John Smith",
                            Genre = "Computer Science",
                            Year = 2023,
                            Price = 45.99m,
                            Condition = "Good",
                            Description = "Used textbook with some highlighting",
                            SellerName = "Alex Johnson",
                            SellerEmail = "alex.johnson@ua.edu",
                            CourseCode = "CS101",
                            Professor = "Dr. Smith",
                            DatePosted = DateTime.UtcNow,
                            IsActive = true,
                            IsAvailable = true
                        },
                        new Book
                        {
                            Title = "Data Structures and Algorithms",
                            Author = "Jane Doe",
                            Genre = "Computer Science",
                            Year = 2022,
                            Price = 65.50m,
                            Condition = "Excellent",
                            Description = "Like new condition, no marks",
                            SellerName = "Alex Johnson",
                            SellerEmail = "alex.johnson@ua.edu",
                            CourseCode = "CS201",
                            Professor = "Dr. Doe",
                            DatePosted = DateTime.UtcNow,
                            IsActive = true,
                            IsAvailable = true
                        },
                        new Book
                        {
                            Title = "Database Systems",
                            Author = "Bob Wilson",
                            Genre = "Computer Science",
                            Year = 2023,
                            Price = 55.00m,
                            Condition = "Fair",
                            Description = "Some wear but all pages intact",
                            SellerName = "Alex Johnson",
                            SellerEmail = "alex.johnson@ua.edu",
                            CourseCode = "CS301",
                            Professor = "Dr. Wilson",
                            DatePosted = DateTime.UtcNow,
                            IsActive = true,
                            IsAvailable = false // This one is sold
                        },
                        new Book
                        {
                            Title = "Software Engineering Principles",
                            Author = "Alice Johnson",
                            Genre = "Computer Science",
                            Year = 2022,
                            Price = 75.00m,
                            Condition = "Good",
                            Description = "Well-maintained textbook with minimal wear",
                            SellerName = "Alex Johnson",
                            SellerEmail = "alex.johnson@ua.edu",
                            CourseCode = "CS401",
                            Professor = "Dr. Johnson",
                            DatePosted = DateTime.UtcNow,
                            IsActive = true,
                            IsAvailable = true
                        },
                        new Book
                        {
                            Title = "Machine Learning Fundamentals",
                            Author = "David Brown",
                            Genre = "Computer Science",
                            Year = 2023,
                            Price = 85.00m,
                            Condition = "Excellent",
                            Description = "Brand new condition, never used",
                            SellerName = "Alex Johnson",
                            SellerEmail = "alex.johnson@ua.edu",
                            CourseCode = "CS501",
                            Professor = "Dr. Brown",
                            DatePosted = DateTime.UtcNow,
                            IsActive = true,
                            IsAvailable = false // This one is also sold
                        }
                    };

                    _context.Books.AddRange(booksToCreate);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created {booksToCreate.Length} books for Alex Johnson");
                }
                else
                {
                    Console.WriteLine($"Alex Johnson already has {alexBooks.Count} books");
                }

                // 2. Have Alex rate actual users who have books
                var alexRatingsGiven = await _context.Ratings.Where(r => r.RaterId == alexUser.Id).ToListAsync();
                if (alexRatingsGiven.Count < 4)
                {
                    // Get users who have books (excluding Alex)
                    var usersWithBooks = await _context.Users
                        .Where(u => u.Email != "alex.johnson@ua.edu" && 
                                   _context.Books.Any(b => b.SellerEmail == u.Email))
                        .Take(5)
                        .ToListAsync();
                    
                    if (usersWithBooks.Count >= 1)
                    {
                        // Get books from these users
                        var booksToRate = await _context.Books
                            .Where(b => usersWithBooks.Select(u => u.Email).Contains(b.SellerEmail))
                            .Take(5)
                            .ToListAsync();

                        var ratingsToCreate = new List<Rating>();
                        var ratedBooksToCreate = new List<RatedBook>();

                        for (int i = 0; i < Math.Min(4, Math.Min(usersWithBooks.Count, booksToRate.Count)); i++)
                        {
                            var userToRate = usersWithBooks[i];
                            var bookToRate = booksToRate[i];
                            
                            var rating = new Rating
                            {
                                RaterId = alexUser.Id,
                                RatedUserId = userToRate.Id,
                                BookId = bookToRate.Id,
                                Score = 4 + (i % 2), // 4 or 5 stars
                                Comment = i == 0 ? "Great seller! Book was exactly as described and shipped quickly." :
                                         i == 1 ? "Good condition book, fair price. Would buy again." :
                                         i == 2 ? "Excellent communication and fast delivery. Highly recommend!" :
                                         "Professional seller, great experience overall.",
                                DateCreated = DateTime.UtcNow.AddDays(-i),
                                IsActive = true
                            };
                            
                            ratingsToCreate.Add(rating);
                        }

                        _context.Ratings.AddRange(ratingsToCreate);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Created {ratingsToCreate.Count} ratings from Alex Johnson");

                        // Create corresponding RatedBook records
                        for (int i = 0; i < ratingsToCreate.Count; i++)
                        {
                            var ratedBook = new RatedBook
                            {
                                UserId = alexUser.Id,
                                BookId = booksToRate[i].Id,
                                RatingId = ratingsToCreate[i].Id,
                                DateRated = ratingsToCreate[i].DateCreated,
                                IsActive = true
                            };
                            ratedBooksToCreate.Add(ratedBook);
                        }

                        _context.RatedBooks.AddRange(ratedBooksToCreate);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Created {ratedBooksToCreate.Count} rated book records for Alex Johnson");
                    }
                }

                // 3. Have Alex contact sellers of actual books
                var alexContactedSellers = await _context.ContactedSellers.Where(cs => cs.BuyerId == alexUser.Id).ToListAsync();
                if (alexContactedSellers.Count < 3)
                {
                    // Get books from other users that Alex can contact about
                    var booksToContact = await _context.Books
                        .Where(b => b.SellerEmail != "alex.johnson@ua.edu" && b.IsActive)
                        .Take(3)
                        .ToListAsync();
                    
                    if (booksToContact.Count >= 3)
                    {
                        var contactedSellersToCreate = new List<ContactedSeller>();

                        for (int i = 0; i < booksToContact.Count; i++)
                        {
                            var book = booksToContact[i];
                            var seller = await _context.Users.FirstOrDefaultAsync(u => u.Email == book.SellerEmail);
                            
                            if (seller != null)
                            {
                                var contactedSeller = new ContactedSeller
                                {
                                    BuyerId = alexUser.Id,
                                    SellerId = seller.Id,
                                    BookId = book.Id,
                                    DateContacted = DateTime.UtcNow.AddDays(-i - 1),
                                    IsActive = true
                                };
                                contactedSellersToCreate.Add(contactedSeller);
                            }
                        }

                        _context.ContactedSellers.AddRange(contactedSellersToCreate);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Created {contactedSellersToCreate.Count} contacted seller records for Alex Johnson");
                    }
                }

                // 4. Have Alex be prompted to rate books he contacted about
                var alexPromptedToRate = await _context.PromptedToRates.Where(ptr => ptr.UserId == alexUser.Id).ToListAsync();
                if (alexPromptedToRate.Count < 2)
                {
                    // Get books Alex contacted about (from step 3)
                    var alexContactedBooks = await _context.ContactedSellers
                        .Where(cs => cs.BuyerId == alexUser.Id)
                        .Select(cs => new { cs.BookId, cs.SellerId })
                        .Take(2)
                        .ToListAsync();
                    
                    if (alexContactedBooks.Count >= 2)
                    {
                        var promptedToRateToCreate = new List<PromptedToRate>();

                        for (int i = 0; i < alexContactedBooks.Count; i++)
                        {
                            var contact = alexContactedBooks[i];
                            var promptedToRate = new PromptedToRate
                            {
                                UserId = alexUser.Id,
                                BookId = contact.BookId,
                                SellerId = contact.SellerId,
                                DatePrompted = DateTime.UtcNow.AddDays(-i - 1),
                                IsActive = true
                            };
                            promptedToRateToCreate.Add(promptedToRate);
                        }

                        _context.PromptedToRates.AddRange(promptedToRateToCreate);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Created {promptedToRateToCreate.Count} prompted to rate records for Alex Johnson");
                    }
                }

                // 5. Have 4 random users contact Alex about his books
                var alexBooksForContact = await _context.Books.Where(b => b.SellerEmail == "alex.johnson@ua.edu").ToListAsync();
                var usersToContactAlex = await _context.Users
                    .Where(u => u.Email != "alex.johnson@ua.edu")
                    .Take(4)
                    .ToListAsync();
                
                if (alexBooksForContact.Count > 0 && usersToContactAlex.Count >= 4)
                {
                    var contactsToAlex = new List<ContactedSeller>();
                    var notificationsToAlex = new List<Notification>();

                    for (int i = 0; i < 4; i++)
                    {
                        var book = alexBooksForContact[i % alexBooksForContact.Count];
                        var buyer = usersToContactAlex[i];
                        
                        // Create contact record
                        var contact = new ContactedSeller
                        {
                            BuyerId = buyer.Id,
                            SellerId = alexUser.Id,
                            BookId = book.Id,
                            DateContacted = DateTime.UtcNow.AddDays(-i - 1),
                            IsActive = true
                        };
                        contactsToAlex.Add(contact);

                        // Create notification for Alex about the contact
                        var notification = new Notification
                        {
                            UserId = alexUser.Id,
                            Message = $"Book inquiry: {buyer.FirstName} {buyer.LastName} is interested in your '{book.Title}' textbook",
                            Type = "info",
                            RelatedBookId = book.Id,
                            RelatedUserId = buyer.Id,
                            DateCreated = DateTime.UtcNow.AddDays(-i - 1),
                            IsRead = false,
                            IsActive = true
                        };
                        notificationsToAlex.Add(notification);
                    }

                    _context.ContactedSellers.AddRange(contactsToAlex);
                    _context.Notifications.AddRange(notificationsToAlex);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created {contactsToAlex.Count} contacts to Alex and {notificationsToAlex.Count} notifications");
                }

                // Notifications will be created separately after all data is populated

                // 7. Have other users rate Alex's books (so Alex gets realistic feedback)
                var ratingsForAlex = await _context.Ratings.Where(r => r.RatedUserId == alexUser.Id).ToListAsync();
                if (ratingsForAlex.Count < 5)
                {
                    var alexBooksForRating = await _context.Books
                        .Where(b => b.SellerEmail == "alex.johnson@ua.edu" && b.IsActive)
                        .Take(3)
                        .ToListAsync();

                    var usersToRateAlex = await _context.Users
                        .Where(u => u.Email != "alex.johnson@ua.edu")
                        .Take(10)
                        .ToListAsync();

                    if (alexBooksForRating.Count > 0 && usersToRateAlex.Count >= 10)
                    {
                        var ratingsForAlexToCreate = new List<Rating>();
                        var ratedBooksForAlexToCreate = new List<RatedBook>();

                        // Create at least 10 ratings for Alex
                        for (int i = 0; i < 10; i++)
                        {
                            var book = alexBooksForRating[i % alexBooksForRating.Count];
                            var rater = usersToRateAlex[i % usersToRateAlex.Count];
                            
                            var rating = new Rating
                            {
                                RaterId = rater.Id,
                                RatedUserId = alexUser.Id,
                                BookId = book.Id,
                                Score = 4 + (i % 2), // 4 or 5 stars
                                Comment = i == 0 ? "Great seller! Book was exactly as described and shipped quickly." :
                                         i == 1 ? "Good condition book, fair price. Would buy again." :
                                         i == 2 ? "Excellent communication and fast delivery. Highly recommend!" :
                                         i == 3 ? "Book arrived in perfect condition. Very satisfied!" :
                                         i == 4 ? "Professional seller, great experience overall." :
                                         i == 5 ? "Fast shipping and book was in excellent condition!" :
                                         i == 6 ? "Great price and quick response to messages." :
                                         i == 7 ? "Book was exactly as described, very happy with purchase." :
                                         i == 8 ? "Smooth transaction, would definitely buy from again." :
                                         "Outstanding seller, highly recommend to other students!",
                                DateCreated = DateTime.UtcNow.AddDays(-i - 1),
                                IsActive = true
                            };
                            
                            ratingsForAlexToCreate.Add(rating);
                        }

                        _context.Ratings.AddRange(ratingsForAlexToCreate);
                        await _context.SaveChangesAsync();

                        // Create corresponding RatedBook records
                        for (int i = 0; i < ratingsForAlexToCreate.Count; i++)
                        {
                            var ratedBook = new RatedBook
                            {
                                UserId = usersToRateAlex[i].Id,
                                BookId = alexBooksForRating[i % alexBooksForRating.Count].Id,
                                RatingId = ratingsForAlexToCreate[i].Id,
                                DateRated = ratingsForAlexToCreate[i].DateCreated,
                                IsActive = true
                            };
                            ratedBooksForAlexToCreate.Add(ratedBook);
                        }

                        _context.RatedBooks.AddRange(ratedBooksForAlexToCreate);
                        await _context.SaveChangesAsync();

                        // Update Alex's average rating
                        var allRatingsForAlex = await _context.Ratings
                            .Where(r => r.RatedUserId == alexUser.Id && r.IsActive)
                            .ToListAsync();
                        
                        if (allRatingsForAlex.Any())
                        {
                            alexUser.AverageRating = (double)allRatingsForAlex.Average(r => r.Score);
                            alexUser.RatingCount = allRatingsForAlex.Count;
                            
                            // Update seller ratings on Alex's books
                            var alexBooksToUpdate = await _context.Books
                                .Where(b => b.SellerEmail == "alex.johnson@ua.edu")
                                .ToListAsync();
                            
                            foreach (var book in alexBooksToUpdate)
                            {
                                book.SellerRating = alexUser.AverageRating;
                                book.SellerRatingCount = alexUser.RatingCount;
                            }
                            
                            await _context.SaveChangesAsync();
                        }

                        Console.WriteLine($"Created {ratingsForAlexToCreate.Count} ratings FOR Alex Johnson from other users");
                    }
                }

                Console.WriteLine("Alex Johnson data ensured successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error ensuring Alex Johnson data: {ex.Message}");
                // Don't throw - this is not critical for migration
            }
        }

        public async Task CreateAlexNotificationsAsync()
        {
            try
            {
                var alexUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == "alex.johnson@ua.edu");
                if (alexUser == null)
                {
                    Console.WriteLine("Alex Johnson user not found, skipping notification creation");
                    return;
                }

                // Clear existing notifications for Alex to ensure fresh unread notifications
                var existingNotifications = await _context.Notifications.Where(n => n.UserId == alexUser.Id).ToListAsync();
                if (existingNotifications.Any())
                {
                    _context.Notifications.RemoveRange(existingNotifications);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Cleared {existingNotifications.Count} existing notifications for Alex Johnson");
                }

                // Get all other users for realistic notifications
                var allOtherUsers = await _context.Users
                    .Where(u => u.Email != "alex.johnson@ua.edu")
                    .Take(10)
                    .ToListAsync();

                // Get Alex's books for the notifications
                var alexBooksForNotifications = await _context.Books
                    .Where(b => b.SellerEmail == "alex.johnson@ua.edu" && b.IsActive)
                    .Take(5)
                    .ToListAsync();

                var notificationsToCreate = new List<Notification>();

                // Add book inquiry notifications from real users about Alex's books
                for (int i = 0; i < Math.Min(5, allOtherUsers.Count); i++)
                {
                    var user = allOtherUsers[i];
                    var book = alexBooksForNotifications[i % alexBooksForNotifications.Count];
                    
                    notificationsToCreate.Add(new Notification
                    {
                        UserId = alexUser.Id,
                        Message = $"📚 {user.FirstName} {user.LastName} is interested in your '{book.Title}' textbook",
                        Type = "info",
                        RelatedBookId = book.Id,
                        RelatedUserId = user.Id,
                        DateCreated = DateTime.UtcNow.AddDays(-i - 1),
                        IsRead = false, // All unread for demo
                        IsActive = true
                    });
                }

                // Add rating notifications from real users about Alex's books
                for (int i = 0; i < Math.Min(3, allOtherUsers.Count); i++)
                {
                    var user = allOtherUsers[i];
                    var book = alexBooksForNotifications[(i + 2) % alexBooksForNotifications.Count];
                    
                    notificationsToCreate.Add(new Notification
                    {
                        UserId = alexUser.Id,
                        Message = $"⭐ {user.FirstName} {user.LastName} rated you 5 stars for '{book.Title}' - 'Great seller!'",
                        Type = "success",
                        RelatedBookId = book.Id,
                        RelatedUserId = user.Id,
                        DateCreated = DateTime.UtcNow.AddDays(-i - 3),
                        IsRead = false, // All unread for demo
                        IsActive = true
                    });
                }

                // Add system notifications (all unread for demo)
                var systemNotifications = new[]
                    {
                        new Notification
                        {
                            UserId = alexUser.Id,
                        Message = "🎉 Welcome to Roll Tide Books! Your account is now active.",
                            Type = "success",
                        DateCreated = DateTime.UtcNow.AddDays(-10),
                        IsRead = false, // Unread for demo
                            IsActive = true
                        },
                        new Notification
                        {
                            UserId = alexUser.Id,
                        Message = "💡 Tip: Add detailed descriptions to your books for better visibility",
                            Type = "info",
                        DateCreated = DateTime.UtcNow.AddDays(-5),
                            IsRead = false,
                            IsActive = true
                        },
                        new Notification
                        {
                            UserId = alexUser.Id,
                        Message = "📊 Your book listings are performing well this week!",
                        Type = "info",
                        DateCreated = DateTime.UtcNow.AddDays(-2),
                        IsRead = false,
                        IsActive = true
                    },
                    new Notification
                    {
                        UserId = alexUser.Id,
                        Message = "🔔 New feature: You can now rate sellers after transactions",
                            Type = "info",
                            DateCreated = DateTime.UtcNow.AddDays(-1),
                            IsRead = false,
                            IsActive = true
                    },
                    new Notification
                    {
                        UserId = alexUser.Id,
                        Message = "📈 Your seller rating has improved to 4.8/5.0!",
                        Type = "success",
                        DateCreated = DateTime.UtcNow.AddHours(-6),
                        IsRead = false,
                        IsActive = true
                    }
                };

                notificationsToCreate.AddRange(systemNotifications);

                _context.Notifications.AddRange(notificationsToCreate);
                    await _context.SaveChangesAsync();
                Console.WriteLine($"Created {notificationsToCreate.Count} comprehensive notifications for Alex Johnson");
                
                // Verify all notifications are unread
                var unreadCount = notificationsToCreate.Count(n => !n.IsRead);
                Console.WriteLine($"All {unreadCount} notifications created as UNREAD for demo purposes");

                // Now create the actual ratings for Alex (the same users who contacted him)
                var ratingsToCreate = new List<Rating>();
                var ratedBooksToCreate = new List<RatedBook>();

                // Create ratings from the same users who contacted Alex
                for (int i = 0; i < Math.Min(10, allOtherUsers.Count); i++)
                {
                    var user = allOtherUsers[i];
                    var book = alexBooksForNotifications[i % alexBooksForNotifications.Count];
                    
                    var rating = new Rating
                    {
                        RaterId = user.Id,
                        RatedUserId = alexUser.Id,
                        BookId = book.Id,
                        Score = 4 + (i % 2), // 4 or 5 stars
                        Comment = i == 0 ? "Great seller! Book was exactly as described and shipped quickly." :
                                 i == 1 ? "Good condition book, fair price. Would buy again." :
                                 i == 2 ? "Excellent communication and fast delivery. Highly recommend!" :
                                 i == 3 ? "Book arrived in perfect condition. Very satisfied!" :
                                 i == 4 ? "Professional seller, great experience overall." :
                                 i == 5 ? "Fast shipping and book was in excellent condition!" :
                                 i == 6 ? "Great price and quick response to messages." :
                                 i == 7 ? "Book was exactly as described, very happy with purchase." :
                                 i == 8 ? "Smooth transaction, would definitely buy from again." :
                                 "Outstanding seller, highly recommend to other students!",
                        DateCreated = DateTime.UtcNow.AddDays(-i - 1),
                        IsActive = true
                    };
                    
                    ratingsToCreate.Add(rating);
                }

                _context.Ratings.AddRange(ratingsToCreate);
                await _context.SaveChangesAsync();

                // Create corresponding RatedBook records
                for (int i = 0; i < ratingsToCreate.Count; i++)
                {
                    var ratedBook = new RatedBook
                    {
                        UserId = allOtherUsers[i % allOtherUsers.Count].Id,
                        BookId = alexBooksForNotifications[i % alexBooksForNotifications.Count].Id,
                        RatingId = ratingsToCreate[i].Id,
                        DateRated = ratingsToCreate[i].DateCreated,
                        IsActive = true
                    };
                    ratedBooksToCreate.Add(ratedBook);
                }

                _context.RatedBooks.AddRange(ratedBooksToCreate);
                await _context.SaveChangesAsync();

                // Update Alex's average rating
                var allRatingsForAlex = await _context.Ratings
                    .Where(r => r.RatedUserId == alexUser.Id && r.IsActive)
                    .ToListAsync();
                
                if (allRatingsForAlex.Any())
                {
                    alexUser.AverageRating = (double)allRatingsForAlex.Average(r => r.Score);
                    alexUser.RatingCount = allRatingsForAlex.Count;
                    
                    await _context.SaveChangesAsync();
                }

                Console.WriteLine($"Created {ratingsToCreate.Count} ratings FOR Alex Johnson from other users");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating Alex notifications: {ex.Message}");
                // Don't throw - this is not critical for migration
            }
        }

        private async Task PopulateTrackingDataAsync()
        {
            try
            {
                // Get some users and books for sample data
                var users = await _context.Users.Take(10).ToListAsync();
                var books = await _context.Books.Take(10).ToListAsync();
                var ratings = await _context.Ratings.Take(10).ToListAsync();
                var random = new Random();

                if (users.Count < 2 || books.Count < 2)
                {
                    Console.WriteLine("Not enough users or books for tracking data population");
                    return;
                }

                // 1. Populate ContactedSellers with sample data
                var contactedSellersCount = await _context.ContactedSellers.CountAsync();
                if (contactedSellersCount == 0)
                {
                    var contactedSellersToCreate = new List<ContactedSeller>();
                    
                    // Create some realistic contact scenarios
                    for (int i = 0; i < Math.Min(20, books.Count); i++)
                    {
                        var buyer = users[i % users.Count];
                        var seller = users[(i + 1) % users.Count];
                        var book = books[i % books.Count];
                        
                        // Don't contact yourself
                        if (buyer.Id != seller.Id)
                        {
                            contactedSellersToCreate.Add(new ContactedSeller
                            {
                                BuyerId = buyer.Id,
                                SellerId = seller.Id,
                                BookId = book.Id,
                                DateContacted = DateTime.UtcNow.AddDays(-random.Next(1, 30)),
                                IsActive = true
                            });
                        }
                    }

                    _context.ContactedSellers.AddRange(contactedSellersToCreate);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created {contactedSellersToCreate.Count} contacted seller records");
                }

                // 2. Populate RatedBooks with sample data
                var ratedBooksCount = await _context.RatedBooks.CountAsync();
                if (ratedBooksCount == 0)
                {
                    var ratedBooksToCreate = new List<RatedBook>();
                    
                    // Link existing ratings to rated books
                    foreach (var rating in ratings)
                    {
                        ratedBooksToCreate.Add(new RatedBook
                        {
                            UserId = rating.RaterId,
                            BookId = rating.BookId,
                            RatingId = rating.Id,
                            DateRated = rating.DateCreated,
                            IsActive = true
                        });
                    }

                    _context.RatedBooks.AddRange(ratedBooksToCreate);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created {ratedBooksToCreate.Count} rated book records");
                }

                // 3. Populate PromptedToRate with sample data
                var promptedToRateCount = await _context.PromptedToRates.CountAsync();
                if (promptedToRateCount == 0)
                {
                    var promptedToRateToCreate = new List<PromptedToRate>();
                    
                    // Create some rating prompts
                    for (int i = 0; i < Math.Min(15, users.Count); i++)
                    {
                        var user = users[i % users.Count];
                        var book = books[i % books.Count];
                        var seller = users[(i + 2) % users.Count];
                        
                        // Don't prompt to rate yourself
                        if (user.Id != seller.Id)
                        {
                            promptedToRateToCreate.Add(new PromptedToRate
                            {
                                UserId = user.Id,
                                BookId = book.Id,
                                SellerId = seller.Id,
                                DatePrompted = DateTime.UtcNow.AddDays(-random.Next(1, 15)),
                                IsActive = true
                            });
                        }
                    }

                    _context.PromptedToRates.AddRange(promptedToRateToCreate);
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Created {promptedToRateToCreate.Count} prompted to rate records");
                }

                Console.WriteLine("Tracking data population completed successfully");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error populating tracking data: {ex.Message}");
                // Don't throw - this is not critical for migration
            }
        }

        private async Task ClearAllDataAsync()
        {
            // Clear all data in reverse order of dependencies
            _context.PromptedToRates.RemoveRange(_context.PromptedToRates);
            _context.RatedBooks.RemoveRange(_context.RatedBooks);
            _context.ContactedSellers.RemoveRange(_context.ContactedSellers);
            _context.Notifications.RemoveRange(_context.Notifications);
            _context.Ratings.RemoveRange(_context.Ratings);
            _context.Books.RemoveRange(_context.Books);
            _context.EmailVerifications.RemoveRange(_context.EmailVerifications);
            _context.Users.RemoveRange(_context.Users);
            
            await _context.SaveChangesAsync();
            Console.WriteLine("Cleared all existing data");
        }
    }
}