using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models
{
    public class Book
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Author { get; set; } = string.Empty;
        public string Genre { get; set; } = string.Empty;
        public int Year { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Condition { get; set; } = "Good";
        public string SellerName { get; set; } = string.Empty;
        public string SellerEmail { get; set; } = string.Empty;
        public string CourseCode { get; set; } = string.Empty;
        public string Professor { get; set; } = string.Empty;
        public bool IsAvailable { get; set; } = true;
        public DateTime DatePosted { get; set; } = DateTime.Now;
        public string ImageUrl { get; set; } = string.Empty;
        public double SellerRating { get; set; } = 0.0;
        public int SellerRatingCount { get; set; } = 0;
    }
}
