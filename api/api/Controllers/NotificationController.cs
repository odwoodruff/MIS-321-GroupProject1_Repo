using api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;
        private readonly LoggingService _loggingService;
        private readonly JwtService _jwtService;

        public NotificationController(NotificationService notificationService, LoggingService loggingService, JwtService jwtService)
        {
            _notificationService = notificationService;
            _loggingService = loggingService;
            _jwtService = jwtService;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                Console.WriteLine($"NotificationController: Extracted user ID: {userId}");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var notifications = await _notificationService.GetNotificationsForUserAsync(userId);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving notifications", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving notifications" });
            }
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var count = await _notificationService.GetUnreadCountAsync(userId);
                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving unread notification count", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving unread count" });
            }
        }

        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _notificationService.MarkAsReadAsync(id, userId);
                
                if (success)
                    return Ok(new { message = "Notification marked as read" });
                else
                    return NotFound(new { message = "Notification not found" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error marking notification as read", ex);
                return StatusCode(500, new { message = "An error occurred while marking notification as read" });
            }
        }

        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _notificationService.MarkAllAsReadAsync(userId);
                
                if (success)
                    return Ok(new { message = "All notifications marked as read" });
                else
                    return BadRequest(new { message = "Failed to mark all notifications as read" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error marking all notifications as read", ex);
                return StatusCode(500, new { message = "An error occurred while marking all notifications as read" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var notification = await _notificationService.CreateNotificationAsync(
                    request.UserId, 
                    request.Message, 
                    request.Type, 
                    request.RelatedBookId, 
                    request.RelatedUserId
                );
                
                return CreatedAtAction(nameof(GetNotifications), new { id = notification.Id }, notification);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating notification", ex);
                return StatusCode(500, new { message = "An error occurred while creating notification" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _notificationService.DeleteNotificationAsync(id, userId);
                
                if (success)
                    return Ok(new { message = "Notification deleted" });
                else
                    return NotFound(new { message = "Notification not found" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error deleting notification", ex);
                return StatusCode(500, new { message = "An error occurred while deleting notification" });
            }
        }
    }

    public class CreateNotificationRequest
    {
        public int UserId { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? RelatedBookId { get; set; }
        public int? RelatedUserId { get; set; }
    }
}
