using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class Rating
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int RaterId { get; set; } // User who gave the rating
        
        [Required]
        public int RatedUserId { get; set; } // User who received the rating
        
        [Required]
        public int BookId { get; set; } // Book involved in the transaction
        
        [Required]
        [Range(1, 5)]
        public int Score { get; set; } // Rating score 1-5
        
        [MaxLength(500)]
        public string Comment { get; set; } = string.Empty;
        
        public DateTime DateCreated { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("RaterId")]
        public User? Rater { get; set; }
        
        [ForeignKey("RatedUserId")]
        public User? RatedUser { get; set; }
        
        [ForeignKey("BookId")]
        public Book? Book { get; set; }
    }
}
