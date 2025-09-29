using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Services
{
    public class SupportTicketService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SupportTicketService> _logger;

        public SupportTicketService(ApplicationDbContext context, ILogger<SupportTicketService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<SupportTicket> CreateSupportTicketAsync(int userId, string subject, string message)
        {
            try
            {
                var ticket = new SupportTicket
                {
                    UserId = userId,
                    Subject = subject,
                    Message = message,
                    Status = "Open",
                    DateCreated = DateTime.UtcNow,
                    IsActive = true
                };

                _context.SupportTickets.Add(ticket);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Support ticket created for user {UserId} with subject: {Subject}", userId, subject);
                return ticket;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating support ticket for user {UserId}", userId);
                throw;
            }
        }

        public async Task<List<SupportTicket>> GetUserSupportTicketsAsync(int userId)
        {
            try
            {
                
                return await _context.SupportTickets
                    .Where(t => t.UserId == userId && t.IsActive)
                    .OrderByDescending(t => t.DateCreated)
                    .ToListAsync();
                
                return new List<SupportTicket>(); // Temporary placeholder
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting support tickets for user {UserId}", userId);
                throw;
            }
        }

        public async Task<SupportTicket?> GetSupportTicketAsync(int ticketId, int userId)
        {
            try
            {
                
                return await _context.SupportTickets
                    .FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId && t.IsActive);
                
                return null; // Temporary placeholder
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting support ticket {TicketId} for user {UserId}", ticketId, userId);
                throw;
            }
        }

        public async Task<List<SupportTicket>> GetAllSupportTicketsAsync()
        {
            try
            {
                var tickets = await _context.SupportTickets
                    .Where(t => t.IsActive)
                    .Include(t => t.User)
                    .OrderByDescending(t => t.DateCreated)
                    .ToListAsync();
                
                _logger.LogInformation("Retrieved {Count} support tickets from database", tickets.Count);
                return tickets;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all support tickets");
                throw;
            }
        }

        public async Task<SupportTicket?> GetSupportTicketByIdAsync(int ticketId)
        {
            try
            {
                return await _context.SupportTickets
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Id == ticketId && t.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting support ticket {TicketId}", ticketId);
                throw;
            }
        }

        public async Task<bool> UpdateSupportTicketAsync(int ticketId, string status, string? adminResponse)
        {
            try
            {
                var ticket = await _context.SupportTickets
                    .FirstOrDefaultAsync(t => t.Id == ticketId && t.IsActive);

                if (ticket == null)
                    return false;

                ticket.Status = status;
                ticket.AdminResponse = adminResponse;
                
                if (status == "Resolved" || status == "Closed")
                {
                    ticket.DateResolved = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Support ticket {TicketId} updated with status: {Status}", ticketId, status);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating support ticket {TicketId}", ticketId);
                throw;
            }
        }

        public static List<string> GetSupportTicketSubjects()
        {
            return new List<string>
            {
                "Account Issues",
                "Book Listing Problems",
                "Payment Issues",
                "Technical Problems",
                "Report User",
                "Report Book",
                "General Question",
                "Feature Request",
                "Bug Report",
                "Other"
            };
        }
    }
}
