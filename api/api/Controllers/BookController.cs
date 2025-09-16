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

        public BookController(BookService bookService)
        {
            _bookService = bookService;
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
    }
}
