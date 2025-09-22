using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using api.Services;
using api.Models;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly UserService _userService;
        private readonly RateLimitingService _rateLimitingService;
        private readonly LoggingService _loggingService;
        private readonly AdminService _adminService;
        private readonly JwtService _jwtService;

        public AdminController(UserService userService, RateLimitingService rateLimitingService, 
            LoggingService loggingService, AdminService adminService, JwtService jwtService)
        {
            _userService = userService;
            _rateLimitingService = rateLimitingService;
            _loggingService = loggingService;
            _adminService = adminService;
            _jwtService = jwtService;
        }

        // GET: api/Admin/user-by-username/{username}
        [HttpGet("user-by-username/{username}")]
        public async Task<IActionResult> GetUserByUsername(string username)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var user = await _userService.GetUserByUsernameAsync(username);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _loggingService.LogUserAction("AdminUserLookup", user.Id.ToString(), 
                    $"Admin {userEmail} looked up user by username: {username}");

                return Ok(new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    dateCreated = user.DateCreated,
                    isActive = user.IsActive,
                    averageRating = user.AverageRating,
                    ratingCount = user.RatingCount
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error getting user by username", ex);
                return StatusCode(500, new { message = "An error occurred while getting user" });
            }
        }

        // GET: api/Admin/rate-limit-status/{identifier}
        [HttpGet("rate-limit-status/{identifier}")]
        public IActionResult GetRateLimitStatus(string identifier)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var isLimited = _rateLimitingService.IsRateLimited(identifier);
                var remainingRequests = _rateLimitingService.GetRemainingRequests(identifier);

                _loggingService.LogUserAction("AdminRateLimitCheck", null, 
                    $"Admin {userEmail} checked rate limit status for: {identifier}");

                return Ok(new
                {
                    identifier = identifier,
                    isRateLimited = isLimited,
                    remainingRequests = remainingRequests
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error getting rate limit status", ex);
                return StatusCode(500, new { message = "An error occurred while checking rate limit" });
            }
        }

        // POST: api/Admin/reset-rate-limit
        [HttpPost("reset-rate-limit")]
        public IActionResult ResetRateLimit([FromBody] ResetRateLimitRequest request)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                _rateLimitingService.ResetRateLimit(request.Identifier, request.ActionType);

                _loggingService.LogUserAction("AdminRateLimitReset", null, 
                    $"Admin {userEmail} reset rate limit for: {request.Identifier}");

                return Ok(new { message = "Rate limit reset successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error resetting rate limit", ex);
                return StatusCode(500, new { message = "An error occurred while resetting rate limit" });
            }
        }

        // GET: api/Admin/users
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var users = await _userService.GetAllUsersAsync();
                var userList = users.Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    email = u.Email,
                    firstName = u.FirstName,
                    lastName = u.LastName,
                    dateCreated = u.DateCreated,
                    isActive = u.IsActive,
                    averageRating = u.AverageRating,
                    ratingCount = u.RatingCount
                }).ToList();

                _loggingService.LogUserAction("AdminUsersList", null, 
                    $"Admin {userEmail} requested all users list - {users.Count} users returned");

                return Ok(new { 
                    users = userList,
                    totalCount = users.Count
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error getting all users", ex);
                return StatusCode(500, new { message = "An error occurred while getting users" });
            }
        }
    }

    public class ResetRateLimitRequest
    {
        public string Identifier { get; set; } = string.Empty;
        public string ActionType { get; set; } = "general";
    }
}
