using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using api.Services;
using api.Models;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly EmailVerificationService _emailVerificationService;
        private readonly UserService _userService;
        private readonly LoggingService _loggingService;
        private readonly JwtService _jwtService;

        public AuthController(EmailVerificationService emailVerificationService, 
            UserService userService, LoggingService loggingService, JwtService jwtService)
        {
            _emailVerificationService = emailVerificationService;
            _userService = userService;
            _loggingService = loggingService;
            _jwtService = jwtService;
        }

        [HttpPost("send-verification")]
        public async Task<IActionResult> SendVerificationCode([FromBody] SendVerificationRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                // Validate email format and domain
                if (!ValidationService.IsValidEmail(request.Email) || 
                    (!request.Email.EndsWith("@crimson.ua.edu") && !request.Email.EndsWith("@ua.edu")))
                {
                    return BadRequest(new { message = "Invalid University of Alabama email address" });
                }

                // Check rate limiting
                if (await _emailVerificationService.IsRateLimitedAsync(request.Email))
                {
                    _loggingService.LogSecurityEvent("RateLimitExceeded", 
                        $"Too many verification attempts for {request.Email}", null, GetClientIpAddress());
                    return StatusCode(429, new { message = "Too many verification attempts. Please try again later." });
                }

                // Generate verification code
                var code = await _emailVerificationService.GenerateVerificationCodeAsync(request.Email);
                
                // Send email (in production, integrate with actual email service)
                var emailSent = await _emailVerificationService.SendVerificationEmailAsync(request.Email, code);
                
                if (!emailSent)
                {
                    return StatusCode(500, new { message = "Failed to send verification email" });
                }

                _loggingService.LogUserAction("VerificationCodeRequested", null, 
                    $"Verification code requested for {request.Email}");

                // In development, return the code directly
                return Ok(new { 
                    message = "Verification code sent to your email",
                    verificationCode = code  // Only for development
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error sending verification code", ex);
                return StatusCode(500, new { message = "An error occurred while sending verification code" });
            }
        }

        [HttpPut("update-profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            try
            {
                var userId = _jwtService.GetUserIdFromToken(User);
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var user = await _userService.GetUserByIdAsync(userId);
                if (user == null)
                    return NotFound(new { message = "User not found" });

                // Update user profile
                user.FirstName = request.FirstName;
                user.LastName = request.LastName;

                var success = await _userService.UpdateUserAsync(user);
                if (!success)
                    return StatusCode(500, new { message = "Failed to update profile" });

                _loggingService.LogUserAction("ProfileUpdate", userId.ToString(), 
                    $"User {user.Email} updated their profile");

                return Ok(new { 
                    message = "Profile updated successfully",
                    user = new {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        dateCreated = user.DateCreated
                    }
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error updating user profile", ex);
                return StatusCode(500, new { message = "An error occurred while updating profile" });
            }
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Code))
                {
                    return BadRequest(new { message = "Email and verification code are required" });
                }

                // Verify the code
                var isValid = await _emailVerificationService.VerifyCodeAsync(request.Email, request.Code);
                
                if (!isValid)
                {
                    return BadRequest(new { message = "Invalid or expired verification code" });
                }

                // Check if user already exists
                var existingUser = await _userService.GetUserByEmailAsync(request.Email);
                User? user;

                if (existingUser == null)
                {
                    // Create new user
                    var emailParts = request.Email.Split('@')[0].Split('.');
                    var firstName = emailParts.Length > 0 ? emailParts[0] : "Student";
                    var lastName = emailParts.Length > 1 ? emailParts[1] : "User";
                    var username = request.Email.Split('@')[0];

                    user = await _userService.RegisterAsync(username, request.Email, firstName, lastName);
                    
                    if (user == null)
                    {
                        return StatusCode(500, new { message = "Failed to create user account" });
                    }
                }
                else
                {
                    user = existingUser;
                }

                _loggingService.LogUserAction("UserLogin", user.Id.ToString(), 
                    $"User {user.Email} logged in successfully");

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);

                return Ok(new { 
                    message = "Email verified successfully",
                    token = token,
                    user = new {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        dateCreated = user.DateCreated
                    }
                });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error verifying email", ex);
                return StatusCode(500, new { message = "An error occurred while verifying email" });
            }
        }

        [HttpPost("check-verification")]
        public async Task<IActionResult> CheckVerificationStatus([FromBody] CheckVerificationRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                var isVerified = await _emailVerificationService.IsEmailVerifiedAsync(request.Email);
                return Ok(new { isVerified });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error checking verification status", ex);
                return StatusCode(500, new { message = "An error occurred while checking verification status" });
            }
        }

        private string GetClientIpAddress()
        {
            var forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                return forwardedFor.Split(',')[0].Trim();
            }

            var realIp = Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }

    public class SendVerificationRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyEmailRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }

    public class CheckVerificationRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}
