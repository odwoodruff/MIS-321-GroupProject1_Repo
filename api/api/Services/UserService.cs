using api.Models;
using System.Security.Cryptography;
using System.Text;

namespace api.Services
{
    public class UserService
    {
        private readonly List<User> _users;
        private int _nextId = 1;
        private readonly string _dataFilePath = "users.csv";

        public UserService()
        {
            _users = new List<User>();
            LoadUsersFromFile();
        }

        private void LoadUsersFromFile()
        {
            try
            {
                if (File.Exists(_dataFilePath))
                {
                    var lines = File.ReadAllLines(_dataFilePath);
                    foreach (var line in lines.Skip(1)) // Skip header
                    {
                        var user = ParseUserFromCsv(line);
                        if (user != null)
                        {
                            _users.Add(user);
                            _nextId = Math.Max(_nextId, user.Id + 1);
                        }
                    }
                }
                else
                {
                    // Create sample admin user if file doesn't exist
                    CreateSampleData();
                    SaveUsersToFile();
                }
            }
            catch (Exception ex)
            {
                // If file reading fails, create sample data
                CreateSampleData();
                SaveUsersToFile();
            }
        }

        private void CreateSampleData()
        {
            _users.Add(new User
            {
                Id = _nextId++,
                Username = "admin",
                Email = "admin@crimson.ua.edu",
                PasswordHash = HashPassword("admin123"),
                FirstName = "Admin",
                LastName = "User",
                DateCreated = DateTime.Now,
                IsActive = true
            });
        }

        public User? Register(string username, string email, string password, string firstName, string lastName)
        {
            // Check if user already exists
            if (_users.Any(u => u.Username == username || u.Email == email))
            {
                return null;
            }

            var user = new User
            {
                Id = _nextId++,
                Username = username,
                Email = email,
                PasswordHash = HashPassword(password),
                FirstName = firstName,
                LastName = lastName,
                DateCreated = DateTime.Now,
                IsActive = true
            };

            _users.Add(user);
            SaveUsersToFile();
            return user;
        }

        public User? Login(string usernameOrEmail, string password)
        {
            var user = _users.FirstOrDefault(u => 
                (u.Username == usernameOrEmail || u.Email == usernameOrEmail) && 
                u.IsActive);

            if (user == null || !VerifyPassword(password, user.PasswordHash))
            {
                return null;
            }

            return user;
        }

        public User? GetUser(int id)
        {
            return _users.FirstOrDefault(u => u.Id == id && u.IsActive);
        }

        public User? GetUserByUsername(string username)
        {
            return _users.FirstOrDefault(u => u.Username == username && u.IsActive);
        }

        public User? GetUserByEmail(string email)
        {
            return _users.FirstOrDefault(u => u.Email == email && u.IsActive);
        }

        public bool UpdateUser(int id, string firstName, string lastName, string email)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null) return false;

            // Check if email is already taken by another user
            if (_users.Any(u => u.Id != id && u.Email == email))
            {
                return false;
            }

            user.FirstName = firstName;
            user.LastName = lastName;
            user.Email = email;

            SaveUsersToFile();
            return true;
        }

        public bool ChangePassword(int id, string currentPassword, string newPassword)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null || !VerifyPassword(currentPassword, user.PasswordHash))
            {
                return false;
            }

            user.PasswordHash = HashPassword(newPassword);
            SaveUsersToFile();
            return true;
        }

        public bool DeactivateUser(int id)
        {
            var user = _users.FirstOrDefault(u => u.Id == id);
            if (user == null) return false;

            user.IsActive = false;
            SaveUsersToFile();
            return true;
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hash)
        {
            return HashPassword(password) == hash;
        }

        private void SaveUsersToFile()
        {
            try
            {
                var csv = new StringBuilder();
                csv.AppendLine("Id,Username,Email,PasswordHash,FirstName,LastName,DateCreated,IsActive");
                
                foreach (var user in _users)
                {
                    csv.AppendLine($"{user.Id},{EscapeCsv(user.Username)},{EscapeCsv(user.Email)},{EscapeCsv(user.PasswordHash)},{EscapeCsv(user.FirstName)},{EscapeCsv(user.LastName)},{user.DateCreated:yyyy-MM-dd HH:mm:ss},{user.IsActive}");
                }
                
                File.WriteAllText(_dataFilePath, csv.ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving users to file: {ex.Message}");
            }
        }

        private User? ParseUserFromCsv(string csvLine)
        {
            try
            {
                var fields = ParseCsvLine(csvLine);
                if (fields.Length < 8) return null;

                return new User
                {
                    Id = int.Parse(fields[0]),
                    Username = fields[1],
                    Email = fields[2],
                    PasswordHash = fields[3],
                    FirstName = fields[4],
                    LastName = fields[5],
                    DateCreated = DateTime.Parse(fields[6]),
                    IsActive = bool.Parse(fields[7])
                };
            }
            catch
            {
                return null;
            }
        }

        private string[] ParseCsvLine(string line)
        {
            var fields = new List<string>();
            var currentField = new StringBuilder();
            bool inQuotes = false;

            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];

                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ',' && !inQuotes)
                {
                    fields.Add(currentField.ToString());
                    currentField.Clear();
                }
                else
                {
                    currentField.Append(c);
                }
            }

            fields.Add(currentField.ToString());
            return fields.ToArray();
        }

        private string EscapeCsv(string value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            
            if (value.Contains(",") || value.Contains("\"") || value.Contains("\n"))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }
            
            return value;
        }
    }
}
