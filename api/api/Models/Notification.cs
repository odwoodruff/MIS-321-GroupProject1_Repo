using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; } // User who receives the notification
        
        [Required]
        [MaxLength(500)]
        public string Message { get; set; } = string.Empty;
        
        [MaxLength(50)]
        public string Type { get; set; } = "info"; // info, success, warning, danger
        
        public DateTime DateCreated { get; set; } = DateTime.Now;
        
        public bool IsRead { get; set; } = false;
        
        public bool IsActive { get; set; } = true;
        
        // Optional: Link to related entities
        public int? RelatedBookId { get; set; }
        public int? RelatedUserId { get; set; }
        
        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        [ForeignKey("RelatedBookId")]
        public Book? RelatedBook { get; set; }
        
        [ForeignKey("RelatedUserId")]
        public User? RelatedUser { get; set; }
    }
}
