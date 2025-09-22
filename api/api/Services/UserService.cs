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
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username && u.IsActive).ConfigureAwait(false);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive).ConfigureAwait(false);
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


        public async Task<bool> DeactivateUserAsync(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id).ConfigureAwait(false);
            if (user == null) return false;

            user.IsActive = false;
            await _context.SaveChangesAsync().ConfigureAwait(false);
            return true;
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

        // Legacy synchronous methods removed for safety - use async versions instead
        // These methods were causing deadlock issues with .Result calls
    }
}