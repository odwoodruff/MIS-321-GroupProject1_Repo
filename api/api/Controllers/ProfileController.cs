using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using api.Services;
using api.Models;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly UserStatisticsService _statisticsService;
        private readonly SupportTicketService _supportTicketService;
        private readonly UserService _userService;
        private readonly JwtService _jwtService;
        private readonly ILogger<ProfileController> _logger;

        public ProfileController(
            UserStatisticsService statisticsService,
            SupportTicketService supportTicketService,
            UserService userService,
            JwtService jwtService,
            ILogger<ProfileController> logger)
        {
            _statisticsService = statisticsService;
            _supportTicketService = supportTicketService;
            _userService = userService;
            _jwtService = jwtService;
            _logger = logger;
        }

        [HttpGet("statistics")]
        public async Task<ActionResult<UserStatistics>> GetUserStatistics()
        {
            try
            {
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                var user = await _userService.GetUserByEmailAsync(userEmail);
                if (user == null)
                    return NotFound("User not found");

                var statistics = await _statisticsService.GetUserStatisticsAsync(user.Id);
                return Ok(statistics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user statistics");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("support-ticket")]
        public async Task<ActionResult<SupportTicket>> CreateSupportTicket([FromBody] CreateSupportTicketRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.Message))
                {
                    return BadRequest("Subject and message are required");
                }

                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                var user = await _userService.GetUserByEmailAsync(userEmail);
                if (user == null)
                    return NotFound("User not found");

                var ticket = await _supportTicketService.CreateSupportTicketAsync(user.Id, request.Subject, request.Message);
                return Ok(ticket);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating support ticket");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("support-tickets")]
        public async Task<ActionResult<List<SupportTicket>>> GetUserSupportTickets()
        {
            try
            {
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                var user = await _userService.GetUserByEmailAsync(userEmail);
                if (user == null)
                    return NotFound("User not found");

                var tickets = await _supportTicketService.GetUserSupportTicketsAsync(user.Id);
                return Ok(tickets);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user support tickets");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("support-ticket-subjects")]
        public ActionResult<List<string>> GetSupportTicketSubjects()
        {
            return Ok(SupportTicketService.GetSupportTicketSubjects());
        }

        [HttpDelete("account")]
        public async Task<ActionResult> DeleteAccount()
        {
            try
            {
                var userEmail = _jwtService.GetUserEmailFromToken(User);
                if (string.IsNullOrEmpty(userEmail))
                    return Unauthorized("Invalid token");

                var user = await _userService.GetUserByEmailAsync(userEmail);
                if (user == null)
                    return NotFound("User not found");

                // Soft delete user and all related data
                await _userService.SoftDeleteUserAsync(user.Id);

                _logger.LogInformation("User account soft deleted: {UserEmail}", userEmail);
                return Ok(new { message = "Account deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user account");
                return StatusCode(500, "Internal server error");
            }
        }
    }

    public class CreateSupportTicketRequest
    {
        public string Subject { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
