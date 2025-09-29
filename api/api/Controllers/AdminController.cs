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
        private readonly SupportTicketService _supportTicketService;

        public AdminController(UserService userService, RateLimitingService rateLimitingService, 
            LoggingService loggingService, AdminService adminService, JwtService jwtService, SupportTicketService supportTicketService)
        {
            _userService = userService;
            _rateLimitingService = rateLimitingService;
            _loggingService = loggingService;
            _adminService = adminService;
            _jwtService = jwtService;
            _supportTicketService = supportTicketService;
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

        // GET: api/Admin/user-by-email/{email}
        [HttpGet("user-by-email/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var user = await _userService.GetUserByEmailAsync(email);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _loggingService.LogUserAction("AdminUserLookup", user.Id.ToString(), 
                    $"Admin {userEmail} looked up user by email: {email}");

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
                _loggingService.LogError("Error getting user by email", ex);
                return StatusCode(500, new { message = "An error occurred while getting user" });
            }
        }

        // GET: api/Admin/search-users-by-username/{username}
        [HttpGet("search-users-by-username/{username}")]
        public async Task<IActionResult> SearchUsersByUsername(string username)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var users = await _userService.SearchUsersByUsernameAsync(username);
                
                _loggingService.LogUserAction("AdminUserSearch", "0", 
                    $"Admin {userEmail} searched users by username: {username}");

                var result = users.Select(user => new
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
                }).ToList();

                return Ok(new { users = result, totalCount = result.Count });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error searching users by username", ex);
                return StatusCode(500, new { message = "An error occurred while searching users" });
            }
        }

        // GET: api/Admin/search-users-by-email/{email}
        [HttpGet("search-users-by-email/{email}")]
        public async Task<IActionResult> SearchUsersByEmail(string email)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var users = await _userService.SearchUsersByEmailAsync(email);
                
                _loggingService.LogUserAction("AdminUserSearch", "0", 
                    $"Admin {userEmail} searched users by email: {email}");

                var result = users.Select(user => new
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
                }).ToList();

                return Ok(new { users = result, totalCount = result.Count });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error searching users by email", ex);
                return StatusCode(500, new { message = "An error occurred while searching users" });
            }
        }

        // GET: api/Admin/user-by-id/{id}
        [HttpGet("user-by-id/{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var user = await _userService.GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                _loggingService.LogUserAction("AdminUserLookup", user.Id.ToString(), 
                    $"Admin {userEmail} looked up user by ID: {id}");

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
                _loggingService.LogError("Error getting user by ID", ex);
                return StatusCode(500, new { message = "An error occurred while getting user" });
            }
        }

        // GET: api/Admin/search-users-by-id/{idPrefix}
        [HttpGet("search-users-by-id/{idPrefix}")]
        public async Task<IActionResult> SearchUsersById(string idPrefix)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var users = await _userService.SearchUsersByIdAsync(idPrefix);
                
                _loggingService.LogUserAction("AdminUserSearch", "0", 
                    $"Admin {userEmail} searched users by ID prefix: {idPrefix}");

                var result = users.Select(user => new
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
                }).ToList();

                return Ok(new { users = result, totalCount = result.Count });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error searching users by ID", ex);
                return StatusCode(500, new { message = "An error occurred while searching users" });
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

        // PUT: api/Admin/update-user/{id}
        [HttpPut("update-user/{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var success = await _userService.UpdateUserAsync(id, request.Username, request.Email, request.FirstName, request.LastName);
                if (!success)
                {
                    return NotFound(new { message = "User not found" });
                }

                _loggingService.LogUserAction("AdminUserUpdate", id.ToString(), 
                    $"Admin {userEmail} updated user {id}");

                return Ok(new { message = "User updated successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error updating user", ex);
                return StatusCode(500, new { message = "An error occurred while updating user" });
            }
        }

        // PUT: api/Admin/clear-user-name/{id}
        [HttpPut("clear-user-name/{id}")]
        [Authorize]
        public async Task<IActionResult> ClearUserName(int id)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var success = await _userService.ClearUserNameAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "User not found" });
                }

                _loggingService.LogUserAction("AdminClearUserName", id.ToString(), 
                    $"Admin {userEmail} cleared name for user {id}");

                return Ok(new { message = "User name cleared successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing user name", ex);
                return StatusCode(500, new { message = "An error occurred while clearing user name" });
            }
        }

        // DELETE: api/Admin/delete-user/{id}
        [HttpDelete("delete-user/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var success = await _userService.SoftDeleteUserAsync(id);
                if (!success)
                {
                    return NotFound(new { message = "User not found" });
                }

                _loggingService.LogUserAction("AdminUserDelete", id.ToString(), 
                    $"Admin {userEmail} soft deleted user {id}");

                return Ok(new { message = "User deleted successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error deleting user", ex);
                return StatusCode(500, new { message = "An error occurred while deleting user" });
            }
        }

        // GET: api/Admin/support-tickets
        [HttpGet("support-tickets")]
        public async Task<IActionResult> GetAllSupportTickets()
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var tickets = await _supportTicketService.GetAllSupportTicketsAsync();
                
                _loggingService.LogUserAction("AdminSupportTicketsView", null, 
                    $"Admin {userEmail} viewed all support tickets - Found {tickets.Count} tickets");

                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error getting support tickets", ex);
                return StatusCode(500, new { message = "An error occurred while getting support tickets" });
            }
        }

        // GET: api/Admin/support-ticket/{id}
        [HttpGet("support-ticket/{id}")]
        public async Task<IActionResult> GetSupportTicket(int id)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var ticket = await _supportTicketService.GetSupportTicketByIdAsync(id);
                if (ticket == null)
                {
                    return NotFound(new { message = "Support ticket not found" });
                }

                _loggingService.LogUserAction("AdminSupportTicketView", id.ToString(), 
                    $"Admin {userEmail} viewed support ticket {id}");

                return Ok(ticket);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error getting support ticket", ex);
                return StatusCode(500, new { message = "An error occurred while getting support ticket" });
            }
        }

        // PUT: api/Admin/support-ticket/{id}/update
        [HttpPut("support-ticket/{id}/update")]
        public async Task<IActionResult> UpdateSupportTicket(int id, [FromBody] UpdateSupportTicketRequest request)
        {
            try
            {
                // Check if current user is admin
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail) || !_adminService.IsAdminUser(userEmail))
                {
                    return Unauthorized(new { message = "Admin access required" });
                }

                var success = await _supportTicketService.UpdateSupportTicketAsync(id, request.Status, request.AdminResponse);
                if (!success)
                {
                    return NotFound(new { message = "Support ticket not found" });
                }

                _loggingService.LogUserAction("AdminSupportTicketUpdate", id.ToString(), 
                    $"Admin {userEmail} updated support ticket {id} - Status: {request.Status}");

                return Ok(new { message = "Support ticket updated successfully" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error updating support ticket", ex);
                return StatusCode(500, new { message = "An error occurred while updating support ticket" });
            }
        }
    }

    public class ResetRateLimitRequest
    {
        public string Identifier { get; set; } = string.Empty;
        public string ActionType { get; set; } = "general";
    }

    public class UpdateSupportTicketRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? AdminResponse { get; set; }
    }

}
