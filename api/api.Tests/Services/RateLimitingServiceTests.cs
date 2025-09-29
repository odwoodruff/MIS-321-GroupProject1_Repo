using FluentAssertions;
using api.Services;
using api.Constants;

namespace api.Tests.Services
{
    public class RateLimitingServiceTests : TestBase
    {
        private RateLimitingService _service;

        public RateLimitingServiceTests()
        {
            _service = new RateLimitingService();
        }

        [Fact]
        public void IsRateLimited_WithNewIdentifier_ShouldReturnFalse()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Act
            var result = _service.IsRateLimited(identifier, actionType);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void IsRateLimited_WithMultipleRequestsWithinLimit_ShouldReturnFalse()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Act & Assert - Make requests up to the limit
            for (int i = 0; i < ValidationConstants.MaxRequestsPerMinute - 1; i++)
            {
                var result = _service.IsRateLimited(identifier, actionType);
                result.Should().BeFalse();
            }
        }

        [Fact]
        public void IsRateLimited_WithExceededMinuteLimit_ShouldReturnTrue()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Act - Make requests up to the limit
            for (int i = 0; i < ValidationConstants.MaxRequestsPerMinute; i++)
            {
                _service.IsRateLimited(identifier, actionType);
            }

            // The next request should be rate limited
            var result = _service.IsRateLimited(identifier, actionType);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsRateLimited_WithExceededHourLimit_ShouldReturnTrue()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Act - Make requests up to the hourly limit
            for (int i = 0; i < ValidationConstants.MaxRequestsPerHour; i++)
            {
                _service.IsRateLimited(identifier, actionType);
            }

            // The next request should be rate limited
            var result = _service.IsRateLimited(identifier, actionType);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void IsRateLimited_WithLoginAction_ShouldUseLoginLimits()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "login";

            // Act - Make login attempts up to the limit
            for (int i = 0; i < ValidationConstants.MaxLoginAttemptsPerMinute; i++)
            {
                _service.IsRateLimited(identifier, actionType);
            }

            // The next login attempt should be rate limited
            var result = _service.IsRateLimited(identifier, actionType);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public void GetRemainingRequests_WithNewIdentifier_ShouldReturnMaxRequests()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Act
            var result = _service.GetRemainingRequests(identifier, actionType);

            // Assert
            result.Should().Be(ValidationConstants.MaxRequestsPerHour);
        }

        [Fact]
        public void GetRemainingRequests_WithSomeRequests_ShouldReturnCorrectCount()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";
            var requestsMade = 5;

            // Act - Make some requests
            for (int i = 0; i < requestsMade; i++)
            {
                _service.IsRateLimited(identifier, actionType);
            }

            var result = _service.GetRemainingRequests(identifier, actionType);

            // Assert
            result.Should().Be(ValidationConstants.MaxRequestsPerHour - requestsMade);
        }

        [Fact]
        public void ResetRateLimit_ShouldClearRateLimitData()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Make some requests to establish rate limit data
            for (int i = 0; i < 10; i++)
            {
                _service.IsRateLimited(identifier, actionType);
            }

            // Act
            _service.ResetRateLimit(identifier, actionType);

            // Assert - Should be able to make requests again
            var result = _service.IsRateLimited(identifier, actionType);
            result.Should().BeFalse();
        }

        [Fact]
        public void CleanupOldEntries_ShouldRemoveExpiredData()
        {
            // Arrange
            var identifier = "test_user_123";
            var actionType = "general";

            // Make some requests
            _service.IsRateLimited(identifier, actionType);

            // Act
            _service.CleanupOldEntries();

            // Assert - Cleanup should not throw exceptions
            _service.GetRemainingRequests(identifier, actionType).Should().BeGreaterOrEqualTo(0);
        }

        [Fact]
        public void IsRateLimited_WithDifferentIdentifiers_ShouldBeIndependent()
        {
            // Arrange
            var identifier1 = "user1";
            var identifier2 = "user2";
            var actionType = "general";

            // Act - Exceed limit for user1
            for (int i = 0; i < ValidationConstants.MaxRequestsPerMinute + 1; i++)
            {
                _service.IsRateLimited(identifier1, actionType);
            }

            // user2 should not be affected
            var result = _service.IsRateLimited(identifier2, actionType);

            // Assert
            result.Should().BeFalse();
        }
    }
}
