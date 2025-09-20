using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models
{
    public class Book
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Author { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string Genre { get; set; } = string.Empty;
        
        public int Year { get; set; }
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }
        
        [MaxLength(20)]
        public string Condition { get; set; } = "Good";
        
        [Required]
        [MaxLength(100)]
        public string SellerName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string SellerEmail { get; set; } = string.Empty;
        
        [MaxLength(20)]
        public string CourseCode { get; set; } = string.Empty;
        
        [MaxLength(100)]
        public string Professor { get; set; } = string.Empty;
        
        public bool IsAvailable { get; set; } = true;
        
        public DateTime DatePosted { get; set; } = DateTime.Now;
        
        [MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(3,1)")]
        public double SellerRating { get; set; } = 0.0;
        
        public int SellerRatingCount { get; set; } = 0;
    }
}
