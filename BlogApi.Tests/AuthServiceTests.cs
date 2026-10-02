using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BlogApi.Data;
using BlogApi.DTOs;
using BlogApi.Helpers;
using BlogApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BlogApi.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task Registration_does_not_promote_a_special_email_to_admin()
    {
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "a-strong-test-key-with-at-least-32-bytes",
            ["Jwt:Issuer"] = "BlogApi",
            ["Jwt:Audience"] = "BlogApiUsers",
            ["Jwt:ExpireHours"] = "3"
        }).Build();
        var service = new AuthService(db, new JwtHelper(config), new NoopEmailService(), config, NullLogger<AuthService>.Instance);

        var result = await service.RegisterAsync(new RegisterDto
        {
            Email = "mission.use02@gmail.com",
            Username = "mission02",
            Password = "safe-password"
        });

        Assert.Equal("User", result.Role);
    }

    private sealed class NoopEmailService : IEmailService
    {
        public Task SendVerificationEmailAsync(string toEmail, string code) => Task.CompletedTask;
        public Task SendPasswordResetEmailAsync(string toEmail, string code) => Task.CompletedTask;
    }
}
