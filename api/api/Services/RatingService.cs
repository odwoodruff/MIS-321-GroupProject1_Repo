using api.Models;
using System.Text;

namespace api.Services
{
    public class RatingService
    {
        private readonly List<Rating> _ratings;
        private int _nextId = 1;
        private readonly string _dataFilePath = "ratings.csv";
        private readonly UserService _userService;

        public RatingService(UserService userService)
        {
            _ratings = new List<Rating>();
            _userService = userService;
            LoadRatingsFromFile();
        }

        private void LoadRatingsFromFile()
        {
            try
            {
                if (File.Exists(_dataFilePath))
                {
                    var lines = File.ReadAllLines(_dataFilePath);
                    foreach (var line in lines.Skip(1)) // Skip header
                    {
                        var rating = ParseRatingFromCsv(line);
                        if (rating != null)
                        {
                            _ratings.Add(rating);
                            _nextId = Math.Max(_nextId, rating.Id + 1);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading ratings: {ex.Message}");
            }
        }

        public Rating? CreateRating(int raterId, int ratedUserId, int bookId, int score, string comment = "")
        {
            // Validate score
            if (score < 1 || score > 5)
            {
                return null;
            }

            // Check if user already rated this person for this book
            if (_ratings.Any(r => r.RaterId == raterId && r.RatedUserId == ratedUserId && r.BookId == bookId && r.IsActive))
            {
                return null; // Already rated
            }

            // Validate users exist
            var rater = _userService.GetUser(raterId);
            var ratedUser = _userService.GetUser(ratedUserId);
            
            if (rater == null || ratedUser == null)
            {
                return null;
            }

            var rating = new Rating
            {
                Id = _nextId++,
                RaterId = raterId,
                RatedUserId = ratedUserId,
                BookId = bookId,
                Score = score,
                Comment = comment,
                DateCreated = DateTime.Now,
                IsActive = true
            };

            _ratings.Add(rating);
            SaveRatingsToFile();
            UpdateUserRating(ratedUserId);
            
            return rating;
        }

        public List<Rating> GetRatingsForUser(int userId)
        {
            return _ratings.Where(r => r.RatedUserId == userId && r.IsActive).ToList();
        }

        public List<Rating> GetRatingsByUser(int userId)
        {
            return _ratings.Where(r => r.RaterId == userId && r.IsActive).ToList();
        }

        public Rating? GetRating(int id)
        {
            return _ratings.FirstOrDefault(r => r.Id == id && r.IsActive);
        }

        public bool UpdateRating(int id, int score, string comment = "")
        {
            var rating = _ratings.FirstOrDefault(r => r.Id == id && r.IsActive);
            if (rating == null || score < 1 || score > 5)
            {
                return false;
            }

            rating.Score = score;
            rating.Comment = comment;
            SaveRatingsToFile();
            UpdateUserRating(rating.RatedUserId);
            
            return true;
        }

        public bool DeleteRating(int id)
        {
            var rating = _ratings.FirstOrDefault(r => r.Id == id && r.IsActive);
            if (rating == null)
            {
                return false;
            }

            rating.IsActive = false;
            SaveRatingsToFile();
            UpdateUserRating(rating.RatedUserId);
            
            return true;
        }

        public double GetAverageRatingForUser(int userId)
        {
            var userRatings = _ratings.Where(r => r.RatedUserId == userId && r.IsActive);
            if (!userRatings.Any())
            {
                return 0.0;
            }

            return userRatings.Average(r => r.Score);
        }

        public int GetRatingCountForUser(int userId)
        {
            return _ratings.Count(r => r.RatedUserId == userId && r.IsActive);
        }

        public List<Rating> GetAllRatings()
        {
            return _ratings.Where(r => r.IsActive).ToList();
        }

        private void UpdateUserRating(int userId)
        {
            var user = _userService.GetUser(userId);
            if (user != null)
            {
                user.AverageRating = GetAverageRatingForUser(userId);
                user.RatingCount = GetRatingCountForUser(userId);
                _userService.SaveUser(user);
            }
        }

        private void SaveRatingsToFile()
        {
            try
            {
                var csv = new StringBuilder();
                csv.AppendLine("Id,RaterId,RatedUserId,BookId,Score,Comment,DateCreated,IsActive");
                
                foreach (var rating in _ratings)
                {
                    csv.AppendLine($"{rating.Id},{rating.RaterId},{rating.RatedUserId},{rating.BookId},{rating.Score},{EscapeCsv(rating.Comment)},{rating.DateCreated:yyyy-MM-dd HH:mm:ss},{rating.IsActive}");
                }
                
                File.WriteAllText(_dataFilePath, csv.ToString());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving ratings to file: {ex.Message}");
            }
        }

        private Rating? ParseRatingFromCsv(string csvLine)
        {
            try
            {
                var fields = ParseCsvLine(csvLine);
                if (fields.Length < 8) return null;

                return new Rating
                {
                    Id = int.Parse(fields[0]),
                    RaterId = int.Parse(fields[1]),
                    RatedUserId = int.Parse(fields[2]),
                    BookId = int.Parse(fields[3]),
                    Score = int.Parse(fields[4]),
                    Comment = fields[5],
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
