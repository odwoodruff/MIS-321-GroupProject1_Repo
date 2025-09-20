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
        private readonly ValidationService _validationService;
        private readonly LoggingService _loggingService;

        public BookController(BookService bookService, RatingService ratingService, 
            ValidationService validationService, LoggingService loggingService)
        {
            _bookService = bookService;
            _ratingService = ratingService;
            _validationService = validationService;
            _loggingService = loggingService;
        }

        // GET: api/Book
        [HttpGet]
        public ActionResult<List<Book>> GetBooks([FromQuery] string? search = null)
        {
            try
            {
                if (!string.IsNullOrEmpty(search))
                {
                    // Validate search term
                    if (!ValidationService.IsValidSearchTerm(search))
                    {
                        _loggingService.LogSecurityEvent("InputValidation", 
                            $"Invalid search term attempted: {search}", null, GetClientIpAddress());
                        return BadRequest("Invalid search term");
                    }

                    var sanitizedSearch = ValidationService.SanitizeSearchTerm(search);
                    return Ok(_bookService.SearchBooks(sanitizedSearch));
                }
                return Ok(_bookService.GetBooks());
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving books", ex);
                return StatusCode(500, "An error occurred while retrieving books");
            }
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
            try
            {
                if (book == null)
                {
                    _loggingService.LogSecurityEvent("InputValidation", "Null book object provided", null, GetClientIpAddress());
                    return BadRequest("Book data is required");
                }

                // Validate book data
                var validationErrors = ValidateBook(book);
                if (validationErrors.Any())
                {
                    _loggingService.LogSecurityEvent("InputValidation", 
                        $"Invalid book data: {string.Join(", ", validationErrors)}", null, GetClientIpAddress());
                    return BadRequest($"Validation errors: {string.Join(", ", validationErrors)}");
                }

                // Sanitize input
                book.Title = ValidationService.SanitizeInput(book.Title);
                book.Author = ValidationService.SanitizeInput(book.Author);
                book.Description = ValidationService.SanitizeInput(book.Description);
                book.SellerName = ValidationService.SanitizeInput(book.SellerName);

                var createdBook = _bookService.CreateBook(book);
                _loggingService.LogUserAction("BookCreated", null, $"Book '{book.Title}' created");
                
                return CreatedAtAction(nameof(GetBook), new { id = createdBook.Id }, createdBook);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating book", ex);
                return StatusCode(500, "An error occurred while creating the book");
            }
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

        private List<string> ValidateBook(Book book)
        {
            var errors = new List<string>();

            if (!ValidationService.IsValidBookTitle(book.Title))
                errors.Add("Invalid title");

            if (!ValidationService.IsValidBookAuthor(book.Author))
                errors.Add("Invalid author");

            if (!ValidationService.IsValidPrice(book.Price))
                errors.Add("Invalid price");

            if (!ValidationService.IsValidYear(book.Year))
                errors.Add("Invalid year");

            if (!ValidationService.IsValidEmail(book.SellerEmail))
                errors.Add("Invalid seller email");

            if (!ValidationService.IsValidName(book.SellerName))
                errors.Add("Invalid seller name");

            if (!string.IsNullOrEmpty(book.Description) && book.Description.Length > 1000)
                errors.Add("Description too long");

            return errors;
        }

        private string GetClientIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
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
