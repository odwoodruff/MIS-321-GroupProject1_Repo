using System;

namespace api.Models
{
    public class Rating
    {
        public int Id { get; set; }
        public int RaterId { get; set; } // User who gave the rating
        public int RatedUserId { get; set; } // User who received the rating
        public int BookId { get; set; } // Book involved in the transaction
        public int Score { get; set; } // Rating score 1-5
        public string Comment { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;
        
        // Navigation properties (not stored in CSV)
        public User? Rater { get; set; }
        public User? RatedUser { get; set; }
        public Book? Book { get; set; }
    }
}
