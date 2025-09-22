using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class PromptedToRate
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; } // User who was prompted
        
        [Required]
        public int BookId { get; set; } // Book they were prompted to rate
        
        [Required]
        public int SellerId { get; set; } // Seller they were prompted to rate
        
        public DateTime DatePrompted { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        [ForeignKey("BookId")]
        public Book? Book { get; set; }
        
        [ForeignKey("SellerId")]
        public User? Seller { get; set; }
    }
}
