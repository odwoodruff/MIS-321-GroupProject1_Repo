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
        public DbSet<EmailVerification> EmailVerifications { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ContactedSeller> ContactedSellers { get; set; }
        public DbSet<RatedBook> RatedBooks { get; set; }
        public DbSet<PromptedToRate> PromptedToRates { get; set; }
        public DbSet<SupportTicket> SupportTickets { get; set; }

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
                entity.Property(e => e.SellerRating).HasColumnType("decimal(3,1)");
                
                // Add indexes for performance
                entity.HasIndex(e => e.SellerEmail);
                entity.HasIndex(e => e.Title);
                entity.HasIndex(e => e.Author);
                entity.HasIndex(e => e.Condition);
                entity.HasIndex(e => e.Price);
                entity.HasIndex(e => e.IsAvailable);
                entity.HasIndex(e => new { e.IsAvailable, e.Condition });
                entity.HasIndex(e => new { e.SellerEmail, e.IsAvailable });
                entity.HasIndex(e => new { e.Title, e.Author });
                entity.HasIndex(e => new { e.Condition, e.Price });
                
                // Configure relationship to User
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerEmail)
                    .HasPrincipalKey(e => e.Email)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AverageRating).HasColumnType("decimal(3,1)");
                
                // Add unique constraints
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Configure EmailVerification entity
            modelBuilder.Entity<EmailVerification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.VerificationCode).IsRequired().HasMaxLength(6);
                
                // Add indexes for performance
                entity.HasIndex(e => e.Email);
                entity.HasIndex(e => e.VerificationCode);
                entity.HasIndex(e => new { e.Email, e.VerificationCode });
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
                
                // Add indexes for performance
                entity.HasIndex(e => e.BookId);
                entity.HasIndex(e => e.RaterId);
                entity.HasIndex(e => e.RatedUserId);
                
                // Add unique constraint to prevent duplicate ratings
                entity.HasIndex(e => new { e.RaterId, e.RatedUserId, e.BookId })
                    .IsUnique()
                    .HasFilter("[IsActive] = 1");
            });

            // Configure Notification entity
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Type).HasMaxLength(50).HasDefaultValue("info");
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.RelatedBook)
                    .WithMany()
                    .HasForeignKey(e => e.RelatedBookId)
                    .OnDelete(DeleteBehavior.SetNull);
                    
                entity.HasOne(e => e.RelatedUser)
                    .WithMany()
                    .HasForeignKey(e => e.RelatedUserId)
                    .OnDelete(DeleteBehavior.SetNull);
                
                // Add indexes for performance
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.IsRead);
                entity.HasIndex(e => e.DateCreated);
            });

            // Configure ContactedSeller entity
            modelBuilder.Entity<ContactedSeller>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.Buyer)
                    .WithMany()
                    .HasForeignKey(e => e.BuyerId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.Book)
                    .WithMany()
                    .HasForeignKey(e => e.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // Add indexes for performance
                entity.HasIndex(e => e.BuyerId);
                entity.HasIndex(e => e.SellerId);
                entity.HasIndex(e => e.BookId);
                
                // Add unique constraint to prevent duplicate contacts
                entity.HasIndex(e => new { e.BuyerId, e.SellerId, e.BookId })
                    .IsUnique()
                    .HasFilter("[IsActive] = 1");
            });

            // Configure RatedBook entity
            modelBuilder.Entity<RatedBook>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Book)
                    .WithMany()
                    .HasForeignKey(e => e.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.Rating)
                    .WithMany()
                    .HasForeignKey(e => e.RatingId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Add indexes for performance
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.BookId);
                entity.HasIndex(e => e.RatingId);
            });

            // Configure PromptedToRate entity
            modelBuilder.Entity<PromptedToRate>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Book)
                    .WithMany()
                    .HasForeignKey(e => e.BookId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasOne(e => e.Seller)
                    .WithMany()
                    .HasForeignKey(e => e.SellerId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // Add indexes for performance
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.BookId);
                entity.HasIndex(e => e.SellerId);
            });

            // Configure SupportTicket entity
            modelBuilder.Entity<SupportTicket>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Subject).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Message).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
                entity.Property(e => e.AdminResponse).HasMaxLength(2000);
                
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Add indexes for performance
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.DateCreated);
            });
        }
    }
}
