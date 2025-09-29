using FluentAssertions;
using api.Services;

namespace api.Tests
{
    public class WorkingTests
    {
        [Fact]
        public void RateLimitingService_ShouldBeCreated()
        {
            // Arrange & Act
            var service = new RateLimitingService();

            // Assert
            service.Should().NotBeNull();
        }

        [Fact]
        public void RateLimitingService_IsRateLimited_WithNewIdentifier_ShouldReturnFalse()
        {
            // Arrange
            var service = new RateLimitingService();
            var identifier = "test_user_123";
            var actionType = "general";

            // Act
            var result = service.IsRateLimited(identifier, actionType);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public void RateLimitingService_GetRemainingRequests_ShouldReturnPositiveNumber()
        {
            // Arrange
            var service = new RateLimitingService();
            var identifier = "test_user_123";
            var actionType = "general";

            // Act
            var result = service.GetRemainingRequests(identifier, actionType);

            // Assert
            result.Should().BeGreaterThan(0);
        }

        [Fact]
        public void BasicMath_ShouldWork()
        {
            // Arrange
            var a = 2;
            var b = 3;

            // Act
            var result = a + b;

            // Assert
            result.Should().Be(5);
        }
    }
}
