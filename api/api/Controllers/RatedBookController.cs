using api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RatedBookController : ControllerBase
    {
        private readonly RatedBookService _ratedBookService;
        private readonly LoggingService _loggingService;

        public RatedBookController(RatedBookService ratedBookService, LoggingService loggingService)
        {
            _ratedBookService = ratedBookService;
            _loggingService = loggingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRatedBooks()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var ratedBooks = await _ratedBookService.GetRatedBooksForUserAsync(userId);
                return Ok(ratedBooks);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving rated books", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving rated books" });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchRatings([FromQuery] string comment)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var searchResults = await _ratedBookService.SearchRatingsByCommentAsync(comment);
                return Ok(searchResults);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error searching ratings", ex);
                return StatusCode(500, new { message = "An error occurred while searching ratings" });
            }
        }

        [HttpGet("search-by-id/{idPrefix}")]
        public async Task<IActionResult> SearchRatingsById(string idPrefix)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var searchResults = await _ratedBookService.SearchRatingsByIdAsync(idPrefix);
                return Ok(searchResults);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error searching ratings by ID", ex);
                return StatusCode(500, new { message = "An error occurred while searching ratings by ID" });
            }
        }

        [HttpDelete("{ratingId}")]
        public async Task<IActionResult> DeleteRating(int ratingId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _ratedBookService.SoftDeleteRatingAsync(ratingId);
                if (!success)
                {
                    return NotFound(new { message = "Rating not found" });
                }

                _loggingService.LogUserAction("DeleteRating", userId.ToString(), 
                    $"User {userId} deleted rating {ratingId}");

                return Ok(new { message = "Rating deleted successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error deleting rating", ex);
                return StatusCode(500, new { message = "An error occurred while deleting rating" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddRatedBook([FromBody] AddRatedBookRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _ratedBookService.AddRatedBookAsync(userId, request.BookId, request.RatingId);
                
                if (success)
                    return Ok(new { message = "Rated book record added" });
                else
                    return BadRequest(new { message = "Failed to add rated book record" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding rated book record", ex);
                return StatusCode(500, new { message = "An error occurred while adding rated book record" });
            }
        }

        [HttpGet("has-rated/{bookId}")]
        public async Task<IActionResult> HasUserRatedBook(int bookId)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var hasRated = await _ratedBookService.HasUserRatedBookAsync(userId, bookId);
                return Ok(new { hasRated = hasRated });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error checking if user has rated book", ex);
                return StatusCode(500, new { message = "An error occurred while checking if user has rated book" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> ClearRatedBooks()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _ratedBookService.ClearRatedBooksForUserAsync(userId);
                
                if (success)
                    return Ok(new { message = "Rated books cleared" });
                else
                    return BadRequest(new { message = "Failed to clear rated books" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing rated books", ex);
                return StatusCode(500, new { message = "An error occurred while clearing rated books" });
            }
        }
    }

    public class AddRatedBookRequest
    {
        public int BookId { get; set; }
        public int RatingId { get; set; }
    }
}
