using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using api.Models;
using api.Services;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly BookService _bookService;
        private readonly RatingService _ratingService;

        public BookController(BookService bookService, RatingService ratingService)
        {
            _bookService = bookService;
            _ratingService = ratingService;
        }

        // GET: api/Book
        [HttpGet]
        public ActionResult<List<Book>> GetBooks([FromQuery] string? search = null)
        {
            if (!string.IsNullOrEmpty(search))
            {
                return Ok(_bookService.SearchBooks(search));
            }
            return Ok(_bookService.GetBooks());
        }

        // GET: api/Book/5
        [HttpGet("{id}")]
        public ActionResult<Book> GetBook(int id)
        {
            var book = _bookService.GetBook(id);
            
            if (book == null)
                return NotFound();
                
            return Ok(book);
        }

        // POST: api/Book
        [HttpPost]
        public ActionResult<Book> CreateBook([FromBody] Book book)
        {
            if (book == null || string.IsNullOrEmpty(book.Title) || string.IsNullOrEmpty(book.Author))
                return BadRequest("Title and Author are required");

            var createdBook = _bookService.CreateBook(book);
            
            return CreatedAtAction(nameof(GetBook), new { id = createdBook.Id }, createdBook);
        }

        // PUT: api/Book/5
        [HttpPut("{id}")]
        public IActionResult UpdateBook(int id, [FromBody] Book book)
        {
            if (book == null || string.IsNullOrEmpty(book.Title) || string.IsNullOrEmpty(book.Author))
                return BadRequest("Title and Author are required");

            if (!_bookService.UpdateBook(id, book))
                return NotFound();
            
            return NoContent();
        }

        // DELETE: api/Book/5
        [HttpDelete("{id}")]
        public IActionResult DeleteBook(int id)
        {
            if (!_bookService.DeleteBook(id))
                return NotFound();
            
            return NoContent();
        }

        // POST: api/Book/rate
        [HttpPost("rate")]
        public ActionResult<Rating> RateUser([FromBody] RateUserRequest request)
        {
            if (request == null || request.RaterId <= 0 || request.RatedUserId <= 0 || request.BookId <= 0)
                return BadRequest("Invalid rating request");

            var rating = _ratingService.CreateRating(
                request.RaterId, 
                request.RatedUserId, 
                request.BookId, 
                request.Score, 
                request.Comment ?? ""
            );

            if (rating == null)
                return BadRequest("Unable to create rating. User may have already rated this person for this book.");

            return Ok(rating);
        }

        // GET: api/Book/ratings/user/{userId}
        [HttpGet("ratings/user/{userId}")]
        public ActionResult<List<Rating>> GetUserRatings(int userId)
        {
            var ratings = _ratingService.GetRatingsForUser(userId);
            return Ok(ratings);
        }

        // GET: api/Book/ratings/by/{userId}
        [HttpGet("ratings/by/{userId}")]
        public ActionResult<List<Rating>> GetRatingsByUser(int userId)
        {
            var ratings = _ratingService.GetRatingsByUser(userId);
            return Ok(ratings);
        }

        // PUT: api/Book/ratings/{id}
        [HttpPut("ratings/{id}")]
        public IActionResult UpdateRating(int id, [FromBody] UpdateRatingRequest request)
        {
            if (request == null || request.Score < 1 || request.Score > 5)
                return BadRequest("Invalid rating update request");

            if (!_ratingService.UpdateRating(id, request.Score, request.Comment ?? ""))
                return NotFound();

            return NoContent();
        }

        // DELETE: api/Book/ratings/{id}
        [HttpDelete("ratings/{id}")]
        public IActionResult DeleteRating(int id)
        {
            if (!_ratingService.DeleteRating(id))
                return NotFound();

            return NoContent();
        }

        // GET: api/Book/ratings/all (Admin only)
        [HttpGet("ratings/all")]
        public ActionResult<List<Rating>> GetAllRatings()
        {
            var allRatings = _ratingService.GetAllRatings();
            return Ok(allRatings);
        }
    }

    public class RateUserRequest
    {
        public int RaterId { get; set; }
        public int RatedUserId { get; set; }
        public int BookId { get; set; }
        public int Score { get; set; }
        public string? Comment { get; set; }
    }

    public class UpdateRatingRequest
    {
        public int Score { get; set; }
        public string? Comment { get; set; }
    }
}
