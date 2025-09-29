using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using api.Services;
using api.Data;
using api.Models;

namespace api.Tests.Services
{
    public class UserServiceTests : TestBase
    {
        private UserService _service;
        private ApplicationDbContext _context;

        public UserServiceTests()
        {
            _context = CreateInMemoryContext();
            _service = new UserService(_context);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        [Fact]
        public async Task RegisterAsync_WithValidData_ShouldCreateUser()
        {
            // Arrange
            var username = "testuser";
            var email = "test@ua.edu";
            var firstName = "Test";
            var lastName = "User";

            // Act
            var result = await _service.RegisterAsync(username, email, firstName, lastName);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be(username);
            result.Email.Should().Be(email);
            _context.Users.Should().Contain(result);
        }

        [Fact]
        public async Task RegisterAsync_WithDuplicateEmail_ShouldReturnNull()
        {
            // Arrange
            var user = CreateTestUser();
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.RegisterAsync("differentuser", user.Email, "Test", "User");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task LoginAsync_WithValidEmail_ShouldReturnUser()
        {
            // Arrange
            var user = CreateTestUser();
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.LoginAsync(user.Email);

            // Assert
            result.Should().NotBeNull();
            result.Email.Should().Be(user.Email);
        }

        [Fact]
        public async Task LoginAsync_WithNonExistentEmail_ShouldReturnNull()
        {
            // Arrange
            var email = "nonexistent@ua.edu";

            // Act
            var result = await _service.LoginAsync(email);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetUserByIdAsync_WithValidId_ShouldReturnUser()
        {
            // Arrange
            var user = CreateTestUser();
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserByIdAsync(user.Id);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(user.Id);
        }

        [Fact]
        public async Task GetUserByIdAsync_WithNonExistentId_ShouldReturnNull()
        {
            // Arrange
            var userId = 999;

            // Act
            var result = await _service.GetUserByIdAsync(userId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetUserByEmailAsync_WithValidEmail_ShouldReturnUser()
        {
            // Arrange
            var user = CreateTestUser();
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserByEmailAsync(user.Email);

            // Assert
            result.Should().NotBeNull();
            result.Email.Should().Be(user.Email);
        }

        [Fact]
        public async Task GetUserByEmailAsync_WithNonExistentEmail_ShouldReturnNull()
        {
            // Arrange
            var email = "nonexistent@ua.edu";

            // Act
            var result = await _service.GetUserByEmailAsync(email);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetAllUsersAsync_ShouldReturnAllActiveUsers()
        {
            // Arrange
            var user1 = CreateTestUser("user1@ua.edu", "User", "One", "user1");
            var user2 = CreateTestUser("user2@ua.edu", "User", "Two", "user2");
            var inactiveUser = CreateTestUser("inactive@ua.edu", "Inactive", "User", "inactive");
            inactiveUser.IsActive = false;

            await _context.Users.AddRangeAsync(user1, user2, inactiveUser);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllUsersAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().OnlyContain(u => u.IsActive);
        }

        [Fact]
        public async Task UpdateUserAsync_WithValidData_ShouldUpdateUser()
        {
            // Arrange
            var user = CreateTestUser();
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            var newFirstName = "UpdatedName";
            var newLastName = "UpdatedLast";
            var newEmail = "updated@ua.edu";

            // Act
            var result = await _service.UpdateUserAsync(user.Id, newFirstName, newLastName, newEmail);

            // Assert
            result.Should().BeTrue();
            var updatedUser = await _context.Users.FindAsync(user.Id);
            updatedUser.FirstName.Should().Be(newFirstName);
            updatedUser.LastName.Should().Be(newLastName);
            updatedUser.Email.Should().Be(newEmail);
        }

        [Fact]
        public async Task UpdateUserAsync_WithNonExistentUser_ShouldReturnFalse()
        {
            // Arrange
            var userId = 999;

            // Act
            var result = await _service.UpdateUserAsync(userId, "Test", "User", "test@ua.edu");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteUserAsync_WithValidUser_ShouldSoftDeleteUser()
        {
            // Arrange
            var user = CreateTestUser();
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteUserAsync(user.Id);

            // Assert
            result.Should().BeTrue();
            var deletedUser = await _context.Users.FindAsync(user.Id);
            deletedUser.IsActive.Should().BeFalse();
        }

        [Fact]
        public async Task DeleteUserAsync_WithNonExistentUser_ShouldReturnFalse()
        {
            // Arrange
            var userId = 999;

            // Act
            var result = await _service.DeleteUserAsync(userId);

            // Assert
            result.Should().BeFalse();
        }
    }
}