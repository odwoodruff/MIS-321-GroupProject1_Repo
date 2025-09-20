using api.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace api.Services
{
    public class BackupService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<BackupService> _logger;
        private readonly string _backupDirectory;

        public BackupService(ApplicationDbContext context, ILogger<BackupService> logger)
        {
            _context = context;
            _logger = logger;
            _backupDirectory = Path.Combine(Directory.GetCurrentDirectory(), "backups");
            
            // Ensure backup directory exists
            Directory.CreateDirectory(_backupDirectory);
        }

        public async Task<bool> CreateBackupAsync()
        {
            try
            {
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var backupPath = Path.Combine(_backupDirectory, $"backup_{timestamp}.json");

                var backupData = new
                {
                    Timestamp = DateTime.UtcNow,
                    Users = await _context.Users.ToListAsync(),
                    Books = await _context.Books.ToListAsync(),
                    Ratings = await _context.Ratings.ToListAsync()
                };

                var json = JsonSerializer.Serialize(backupData, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await File.WriteAllTextAsync(backupPath, json);

                _logger.LogInformation("Backup created successfully: {BackupPath}", backupPath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating backup");
                return false;
            }
        }

        public async Task<bool> RestoreBackupAsync(string backupFilePath)
        {
            try
            {
                if (!File.Exists(backupFilePath))
                {
                    _logger.LogError("Backup file not found: {BackupPath}", backupFilePath);
                    return false;
                }

                var json = await File.ReadAllTextAsync(backupFilePath);
                var backupData = JsonSerializer.Deserialize<BackupData>(json);

                if (backupData == null)
                {
                    _logger.LogError("Invalid backup file format");
                    return false;
                }

                // Clear existing data
                _context.Users.RemoveRange(_context.Users);
                _context.Books.RemoveRange(_context.Books);
                _context.Ratings.RemoveRange(_context.Ratings);
                await _context.SaveChangesAsync();

                // Restore data
                if (backupData.Users != null)
                {
                    _context.Users.AddRange(backupData.Users);
                }

                if (backupData.Books != null)
                {
                    _context.Books.AddRange(backupData.Books);
                }

                if (backupData.Ratings != null)
                {
                    _context.Ratings.AddRange(backupData.Ratings);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Backup restored successfully from: {BackupPath}", backupFilePath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error restoring backup");
                return false;
            }
        }

        public List<string> GetAvailableBackups()
        {
            try
            {
                return Directory.GetFiles(_backupDirectory, "backup_*.json")
                    .OrderByDescending(f => File.GetCreationTime(f))
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available backups");
                return new List<string>();
            }
        }

        public bool DeleteBackup(string backupFilePath)
        {
            try
            {
                if (File.Exists(backupFilePath))
                {
                    File.Delete(backupFilePath);
                    _logger.LogInformation("Backup deleted: {BackupPath}", backupFilePath);
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting backup");
                return false;
            }
        }

        public void CleanupOldBackups(int keepDays = 30)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-keepDays);
                var oldBackups = Directory.GetFiles(_backupDirectory, "backup_*.json")
                    .Where(f => File.GetCreationTime(f) < cutoffDate)
                    .ToList();

                foreach (var backup in oldBackups)
                {
                    File.Delete(backup);
                    _logger.LogInformation("Old backup deleted: {BackupPath}", backup);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up old backups");
            }
        }

        private class BackupData
        {
            public DateTime Timestamp { get; set; }
            public List<api.Models.User>? Users { get; set; }
            public List<api.Models.Book>? Books { get; set; }
            public List<api.Models.Rating>? Ratings { get; set; }
        }
    }
}
