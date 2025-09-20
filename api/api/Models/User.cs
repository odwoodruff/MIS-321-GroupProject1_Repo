using System;

namespace api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; } = DateTime.Now;
        public bool IsActive { get; set; } = true;
        public double AverageRating { get; set; } = 0.0;
        public int RatingCount { get; set; } = 0;
    }
}
