using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace BlogApi.Migrations;

[DbContext(typeof(BlogApi.Data.AppDbContext))]
[Migration("20261002000100_AddPostOwnershipAndUserPauseStatus")]
public partial class AddPostOwnershipAndUserPauseStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsPaused",
            table: "Users",
            type: "bit",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<int>(
            name: "AuthorId",
            table: "Posts",
            type: "int",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Posts_AuthorId",
            table: "Posts",
            column: "AuthorId");

        migrationBuilder.AddForeignKey(
            name: "FK_Posts_Users_AuthorId",
            table: "Posts",
            column: "AuthorId",
            principalTable: "Users",
            principalColumn: "Id",
            onDelete: ReferentialAction.SetNull);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_Posts_Users_AuthorId", table: "Posts");
        migrationBuilder.DropIndex(name: "IX_Posts_AuthorId", table: "Posts");
        migrationBuilder.DropColumn(name: "AuthorId", table: "Posts");
        migrationBuilder.DropColumn(name: "IsPaused", table: "Users");
    }
}
