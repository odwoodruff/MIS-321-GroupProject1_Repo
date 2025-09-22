using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class ContactedSeller
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int BuyerId { get; set; } // User who contacted the seller
        
        [Required]
        public int SellerId { get; set; } // User who was contacted
        
        [Required]
        public int BookId { get; set; } // Book that was inquired about
        
        public DateTime DateContacted { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        // Navigation properties
        [ForeignKey("BuyerId")]
        public User? Buyer { get; set; }
        
        [ForeignKey("SellerId")]
        public User? Seller { get; set; }
        
        [ForeignKey("BookId")]
        public Book? Book { get; set; }
    }
}
