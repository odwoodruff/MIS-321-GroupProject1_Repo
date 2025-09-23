using api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ContactedSellerController : ControllerBase
    {
        private readonly ContactedSellerService _contactedSellerService;
        private readonly LoggingService _loggingService;

        public ContactedSellerController(ContactedSellerService contactedSellerService, LoggingService loggingService)
        {
            _contactedSellerService = contactedSellerService;
            _loggingService = loggingService;
        }

        [HttpGet]
        public async Task<IActionResult> GetContactedSellers()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var contactedSellers = await _contactedSellerService.GetContactedSellersForUserAsync(userId);
                return Ok(contactedSellers);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error retrieving contacted sellers", ex);
                return StatusCode(500, new { message = "An error occurred while retrieving contacted sellers" });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddContactedSeller([FromBody] AddContactedSellerRequest request)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _contactedSellerService.AddContactedSellerAsync(userId, request.SellerEmail, request.BookId);
                
                if (success)
                    return Ok(new { message = "Seller added to contacted list" });
                else
                    return BadRequest(new { message = "Failed to add seller to contacted list" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error adding contacted seller", ex);
                return StatusCode(500, new { message = "An error occurred while adding contacted seller" });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> ClearContactedSellers()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
                if (userId <= 0)
                    return Unauthorized("Invalid user ID");

                var success = await _contactedSellerService.ClearContactedSellersForUserAsync(userId);
                
                if (success)
                    return Ok(new { message = "Contacted sellers cleared" });
                else
                    return BadRequest(new { message = "Failed to clear contacted sellers" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error clearing contacted sellers", ex);
                return StatusCode(500, new { message = "An error occurred while clearing contacted sellers" });
            }
        }
    }

    public class AddContactedSellerRequest
    {
        public string SellerEmail { get; set; } = string.Empty;
        public int BookId { get; set; }
    }
}
