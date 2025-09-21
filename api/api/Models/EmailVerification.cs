using System.ComponentModel.DataAnnotations;

namespace api.Models
{
    public class EmailVerification
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(6)]
        public string VerificationCode { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime ExpiresAt { get; set; }
        
        public bool IsUsed { get; set; } = false;
        
        public int Attempts { get; set; } = 0;
    }
}
