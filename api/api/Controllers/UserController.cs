using api.Models;
using api.Services;
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
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Username) || 
                string.IsNullOrEmpty(request.Email) || 
                string.IsNullOrEmpty(request.Password) ||
                string.IsNullOrEmpty(request.FirstName) ||
                string.IsNullOrEmpty(request.LastName))
            {
                return BadRequest(new { message = "All fields are required" });
            }

            if (request.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters long" });
            }

            var user = _userService.Register(request.Username, request.Email, request.Password, request.FirstName, request.LastName);
            
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
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrEmpty(request.UsernameOrEmail) || string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new { message = "Username/email and password are required" });
            }

            var user = _userService.Login(request.UsernameOrEmail, request.Password);
            
            if (user == null)
            {
                return Unauthorized(new { message = "Invalid username/email or password" });
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
        public IActionResult GetUser(int id)
        {
            var user = _userService.GetUser(id);
            
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
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            if (string.IsNullOrEmpty(request.FirstName) || 
                string.IsNullOrEmpty(request.LastName) || 
                string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "All fields are required" });
            }

            var success = _userService.UpdateUser(id, request.FirstName, request.LastName, request.Email);
            
            if (!success)
            {
                return BadRequest(new { message = "User not found or email already exists" });
            }

            return Ok(new { message = "User updated successfully" });
        }

        [HttpPut("{id}/change-password")]
        public IActionResult ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.CurrentPassword) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest(new { message = "Current password and new password are required" });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "New password must be at least 6 characters long" });
            }

            var success = _userService.ChangePassword(id, request.CurrentPassword, request.NewPassword);
            
            if (!success)
            {
                return BadRequest(new { message = "Invalid current password or user not found" });
            }

            return Ok(new { message = "Password changed successfully" });
        }

        [HttpDelete("{id}")]
        public IActionResult DeactivateUser(int id)
        {
            var success = _userService.DeactivateUser(id);
            
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
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string UsernameOrEmail { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}
