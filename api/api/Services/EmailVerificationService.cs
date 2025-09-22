using api.Models;
using api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace api.Services
{
    public class EmailVerificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly LoggingService _loggingService;
        private readonly Random _random = new Random();

        public EmailVerificationService(ApplicationDbContext context, LoggingService loggingService)
        {
            _context = context;
            _loggingService = loggingService;
        }

        public async Task<string> GenerateVerificationCodeAsync(string email)
        {
            // Clean up old verification codes for this email
            await CleanupOldCodesAsync(email).ConfigureAwait(false);

            // Generate 6-digit code
            var code = _random.Next(100000, 999999).ToString();
            
            var verification = new EmailVerification
            {
                Email = email.ToLowerInvariant(),
                VerificationCode = code,
                CreatedAt = DateTime.Now,
                ExpiresAt = DateTime.Now.AddMinutes(10), // 10 minute expiry
                IsUsed = false,
                Attempts = 0
            };

            _context.EmailVerifications.Add(verification);
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _loggingService.LogUserAction("VerificationCodeGenerated", null, $"Verification code generated for {email}");
            
            return code;
        }

        public async Task<bool> VerifyCodeAsync(string email, string code)
        {
            var verification = await _context.EmailVerifications
                .FirstOrDefaultAsync(v => 
                    v.Email == email.ToLowerInvariant() && 
                    v.VerificationCode == code &&
                    !v.IsUsed &&
                    v.ExpiresAt > DateTime.Now).ConfigureAwait(false);

            if (verification == null)
            {
                // Increment attempts for failed verification
                var failedVerification = await _context.EmailVerifications
                    .FirstOrDefaultAsync(v => v.Email == email.ToLowerInvariant()).ConfigureAwait(false);
                
                if (failedVerification != null)
                {
                    failedVerification.Attempts++;
                    await _context.SaveChangesAsync().ConfigureAwait(false);
                }

                _loggingService.LogSecurityEvent("VerificationFailed", 
                    $"Failed verification attempt for {email}", null, null);
                return false;
            }

            // Mark as used
            verification.IsUsed = true;
            await _context.SaveChangesAsync().ConfigureAwait(false);

            _loggingService.LogUserAction("EmailVerified", null, $"Email verified for {email}");
            return true;
        }

        public async Task<bool> IsEmailVerifiedAsync(string email)
        {
            return await _context.EmailVerifications
                .AnyAsync(v => 
                    v.Email == email.ToLowerInvariant() && 
                    v.IsUsed &&
                    v.ExpiresAt > DateTime.Now.AddDays(-1)).ConfigureAwait(false); // Verified within last 24 hours
        }

        public async Task<bool> IsRateLimitedAsync(string email)
        {
            var recentAttempts = await _context.EmailVerifications
                .Where(v => v.Email == email.ToLowerInvariant() && 
                           v.CreatedAt > DateTime.Now.AddMinutes(5))
                .SumAsync(v => v.Attempts).ConfigureAwait(false);

            return recentAttempts >= 5; // Max 5 attempts per 5 minutes
        }

        private async Task CleanupOldCodesAsync(string email)
        {
            var oldCodes = await _context.EmailVerifications
                .Where(v => v.Email == email.ToLowerInvariant() && 
                           (v.ExpiresAt < DateTime.Now || v.IsUsed))
                .ToListAsync().ConfigureAwait(false);

            _context.EmailVerifications.RemoveRange(oldCodes);
            await _context.SaveChangesAsync().ConfigureAwait(false);
        }

        // For testing purposes - in production, you'd integrate with actual email service
        public async Task<bool> SendVerificationEmailAsync(string email, string code)
        {
            try
            {
                // In a real implementation, you'd send an actual email here
                // For now, we'll just log it
                _loggingService.LogUserAction("EmailSent", null, 
                    $"Verification code {code} sent to {email}");
                
                // Simulate email sending delay
                await Task.Delay(100).ConfigureAwait(false);
                return true;
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Failed to send verification email", ex);
                return false;
            }
        }
    }
}
