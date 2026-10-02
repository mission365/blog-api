using System.Security.Claims;
using BlogApi.Data;
using BlogApi.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace BlogApi.Services;

public sealed class DatabaseClaimsTransformation : IClaimsTransformation
{
    private readonly AppDbContext _db;
    private readonly ILogger<DatabaseClaimsTransformation> _logger;

    public DatabaseClaimsTransformation(AppDbContext db, ILogger<DatabaseClaimsTransformation> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
    {
        var identity = principal.Identity as ClaimsIdentity;
        var email = principal.FindFirstValue(ClaimTypes.Email) ?? principal.FindFirst("email")?.Value;
        if (identity is null || string.IsNullOrWhiteSpace(email) || identity.HasClaim(c => c.Type == ClaimTypes.NameIdentifier && int.TryParse(c.Value, out _)))
        {
            return principal;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user is null)
        {
            var preferredUsername = principal.FindFirstValue(ClaimTypes.Name) ?? principal.FindFirst("name")?.Value;
            var username = string.IsNullOrWhiteSpace(preferredUsername) ? normalizedEmail.Split('@')[0] : preferredUsername.Trim();
            if (await _db.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
            {
                username = $"{username}-{Guid.NewGuid():N}"[..Math.Min(50, username.Length + 33)];
            }

            user = new User
            {
                Email = email.Trim(),
                Username = username,
                PasswordHash = BC.HashPassword(Guid.NewGuid().ToString("N")),
                Role = UserRoles.User
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Provisioned a local profile for Firebase user {UserId}.", user.Id);
        }

        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()));
        identity.AddClaim(new Claim(ClaimTypes.Name, user.Username));
        identity.AddClaim(new Claim(ClaimTypes.Role, user.Role));
        return principal;
    }
}
