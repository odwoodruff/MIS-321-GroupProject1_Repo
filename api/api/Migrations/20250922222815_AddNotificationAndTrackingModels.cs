using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddNotificationAndTrackingModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Books");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Users_Email",
                table: "Users",
                column: "Email");

            migrationBuilder.CreateTable(
                name: "ContactedSellers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    BuyerId = table.Column<int>(type: "INTEGER", nullable: false),
                    SellerId = table.Column<int>(type: "INTEGER", nullable: false),
                    BookId = table.Column<int>(type: "INTEGER", nullable: false),
                    DateContacted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContactedSellers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ContactedSellers_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ContactedSellers_Users_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ContactedSellers_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false, defaultValue: "info"),
                    DateCreated = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsRead = table.Column<bool>(type: "INTEGER", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false),
                    RelatedBookId = table.Column<int>(type: "INTEGER", nullable: true),
                    RelatedUserId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Books_RelatedBookId",
                        column: x => x.RelatedBookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_RelatedUserId",
                        column: x => x.RelatedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PromptedToRates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    BookId = table.Column<int>(type: "INTEGER", nullable: false),
                    SellerId = table.Column<int>(type: "INTEGER", nullable: false),
                    DatePrompted = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PromptedToRates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PromptedToRates_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PromptedToRates_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PromptedToRates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RatedBooks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    BookId = table.Column<int>(type: "INTEGER", nullable: false),
                    RatingId = table.Column<int>(type: "INTEGER", nullable: false),
                    DateRated = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsActive = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RatedBooks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RatedBooks_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RatedBooks_Ratings_RatingId",
                        column: x => x.RatingId,
                        principalTable: "Ratings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RatedBooks_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_RaterId",
                table: "Ratings",
                column: "RaterId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailVerifications_VerificationCode",
                table: "EmailVerifications",
                column: "VerificationCode");

            migrationBuilder.CreateIndex(
                name: "IX_Books_Author",
                table: "Books",
                column: "Author");

            migrationBuilder.CreateIndex(
                name: "IX_Books_Condition",
                table: "Books",
                column: "Condition");

            migrationBuilder.CreateIndex(
                name: "IX_Books_Condition_Price",
                table: "Books",
                columns: new[] { "Condition", "Price" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsAvailable",
                table: "Books",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_Books_IsAvailable_Condition",
                table: "Books",
                columns: new[] { "IsAvailable", "Condition" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_Price",
                table: "Books",
                column: "Price");

            migrationBuilder.CreateIndex(
                name: "IX_Books_SellerEmail",
                table: "Books",
                column: "SellerEmail");

            migrationBuilder.CreateIndex(
                name: "IX_Books_SellerEmail_IsAvailable",
                table: "Books",
                columns: new[] { "SellerEmail", "IsAvailable" });

            migrationBuilder.CreateIndex(
                name: "IX_Books_Title",
                table: "Books",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Books_Title_Author",
                table: "Books",
                columns: new[] { "Title", "Author" });

            migrationBuilder.CreateIndex(
                name: "IX_ContactedSellers_BookId",
                table: "ContactedSellers",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactedSellers_BuyerId",
                table: "ContactedSellers",
                column: "BuyerId");

            migrationBuilder.CreateIndex(
                name: "IX_ContactedSellers_BuyerId_SellerId_BookId",
                table: "ContactedSellers",
                columns: new[] { "BuyerId", "SellerId", "BookId" },
                unique: true,
                filter: "[IsActive] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_ContactedSellers_SellerId",
                table: "ContactedSellers",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_DateCreated",
                table: "Notifications",
                column: "DateCreated");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_IsRead",
                table: "Notifications",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RelatedBookId",
                table: "Notifications",
                column: "RelatedBookId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RelatedUserId",
                table: "Notifications",
                column: "RelatedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserId",
                table: "Notifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptedToRates_BookId",
                table: "PromptedToRates",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptedToRates_SellerId",
                table: "PromptedToRates",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_PromptedToRates_UserId",
                table: "PromptedToRates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RatedBooks_BookId",
                table: "RatedBooks",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_RatedBooks_RatingId",
                table: "RatedBooks",
                column: "RatingId");

            migrationBuilder.CreateIndex(
                name: "IX_RatedBooks_UserId",
                table: "RatedBooks",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Books_Users_SellerEmail",
                table: "Books",
                column: "SellerEmail",
                principalTable: "Users",
                principalColumn: "Email",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Books_Users_SellerEmail",
                table: "Books");

            migrationBuilder.DropTable(
                name: "ContactedSellers");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "PromptedToRates");

            migrationBuilder.DropTable(
                name: "RatedBooks");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Ratings_RaterId",
                table: "Ratings");

            migrationBuilder.DropIndex(
                name: "IX_EmailVerifications_VerificationCode",
                table: "EmailVerifications");

            migrationBuilder.DropIndex(
                name: "IX_Books_Author",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_Condition",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_Condition_Price",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsAvailable",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_IsAvailable_Condition",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_Price",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_SellerEmail",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_SellerEmail_IsAvailable",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_Title",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_Title_Author",
                table: "Books");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Books",
                type: "TEXT",
                maxLength: 500,
                nullable: false,
                defaultValue: "");
        }
    }
}
