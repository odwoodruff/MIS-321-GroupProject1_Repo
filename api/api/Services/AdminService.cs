using api.Models.Configuration;
using Microsoft.Extensions.Options;

namespace api.Services
{
    public class AdminService
    {
        private readonly AdminSettings _adminSettings;

        public AdminService(IOptions<AdminSettings> adminSettings)
        {
            _adminSettings = adminSettings.Value;
        }

        public bool IsAdminUser(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            return _adminSettings.AdminEmails.Contains(email, StringComparer.OrdinalIgnoreCase);
        }

        public List<string> GetAdminEmails()
        {
            return _adminSettings.AdminEmails.ToList();
        }
    }
}
