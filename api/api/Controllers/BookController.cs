using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using api.Models;
using api.Services;
using api.Constants;

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
        private readonly EmailVerificationService _emailVerificationService;
        private readonly JwtService _jwtService;
        private readonly AdminService _adminService;

        public BookController(BookService bookService, RatingService ratingService, 
            ValidationService validationService, LoggingService loggingService,
            EmailVerificationService emailVerificationService, JwtService jwtService,
            AdminService adminService)
        {
            _bookService = bookService;
            _ratingService = ratingService;
            _validationService = validationService;
            _loggingService = loggingService;
            _emailVerificationService = emailVerificationService;
            _jwtService = jwtService;
            _adminService = adminService;
        }

        // GET: api/Book
        [HttpGet]
        public async Task<ActionResult<List<Book>>> GetBooks([FromQuery] string? search = null)
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
                    return Ok(await _bookService.SearchBooksAsync(sanitizedSearch).ConfigureAwait(false));
                }
                return Ok(await _bookService.GetBooksAsync().ConfigureAwait(false));
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving books", ex);
                return StatusCode(500, "An error occurred while retrieving books");
            }
        }

        // GET: api/Book/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Book>> GetBook(int id)
        {
            var book = await _bookService.GetBookAsync(id).ConfigureAwait(false);
            
            if (book == null)
                return NotFound();
                
            return Ok(book);
        }

        // POST: api/Book
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Book>> CreateBook([FromBody] CreateBookRequest request)
        {
            try
            {
                if (request == null || request.Book == null)
                {
                    _loggingService.LogSecurityEvent("InputValidation", "Null book object provided", null, GetClientIpAddress());
                    return BadRequest("Book data is required");
                }

                // Get current user from JWT token
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                var book = request.Book;

                // Validate book data
                var validationErrors = ValidateBook(book);
                if (validationErrors.Any())
                {
                    _loggingService.LogSecurityEvent("InputValidation", 
                        $"Invalid book data: {string.Join(", ", validationErrors)}", null, GetClientIpAddress());
                    return BadRequest($"Validation errors: {string.Join(", ", validationErrors)}");
                }

                // Ensure the seller email matches the authenticated user
                book.SellerEmail = userEmail;

                // Sanitize input
                book.Title = ValidationService.SanitizeInput(book.Title);
                book.Author = ValidationService.SanitizeInput(book.Author);
                book.Description = ValidationService.SanitizeInput(book.Description);
                book.SellerName = ValidationService.SanitizeInput(book.SellerName);

                var createdBook = await _bookService.CreateBookAsync(book).ConfigureAwait(false);
                _loggingService.LogUserAction("BookCreated", null, $"Book '{book.Title}' created by {userEmail}");
                
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
        [Authorize]
        public async Task<IActionResult> UpdateBook(int id, [FromBody] Book book)
        {
            try
            {
                if (book == null || string.IsNullOrEmpty(book.Title) || string.IsNullOrEmpty(book.Author))
                    return BadRequest("Title and Author are required");

                // Get current user from JWT token
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                // Get the existing book to check ownership
                var existingBook = await _bookService.GetBookAsync(id).ConfigureAwait(false);
                if (existingBook == null)
                    return NotFound();

                // Check if user owns the book or is admin
                if (existingBook.SellerEmail != userEmail && !_adminService.IsAdminUser(userEmail))
                {
                    _loggingService.LogSecurityEvent("UnauthorizedAccess", 
                        $"User {userEmail} attempted to update book {id} owned by {existingBook.SellerEmail}", 
                        null, GetClientIpAddress());
                    return Unauthorized("You can only update your own books");
                }

                // Ensure the seller email matches the authenticated user (unless admin)
                if (!_adminService.IsAdminUser(userEmail))
                {
                    book.SellerEmail = userEmail;
                }
                else
                {
                    // For admin users, preserve the original seller email
                    book.SellerEmail = existingBook.SellerEmail;
                }

                // Log the update attempt
                _loggingService.LogUserAction("BookUpdateAttempt", null, 
                    $"Admin {userEmail} attempting to update book {id}. New price: {book.Price}, Original price: {existingBook.Price}");

                if (!await _bookService.UpdateBookAsync(id, book).ConfigureAwait(false))
                    return NotFound();
                
                _loggingService.LogUserAction("BookUpdated", null, $"Book {id} updated by {userEmail}. New price: {book.Price}");
                return NoContent();
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error updating book", ex);
                return StatusCode(500, "An error occurred while updating the book");
            }
        }

        // DELETE: api/Book/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteBook(int id)
        {
            try
            {
                // Get current user from JWT token
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                // Get the existing book to check ownership
                var existingBook = await _bookService.GetBookAsync(id).ConfigureAwait(false);
                if (existingBook == null)
                    return NotFound();

                // Check if user owns the book or is admin
                if (existingBook.SellerEmail != userEmail && !_adminService.IsAdminUser(userEmail))
                {
                    _loggingService.LogSecurityEvent("UnauthorizedAccess", 
                        $"User {userEmail} attempted to delete book {id} owned by {existingBook.SellerEmail}", 
                        null, GetClientIpAddress());
                    return Unauthorized("You can only delete your own books");
                }

                if (!await _bookService.DeleteBookAsync(id).ConfigureAwait(false))
                    return NotFound();
                
                _loggingService.LogUserAction("BookDeleted", null, $"Book {id} deleted by {userEmail}");
                return NoContent();
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error deleting book", ex);
                return StatusCode(500, "An error occurred while deleting the book");
            }
        }

        // POST: api/Book/rate
        [HttpPost("rate")]
        [Authorize]
        public async Task<ActionResult<Rating>> RateUser([FromBody] RateUserRequest request)
        {
            try
            {
            if (request == null || request.RatedUserId <= 0 || request.BookId <= 0)
                return BadRequest("Invalid rating request");

            // Validate rating score
            if (request.Score < ValidationConstants.MinRating || request.Score > ValidationConstants.MaxRating)
                return BadRequest($"Rating score must be between {ValidationConstants.MinRating} and {ValidationConstants.MaxRating}");

                // Get current user from JWT token
                var raterId = _jwtService.GetUserIdFromToken(User);
                if (raterId <= 0)
                    return Unauthorized("Invalid token");

                // Debug logging
                _loggingService.LogUserAction("RatingAttempt", raterId.ToString(), 
                    $"Attempting to rate: RaterId={raterId}, RatedUserId={request.RatedUserId}, BookId={request.BookId}, Score={request.Score}");

                var rating = await _ratingService.CreateRatingAsync(
                    raterId, 
                    request.RatedUserId, 
                    request.BookId, 
                    request.Score, 
                    request.Comment ?? ""
                ).ConfigureAwait(false);

                if (rating == null)
                {
                    _loggingService.LogUserAction("RatingFailed", raterId.ToString(), 
                        $"Rating failed: RaterId={raterId}, RatedUserId={request.RatedUserId}, BookId={request.BookId}, Score={request.Score}");
                    return BadRequest("Unable to create rating. User may have already rated this person for this book.");
                }

                _loggingService.LogUserAction("RatingCreated", raterId.ToString(), 
                    $"User {raterId} rated user {request.RatedUserId} for book {request.BookId}");
                return Ok(rating);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating rating", ex);
                return StatusCode(500, "An error occurred while creating the rating");
            }
        }

        // GET: api/Book/ratings/my-ratings
        [HttpGet("ratings/my-ratings")]
        [Authorize]
        public async Task<ActionResult<List<Rating>>> GetMyRatings()
        {
            var userId = _jwtService.GetUserIdFromToken(User);
            if (userId <= 0)
                return Unauthorized("Invalid token");

            var ratings = await _ratingService.GetRatingsForUserAsync(userId).ConfigureAwait(false);
            return Ok(ratings);
        }

        // GET: api/Book/ratings/ratings-for-me
        [HttpGet("ratings/ratings-for-me")]
        [Authorize]
        public async Task<ActionResult<List<Rating>>> GetRatingsForMe()
        {
            var userId = _jwtService.GetUserIdFromToken(User);
            if (userId <= 0)
                return Unauthorized("Invalid token");

            var ratings = await _ratingService.GetRatingsByUserAsync(userId).ConfigureAwait(false);
            return Ok(ratings);
        }

        // PUT: api/Book/ratings/{id}
        [HttpPut("ratings/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateRating(int id, [FromBody] UpdateRatingRequest request)
        {
            if (request == null || request.Score < ValidationConstants.MinRating || request.Score > ValidationConstants.MaxRating)
                return BadRequest($"Rating score must be between {ValidationConstants.MinRating} and {ValidationConstants.MaxRating}");

            if (!await _ratingService.UpdateRatingAsync(id, request.Score, request.Comment ?? "").ConfigureAwait(false))
                return NotFound();

            return NoContent();
        }

        // DELETE: api/Book/ratings/{id}
        [HttpDelete("ratings/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteRating(int id)
        {
            if (!await _ratingService.DeleteRatingAsync(id).ConfigureAwait(false))
                return NotFound();

            return NoContent();
        }


        // GET: api/Book/ratings/all (Admin only)
        [HttpGet("ratings/all")]
        public async Task<ActionResult<List<Rating>>> GetAllRatings()
        {
            var allRatings = await _ratingService.GetAllRatingsAsync().ConfigureAwait(false);
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

            if (!string.IsNullOrEmpty(book.Description) && book.Description.Length > ValidationConstants.MaxBookDescriptionLength)
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

    public class CreateBookRequest
    {
        public Book Book { get; set; } = new Book();
    }
}
