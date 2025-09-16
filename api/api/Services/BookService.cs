using api.Models;
using System.Text;

namespace api.Services
{
    public class BookService
    {
        private readonly List<Book> _books;
        private int _nextId = 1;
        private readonly string _dataFilePath = "books.csv";

        public BookService()
        {
            _books = new List<Book>();
            LoadBooksFromFile();
        }

        private void LoadBooksFromFile()
        {
            try
            {
                if (File.Exists(_dataFilePath))
                {
                    var lines = File.ReadAllLines(_dataFilePath);
                    foreach (var line in lines.Skip(1)) // Skip header
                    {
                        var book = ParseBookFromCsv(line);
                        if (book != null)
                        {
                            _books.Add(book);
                            _nextId = Math.Max(_nextId, book.Id + 1);
                        }
                    }
                }
                else
                {
                    // Create sample data if file doesn't exist
                    CreateSampleData();
                    SaveBooksToFile();
                }
            }
            catch (Exception ex)
            {
                // If file reading fails, create sample data
                CreateSampleData();
                SaveBooksToFile();
            }
        }

        private void CreateSampleData()
        {
            _books.AddRange(new List<Book>
            {
                new Book { 
                    Id = _nextId++, 
                    Title = "Calculus: Early Transcendentals", 
                    Author = "James Stewart", 
                    Genre = "Mathematics", 
                    Year = 2020, 
                    Description = "Comprehensive calculus textbook with practice problems and solutions. Used for MATH 125.", 
                    Price = 85.00m,
                    Condition = "Good",
                    SellerName = "Sarah Johnson",
                    SellerEmail = "sjohnson@crimson.ua.edu",
                    CourseCode = "MATH 125",
                    Professor = "Dr. Smith",
                    IsAvailable = true,
                    DatePosted = DateTime.Now.AddDays(-5)
                },
                new Book { 
                    Id = _nextId++, 
                    Title = "Introduction to Psychology", 
                    Author = "David Myers", 
                    Genre = "Psychology", 
                    Year = 2021, 
                    Description = "Psychology textbook in excellent condition. Barely used, no highlighting.", 
                    Price = 120.00m,
                    Condition = "Excellent",
                    SellerName = "Mike Chen",
                    SellerEmail = "mchen@crimson.ua.edu",
                    CourseCode = "PSY 101",
                    Professor = "Dr. Williams",
                    IsAvailable = true,
                    DatePosted = DateTime.Now.AddDays(-2)
                },
                new Book { 
                    Id = _nextId++, 
                    Title = "Principles of Economics", 
                    Author = "N. Gregory Mankiw", 
                    Genre = "Economics", 
                    Year = 2022, 
                    Description = "Micro and macroeconomics textbook. Some highlighting but in good condition.", 
                    Price = 95.00m,
                    Condition = "Good",
                    SellerName = "Emily Davis",
                    SellerEmail = "edavis@crimson.ua.edu",
                    CourseCode = "EC 110",
                    Professor = "Dr. Brown",
                    IsAvailable = true,
                    DatePosted = DateTime.Now.AddDays(-7)
                },
                new Book { 
                    Id = _nextId++, 
                    Title = "Organic Chemistry", 
                    Author = "Paula Yurkanis Bruice", 
                    Genre = "Chemistry", 
                    Year = 2020, 
                    Description = "Organic chemistry textbook with study guide. Used for CHEM 232.", 
                    Price = 150.00m,
                    Condition = "Fair",
                    SellerName = "Alex Rodriguez",
                    SellerEmail = "arodriguez@crimson.ua.edu",
                    CourseCode = "CHEM 232",
                    Professor = "Dr. Johnson",
                    IsAvailable = true,
                    DatePosted = DateTime.Now.AddDays(-1)
                },
                new Book { 
                    Id = _nextId++, 
                    Title = "American Government", 
                    Author = "Ginsberg, Lowi, Weir", 
                    Genre = "Political Science", 
                    Year = 2021, 
                    Description = "Political science textbook covering American government and politics.", 
                    Price = 75.00m,
                    Condition = "Good",
                    SellerName = "Taylor Wilson",
                    SellerEmail = "twilson@crimson.ua.edu",
                    CourseCode = "POL 101",
                    Professor = "Dr. Anderson",
                    IsAvailable = true,
                    DatePosted = DateTime.Now.AddDays(-3)
                },
                new Book { 
                    Id = _nextId++, 
                    Title = "Fundamentals of Physics", 
                    Author = "Halliday, Resnick, Walker", 
                    Genre = "Physics", 
                    Year = 2020, 
                    Description = "Physics textbook with problem solutions manual included.", 
                    Price = 110.00m,
                    Condition = "Excellent",
                    SellerName = "Jordan Lee",
                    SellerEmail = "jlee@crimson.ua.edu",
                    CourseCode = "PH 101",
                    Professor = "Dr. Taylor",
                    IsAvailable = true,
                    DatePosted = DateTime.Now.AddDays(-4)
                }
            });
        }

