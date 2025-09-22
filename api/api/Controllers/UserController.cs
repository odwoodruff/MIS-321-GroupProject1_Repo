using api.Models;
using api.Services;
using api.Constants;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserService _userService;

        public UserController(UserService userService)
        {
            _userService = userService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || 
                string.IsNullOrEmpty(request.Email) ||
                string.IsNullOrEmpty(request.FirstName) ||
                string.IsNullOrEmpty(request.LastName))
            {
                return BadRequest(new { message = "All fields are required" });
            }

            var user = await _userService.RegisterAsync(request.Username, request.Email, request.FirstName, request.LastName).ConfigureAwait(false);
            
            if (user == null)
            {
                return BadRequest(new { message = "Username or email already exists" });
            }

            return Ok(new { 
                message = "User registered successfully",
                user = new {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    dateCreated = user.DateCreated
                }
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            var user = await _userService.LoginAsync(request.Email).ConfigureAwait(false);
            
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email" });
            }

            return Ok(new { 
                message = "Login successful",
                user = new {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    dateCreated = user.DateCreated
                }
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userService.GetUserAsync(id).ConfigureAwait(false);
            
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new {
                id = user.Id,
                username = user.Username,
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                dateCreated = user.DateCreated
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            if (string.IsNullOrEmpty(request.FirstName) || 
                string.IsNullOrEmpty(request.LastName) || 
                string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "All fields are required" });
            }

            var success = await _userService.UpdateUserAsync(id, request.FirstName, request.LastName, request.Email).ConfigureAwait(false);
            
            if (!success)
            {
                return BadRequest(new { message = "User not found or email already exists" });
            }

            return Ok(new { message = "User updated successfully" });
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeactivateUser(int id)
        {
            var success = await _userService.DeactivateUserAsync(id).ConfigureAwait(false);
            
            if (!success)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new { message = "User deactivated successfully" });
        }
    }

    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

}
