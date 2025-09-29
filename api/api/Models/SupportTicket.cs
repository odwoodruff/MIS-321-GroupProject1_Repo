using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class SupportTicket
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; } // User who created the ticket
        
        [Required]
        [MaxLength(100)]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(2000)]
        public string Message { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string Status { get; set; } = "Open"; // Open, In Progress, Resolved, Closed
        
        [MaxLength(2000)]
        public string? AdminResponse { get; set; }
        
        public DateTime DateCreated { get; set; } = DateTime.Now;
        
        public DateTime? DateResolved { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}