        public List<Book> GetBooks()
        {
            return _books.ToList();
        }

        public Book? GetBook(int id)
        {
            return _books.FirstOrDefault(b => b.Id == id);
        }

        public Book CreateBook(Book book)
        {
            book.Id = _nextId++;
            _books.Add(book);
            SaveBooksToFile();
            return book;
        }

        public bool UpdateBook(int id, Book book)
        {
            var existingBook = _books.FirstOrDefault(b => b.Id == id);
            if (existingBook == null)
                return false;

            existingBook.Title = book.Title;
            existingBook.Author = book.Author;
            existingBook.Genre = book.Genre;
            existingBook.Year = book.Year;
            existingBook.Description = book.Description;
            existingBook.Price = book.Price;
            existingBook.Condition = book.Condition;
            existingBook.SellerName = book.SellerName;
            existingBook.SellerEmail = book.SellerEmail;
            existingBook.CourseCode = book.CourseCode;
            existingBook.Professor = book.Professor;
            existingBook.IsAvailable = book.IsAvailable;

            SaveBooksToFile();
            return true;
        }

        public bool DeleteBook(int id)
        {
            var book = _books.FirstOrDefault(b => b.Id == id);
            if (book == null)
                return false;

            _books.Remove(book);
            SaveBooksToFile();
            return true;
        }

        public List<Book> SearchBooks(string searchTerm)
        {
            if (string.IsNullOrEmpty(searchTerm))
                return _books.ToList();

            return _books.Where(b => 
                b.Title.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                b.Author.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                b.Genre.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                b.CourseCode.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                b.Professor.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
                b.SellerName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
            ).ToList();
        }

        private void SaveBooksToFile()
        {
            try
            {
                var csv = new StringBuilder();
                csv.AppendLine("Id,Title,Author,Genre,Year,Description,Price,Condition,SellerName,SellerEmail,CourseCode,Professor,IsAvailable,DatePosted,ImageUrl");
                
                foreach (var book in _books)
                {
                    csv.AppendLine($"{book.Id},{EscapeCsv(book.Title)},{EscapeCsv(book.Author)},{EscapeCsv(book.Genre)},{book.Year},{EscapeCsv(book.Description)},{book.Price},{EscapeCsv(book.Condition)},{EscapeCsv(book.SellerName)},{EscapeCsv(book.SellerEmail)},{EscapeCsv(book.CourseCode)},{EscapeCsv(book.Professor)},{book.IsAvailable},{book.DatePosted:yyyy-MM-dd HH:mm:ss},{EscapeCsv(book.ImageUrl)}");
                }
                
                File.WriteAllText(_dataFilePath, csv.ToString());
            }
            catch (Exception ex)
            {
                // Log error or handle gracefully
                Console.WriteLine($"Error saving books to file: {ex.Message}");
            }
        }

        private Book? ParseBookFromCsv(string csvLine)
        {
            try
            {
                var fields = ParseCsvLine(csvLine);
                if (fields.Length < 15) return null;

                return new Book
                {
                    Id = int.Parse(fields[0]),
                    Title = fields[1],
                    Author = fields[2],
                    Genre = fields[3],
                    Year = int.Parse(fields[4]),
                    Description = fields[5],
                    Price = decimal.Parse(fields[6]),
                    Condition = fields[7],
                    SellerName = fields[8],
                    SellerEmail = fields[9],
                    CourseCode = fields[10],
                    Professor = fields[11],
                    IsAvailable = bool.Parse(fields[12]),
                    DatePosted = DateTime.Parse(fields[13]),
                    ImageUrl = fields[14]
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
