using api.Models;
using api.Data;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;

namespace api.Services
{
    public class UserService
    {
        private readonly ApplicationDbContext _context;

        public UserService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> RegisterAsync(string username, string email, string password, string firstName, string lastName)
        {
            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Username == username || u.Email == email))
            {
                return null;
            }

            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = HashPassword(password),
                FirstName = firstName,
                LastName = lastName,
                DateCreated = DateTime.Now,
                IsActive = true
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User?> LoginAsync(string usernameOrEmail, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                (u.Username == usernameOrEmail || u.Email == usernameOrEmail) && 
                u.IsActive);

            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                return null;
            }

            return user;
        }

        public async Task<User?> GetUserAsync(int id)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.IsActive);
        }

        public async Task<User?> GetUserByUsernameAsync(string username)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Username == username && u.IsActive);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        }

        public async Task<bool> UpdateUserAsync(int id, string firstName, string lastName, string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return false;

            // Check if email is already taken by another user
            if (await _context.Users.AnyAsync(u => u.Id != id && u.Email == email))
            {
                return false;
            }

            user.FirstName = firstName;
            user.LastName = lastName;
            user.Email = email;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangePasswordAsync(int id, string currentPassword, string newPassword)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null || !VerifyPassword(currentPassword, user.PasswordHash))
            {
                return false;
            }

            user.PasswordHash = HashPassword(newPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeactivateUserAsync(int id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return false;

            user.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SaveUserAsync(User user)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
            if (existingUser == null) return false;

            // Update the user properties
            existingUser.Username = user.Username;
            existingUser.Email = user.Email;
            existingUser.PasswordHash = user.PasswordHash;
            existingUser.FirstName = user.FirstName;
            existingUser.LastName = user.LastName;
            existingUser.DateCreated = user.DateCreated;
            existingUser.IsActive = user.IsActive;
            existingUser.AverageRating = user.AverageRating;
            existingUser.RatingCount = user.RatingCount;

            await _context.SaveChangesAsync();
            return true;
        }

        private string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        private bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        // Legacy synchronous methods for backward compatibility
        public User? Register(string username, string email, string password, string firstName, string lastName)
        {
            return RegisterAsync(username, email, password, firstName, lastName).Result;
        }

        public User? Login(string usernameOrEmail, string password)
        {
            return LoginAsync(usernameOrEmail, password).Result;
        }

        public User? GetUser(int id)
        {
            return GetUserAsync(id).Result;
        }

        public User? GetUserByUsername(string username)
        {
            return GetUserByUsernameAsync(username).Result;
        }

        public User? GetUserByEmail(string email)
        {
            return GetUserByEmailAsync(email).Result;
        }

        public bool UpdateUser(int id, string firstName, string lastName, string email)
        {
            return UpdateUserAsync(id, firstName, lastName, email).Result;
        }

        public bool ChangePassword(int id, string currentPassword, string newPassword)
        {
            return ChangePasswordAsync(id, currentPassword, newPassword).Result;
        }

        public bool DeactivateUser(int id)
        {
            return DeactivateUserAsync(id).Result;
        }

        public bool SaveUser(User user)
        {
            return SaveUserAsync(user).Result;
        }
    }
}