using System;
using System.Threading.Tasks;
using BlogApi.Data;
using BlogApi.DTOs;
using BlogApi.Models;
using BlogApi.Repositories;
using BlogApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BlogApi.Tests;

public sealed class PostServiceTests
{
    [Fact]
    public async Task User_can_update_owned_post_but_not_another_users_post()
    {
        await using var db = CreateDb();
        db.Users.AddRange(
            new User { Id = 1, Email = "one@example.com", Username = "one", PasswordHash = "hash" },
            new User { Id = 2, Email = "two@example.com", Username = "two", PasswordHash = "hash" });
        db.Posts.Add(new Post { Id = 1, Title = "Original", Content = "Content", AuthorId = 1 });
        await db.SaveChangesAsync();
        var service = new PostService(new PostRepository(db), NullLogger<PostService>.Instance);

        await service.UpdateAsync(1, new UpdatePostDto { Title = "Updated", Content = "New content" }, 1, false);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.UpdateAsync(1, new UpdatePostDto { Title = "No", Content = "Access" }, 2, false));
    }

    [Fact]
    public async Task Post_listing_is_paginated_and_searchable()
    {
        await using var db = CreateDb();
        db.Posts.AddRange(
            new Post { Title = "C# APIs", Content = "dotnet", Created = DateTime.UtcNow.AddDays(-2) },
            new Post { Title = "React UI", Content = "frontend", Created = DateTime.UtcNow.AddDays(-1) });
        await db.SaveChangesAsync();
        var service = new PostService(new PostRepository(db), NullLogger<PostService>.Instance);

        var result = await service.GetAllAsync(1, 1, "React", "newest");

        Assert.Single(result.Items);
        Assert.Equal("React UI", result.Items[0].Title);
        Assert.Equal(1, result.TotalCount);
    }

    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
