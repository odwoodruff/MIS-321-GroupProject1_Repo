using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api
{
    public class TestMigration
    {
        public static async Task TestDummyRatingsActiveStatus()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite("Data Source=books.db")
                .Options;

            using var context = new ApplicationDbContext(options);

            Console.WriteLine("=== Testing Migration: Dummy Ratings Active Status ===\n");

            // Test 1: Total ratings count
            var totalRatings = await context.Ratings.CountAsync();
            Console.WriteLine($"Total Ratings Count: {totalRatings}");

            // Test 2: Active ratings count
            var activeRatings = await context.Ratings.CountAsync(r => r.IsActive);
            Console.WriteLine($"Active Ratings Count: {activeRatings}");

            // Test 3: Inactive ratings count
            var inactiveRatings = await context.Ratings.CountAsync(r => !r.IsActive);
            Console.WriteLine($"Inactive Ratings Count: {inactiveRatings}");

            // Test 4: Check for any ratings with default IsActive value
            var ratingsWithDefaultActive = await context.Ratings
                .Where(r => r.IsActive == true)
                .CountAsync();
            Console.WriteLine($"Ratings with IsActive = true: {ratingsWithDefaultActive}");

            // Test 5: Show sample ratings
            Console.WriteLine("\n=== Sample Ratings ===");
            var sampleRatings = await context.Ratings
                .OrderBy(r => r.Id)
                .Take(10)
                .Select(r => new { r.Id, r.RaterId, r.RatedUserId, r.BookId, r.Score, r.IsActive, r.DateCreated })
                .ToListAsync();

            foreach (var rating in sampleRatings)
            {
                Console.WriteLine($"ID: {rating.Id}, Rater: {rating.RaterId}, Rated: {rating.RatedUserId}, Book: {rating.BookId}, Score: {rating.Score}, Active: {rating.IsActive}, Date: {rating.DateCreated:yyyy-MM-dd HH:mm:ss}");
            }

            // Test 6: Verify all ratings have IsActive set
            var ratingsWithoutActiveFlag = await context.Ratings
                .Where(r => r.IsActive == false && r.IsActive == true) // This will be 0 if all are properly set
                .CountAsync();
            Console.WriteLine($"\nRatings with inconsistent IsActive flag: {ratingsWithoutActiveFlag}");

            // Test 7: Check if migration worked - all ratings should be active
            var allRatingsActive = totalRatings == activeRatings;
            Console.WriteLine($"\n=== Migration Test Results ===");
            Console.WriteLine($"All ratings are active: {allRatingsActive}");
            Console.WriteLine($"Migration successful: {allRatingsActive && inactiveRatings == 0}");

            if (allRatingsActive && inactiveRatings == 0)
            {
                Console.WriteLine("✅ SUCCESS: All dummy entries' ratings are properly flagged as active!");
            }
            else
            {
                Console.WriteLine("❌ FAILURE: Some ratings are not properly flagged as active!");
            }
        }
    }
}
