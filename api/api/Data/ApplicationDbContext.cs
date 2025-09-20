using Microsoft.EntityFrameworkCore;
using api.Models;

namespace api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Book> Books { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Rating> Ratings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Book entity
            modelBuilder.Entity<Book>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Author).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Genre).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Price).HasColumnType("decimal(10,2)");
                entity.Property(e => e.Condition).HasMaxLength(20);
                entity.Property(e => e.SellerName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.SellerEmail).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CourseCode).HasMaxLength(20);
                entity.Property(e => e.Professor).HasMaxLength(100);
                entity.Property(e => e.ImageUrl).HasMaxLength(500);
                entity.Property(e => e.SellerRating).HasColumnType("decimal(3,1)");
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AverageRating).HasColumnType("decimal(3,1)");
                
                // Add unique constraints
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure Rating entity
            modelBuilder.Entity<Rating>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Comment).HasMaxLength(500);
                
                // Configure foreign key relationships
                entity.HasOne(e => e.Rater)
                    .WithMany()
                    .HasForeignKey(e => e.RaterId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.RatedUser)
                    .WithMany()
                    .HasForeignKey(e => e.RatedUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.Book)
                    .WithMany()
                    .HasForeignKey(e => e.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // Add unique constraint to prevent duplicate ratings
                entity.HasIndex(e => new { e.RaterId, e.RatedUserId, e.BookId })
                    .IsUnique()
                    .HasFilter("[IsActive] = 1");
            });
        }
    }
}
