using BlogApi.Models;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace BlogApi.Data;

public static class DatabaseInitializer
{
    public static async Task SeedInitialAdminAsync(IServiceProvider services, IConfiguration configuration)
    {
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseInitializer");
        var email = configuration["InitialAdmin:Email"]?.Trim();
        var username = configuration["InitialAdmin:Username"]?.Trim();
        var password = configuration["InitialAdmin:Password"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogInformation("Initial admin seeding is disabled because InitialAdmin settings are incomplete.");
            return;
        }

        if (!new System.ComponentModel.DataAnnotations.EmailAddressAttribute().IsValid(email) || password.Length < 6)
        {
            logger.LogWarning("Initial admin seeding was skipped because the configured email or password is invalid.");
            return;
        }

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (!await db.Database.CanConnectAsync())
        {
            logger.LogWarning("Initial admin seeding was skipped because the database is unavailable. Apply migrations before starting the API.");
            return;
        }

        try
        {
            var normalizedEmail = email.ToLowerInvariant();
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail || u.Username == username);
            if (user is null)
            {
                db.Users.Add(new User
                {
                    Email = email,
                    Username = username,
                    PasswordHash = BC.HashPassword(password),
                    Role = UserRoles.Admin
                });
                await db.SaveChangesAsync();
                logger.LogInformation("Configured initial administrator account {Username} was created.", username);
                return;
            }

            if (!string.Equals(user.Role, UserRoles.Admin, StringComparison.OrdinalIgnoreCase))
            {
                user.Role = UserRoles.Admin;
                await db.SaveChangesAsync();
                logger.LogInformation("Configured initial administrator account {Username} was promoted.", user.Username);
            }
        }
        catch (Exception)
        {
            logger.LogWarning("Initial admin seeding was skipped. Apply the EF Core migrations before provisioning the administrator.");
        }
    }
}
