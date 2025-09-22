using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class RatedBook
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int UserId { get; set; } // User who rated the book
        
        [Required]
        public int BookId { get; set; } // Book that was rated
        
        [Required]
        public int RatingId { get; set; } // The actual rating given
        
        public DateTime DateRated { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("UserId")]
        public User? User { get; set; }
        
        [ForeignKey("BookId")]
        public Book? Book { get; set; }
        
        [ForeignKey("RatingId")]
        public Rating? Rating { get; set; }
    }
}
