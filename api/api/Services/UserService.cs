using api.Models;
using api.Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class UserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> RegisterAsync(string username, string email, string firstName, string lastName)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Username == username || u.Email == email).ConfigureAwait(false))
            {
                return null;
            }

            var user = new User
            {
                Username = username,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                DateCreated = DateTime.Now,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync().ConfigureAwait(false);
            return user;
        }

        public async Task<User?> LoginAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                u.Email == email && u.IsActive).ConfigureAwait(false);

            if (user == null)
            {
                return null;
            }

            return user;
        }

        public async Task<User?> GetUserAsync(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.IsActive).ConfigureAwait(false);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower() && u.IsActive).ConfigureAwait(false);
        }

        public async Task<List<User>> SearchUsersByUsernameAsync(string username)
        {
            return await _context.Users
                .Where(u => u.Username.ToLower().StartsWith(username.ToLower()) && u.IsActive)
                .OrderBy(u => u.Username)
                .ToListAsync();
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower() && u.IsActive).ConfigureAwait(false);
        }

        public async Task<List<User>> SearchUsersByEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Email.ToLower().StartsWith(email.ToLower()) && u.IsActive)
                .OrderBy(u => u.Email)
                .ToListAsync();
        }

        public async Task<User?> GetUserByIdAsync(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.IsActive).ConfigureAwait(false);
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .Where(u => u.IsActive)
                .OrderBy(u => u.Username)
                .ToListAsync()
                .ConfigureAwait(false);
        }

        public async Task<bool> UpdateUserAsync(int id, string firstName, string lastName, string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id).ConfigureAwait(false);
            if (user == null) return false;

            // Check if email is already taken by another user
            if (await _context.Users.AnyAsync(u => u.Id != id && u.Email == email).ConfigureAwait(false))
            {
                return false;
            }

            user.FirstName = firstName;
            user.LastName = lastName;
            user.Email = email;

            await _context.SaveChangesAsync().ConfigureAwait(false);
            return true;
        }

        public async Task<bool> UpdateUserAsync(User user)
        {
            try
            {
                _context.Users.Update(user);
                await _context.SaveChangesAsync().ConfigureAwait(false);
                return true;
            }
            catch
            {
                return false;
            }
        }


        public async Task<bool> DeactivateUserAsync(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id).ConfigureAwait(false);
            if (user == null) return false;

            user.IsActive = false;
            await _context.SaveChangesAsync().ConfigureAwait(false);
            return true;
        }

        public async Task<bool> SoftDeleteUserAsync(int userId)
        {
            try
            {
                // Soft delete user
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;
                user.IsActive = false;

                // Soft delete all user's books
                var userBooks = await _context.Books
                    .Where(b => b.SellerEmail == user.Email)
                    .ToListAsync();
                foreach (var book in userBooks)
                {
                    book.IsActive = false;
                }

                // Soft delete all ratings given by user
                var ratingsGiven = await _context.Ratings
                    .Where(r => r.RaterId == userId)
                    .ToListAsync();
                foreach (var rating in ratingsGiven)
                {
                    rating.IsActive = false;
                }

                // Soft delete all ratings received by user
                var ratingsReceived = await _context.Ratings
                    .Where(r => r.RatedUserId == userId)
                    .ToListAsync();
                foreach (var rating in ratingsReceived)
                {
                    rating.IsActive = false;
                }

                // Soft delete all contacted sellers records
                var contactedSellers = await _context.ContactedSellers
                    .Where(c => c.BuyerId == userId || c.SellerId == userId)
                    .ToListAsync();
                foreach (var contact in contactedSellers)
                {
                    contact.IsActive = false;
                }

                // Soft delete all rated books
                var ratedBooks = await _context.RatedBooks
                    .Where(rb => rb.UserId == userId)
                    .ToListAsync();
                foreach (var ratedBook in ratedBooks)
                {
                    ratedBook.IsActive = false;
                }

                // Soft delete all prompted to rate records
                var promptedToRates = await _context.PromptedToRates
                    .Where(ptr => ptr.UserId == userId)
                    .ToListAsync();
                foreach (var prompted in promptedToRates)
                {
                    prompted.IsActive = false;
                }

                // Soft delete all notifications
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .ToListAsync();
                foreach (var notification in notifications)
                {
                    notification.IsActive = false;
                }

                
                var supportTickets = await _context.SupportTickets
                    .Where(st => st.UserId == userId)
                    .ToListAsync();
                foreach (var ticket in supportTickets)
                {
                    ticket.IsActive = false;
                }
                

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> SaveUserAsync(User user)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id).ConfigureAwait(false);
            if (existingUser == null) return false;

            // Update the user properties
            existingUser.Username = user.Username;
            existingUser.Email = user.Email;
            existingUser.FirstName = user.FirstName;
            existingUser.LastName = user.LastName;
            existingUser.DateCreated = user.DateCreated;
            existingUser.IsActive = user.IsActive;
            existingUser.AverageRating = user.AverageRating;
            existingUser.RatingCount = user.RatingCount;

            await _context.SaveChangesAsync().ConfigureAwait(false);
            return true;
        }

        public async Task<List<User>> SearchUsersByIdAsync(string idPrefix)
        {
            if (string.IsNullOrEmpty(idPrefix) || !int.TryParse(idPrefix, out _))
            {
                return new List<User>();
            }

            return await _context.Users
                .Where(u => u.Id.ToString().StartsWith(idPrefix) && u.IsActive)
                .OrderBy(u => u.Id)
                .ToListAsync();
        }

        // Legacy synchronous methods removed for safety - use async versions instead
        // These methods were causing deadlock issues with .Result calls

        public async Task<bool> UpdateUserAsync(int userId, string username, string email, string firstName, string lastName)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return false;
                }

                user.Username = username;
                user.Email = email;
                user.FirstName = firstName;
                user.LastName = lastName;

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> ClearUserNameAsync(int userId)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null || !user.IsActive)
                {
                    return false;
                }

                user.FirstName = "";
                user.LastName = "";

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}