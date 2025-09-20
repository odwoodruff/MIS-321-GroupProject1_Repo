using Microsoft.AspNetCore.Mvc;
using api.Services;

namespace api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BackupController : ControllerBase
    {
        private readonly BackupService _backupService;
        private readonly LoggingService _loggingService;

        public BackupController(BackupService backupService, LoggingService loggingService)
        {
            _backupService = backupService;
            _loggingService = loggingService;
        }

        // POST: api/Backup/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateBackup()
        {
            try
            {
                var success = await _backupService.CreateBackupAsync();
                
                if (success)
                {
                    _loggingService.LogUserAction("BackupCreated", null, "Database backup created");
                    return Ok(new { message = "Backup created successfully" });
                }
                
                return StatusCode(500, new { message = "Failed to create backup" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error creating backup", ex);
                return StatusCode(500, new { message = "An error occurred while creating backup" });
            }
        }

        // GET: api/Backup/list
        [HttpGet("list")]
        public IActionResult ListBackups()
        {
            try
            {
                var backups = _backupService.GetAvailableBackups();
                var backupInfo = backups.Select(backup => new
                {
                    FileName = Path.GetFileName(backup),
                    FilePath = backup,
                    CreatedDate = System.IO.File.GetCreationTime(backup),
                    FileSize = new FileInfo(backup).Length
                }).ToList();

                return Ok(backupInfo);
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error listing backups", ex);
                return StatusCode(500, new { message = "An error occurred while listing backups" });
            }
        }

        // POST: api/Backup/restore
        [HttpPost("restore")]
        public async Task<IActionResult> RestoreBackup([FromBody] RestoreBackupRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.BackupFilePath))
                {
                    return BadRequest(new { message = "Backup file path is required" });
                }

                var success = await _backupService.RestoreBackupAsync(request.BackupFilePath);
                
                if (success)
                {
                    _loggingService.LogUserAction("BackupRestored", null, $"Database restored from {request.BackupFilePath}");
                    return Ok(new { message = "Backup restored successfully" });
                }
                
                return StatusCode(500, new { message = "Failed to restore backup" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error restoring backup", ex);
                return StatusCode(500, new { message = "An error occurred while restoring backup" });
            }
        }

        // DELETE: api/Backup/{fileName}
        [HttpDelete("{fileName}")]
        public IActionResult DeleteBackup(string fileName)
        {
            try
            {
                var backupPath = Path.Combine(Directory.GetCurrentDirectory(), "backups", fileName);
                var success = _backupService.DeleteBackup(backupPath);
                
                if (success)
                {
                    _loggingService.LogUserAction("BackupDeleted", null, $"Backup deleted: {fileName}");
                    return Ok(new { message = "Backup deleted successfully" });
                }
                
                return NotFound(new { message = "Backup file not found" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error deleting backup", ex);
                return StatusCode(500, new { message = "An error occurred while deleting backup" });
            }
        }

        // POST: api/Backup/cleanup
        [HttpPost("cleanup")]
        public IActionResult CleanupOldBackups([FromBody] CleanupRequest? request = null)
        {
            try
            {
                var keepDays = request?.KeepDays ?? 30;
                _backupService.CleanupOldBackups(keepDays);
                
                _loggingService.LogUserAction("BackupCleanup", null, $"Cleaned up backups older than {keepDays} days");
                return Ok(new { message = $"Cleaned up backups older than {keepDays} days" });
            }
            catch (Exception ex)
            {
                _loggingService.LogError("Error cleaning up backups", ex);
                return StatusCode(500, new { message = "An error occurred while cleaning up backups" });
            }
        }
    }

    public class RestoreBackupRequest
    {
        public string BackupFilePath { get; set; } = string.Empty;
    }

    public class CleanupRequest
    {
        public int KeepDays { get; set; } = 30;
    }
}
