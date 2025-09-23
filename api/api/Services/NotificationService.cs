using api.Data;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class NotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly LoggingService _loggingService;

        public NotificationService(ApplicationDbContext context, LoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<List<Notification>> GetNotificationsForUserAsync(int userId)
        {
            try
            {
                return await _context.Notifications
                    .Where(n => n.UserId == userId && n.IsActive)
                    .OrderByDescending(n => n.DateCreated)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving notifications for user", ex);
                return new List<Notification>();
            }
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            try
            {
                return await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead && n.IsActive);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving unread notification count", ex);
                return 0;
            }
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

                if (notification != null)
                {
                    notification.IsRead = true;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error marking notification as read", ex);
                return false;
            }
        }

        public async Task<bool> MarkAllAsReadAsync(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead && n.IsActive)
                    .ToListAsync();

                foreach (var notification in notifications)
                {
                    notification.IsRead = true;
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error marking all notifications as read", ex);
                return false;
            }
        }

        public async Task<Notification> CreateNotificationAsync(int userId, string message, string type, int? relatedBookId = null, int? relatedUserId = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Message = message,
                    Type = type,
                    DateCreated = DateTime.UtcNow,
                    IsRead = false,
                    IsActive = true,
                    RelatedBookId = relatedBookId,
                    RelatedUserId = relatedUserId
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                return notification;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating notification", ex);
                throw;
            }
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId, int userId)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

                if (notification != null)
                {
                    notification.IsActive = false;
                    await _context.SaveChangesAsync();
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error deleting notification", ex);
                return false;
            }
        }
    }
}
