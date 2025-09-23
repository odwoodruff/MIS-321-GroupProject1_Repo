using api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PromptedToRateController : ControllerBase
    {
        private readonly PromptedToRateService _promptedToRateService;
        private readonly LoggingService _loggingService;

        public PromptedToRateController(PromptedToRateService promptedToRateService, LoggingService loggingService)
        {
            _promptedToRateService = promptedToRateService;
            _loggingService = loggingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPromptedToRate()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var promptedToRates = await _promptedToRateService.GetPromptedToRateForUserAsync(userId);
                return Ok(promptedToRates);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving prompted to rate records", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving prompted to rate records" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddPromptedToRate([FromBody] AddPromptedToRateRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _promptedToRateService.AddPromptedToRateAsync(userId, request.SellerEmail, request.BookId);
                
                if (success)
                    return Ok(new { message = "Prompted to rate record added" });
                else
                    return BadRequest(new { message = "Failed to add prompted to rate record" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding prompted to rate record", ex);
                return StatusCode(500, new { message = "An error occurred while adding prompted to rate record" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> ClearPromptedToRate()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _promptedToRateService.ClearPromptedToRateForUserAsync(userId);
                
                if (success)
                    return Ok(new { message = "Prompted to rate records cleared" });
                else
                    return BadRequest(new { message = "Failed to clear prompted to rate records" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing prompted to rate records", ex);
                return StatusCode(500, new { message = "An error occurred while clearing prompted to rate records" });
            }
        }
    }

    public class AddPromptedToRateRequest
    {
        public string SellerEmail { get; set; } = string.Empty;
        public int BookId { get; set; }
    }
}
