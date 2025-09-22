using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;
        
        public DateTime DateCreated { get; set; } = DateTime.Now;
        
        public bool IsActive { get; set; } = true;
        
        [Column(TypeName = "decimal(3,1)")]
        public double AverageRating { get; set; } = 0.0;
        
        public int RatingCount { get; set; } = 0;
    }
}
