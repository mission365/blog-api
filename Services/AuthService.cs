using System.Collections.Concurrent;
using BlogApi.Data;
using BlogApi.DTOs;
using BlogApi.Helpers;
using BlogApi.Models;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace BlogApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtHelper _jwtHelper;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    private static readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> VerificationCodes = new();
    private static readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> PasswordResetCodes = new();

    public AuthService(AppDbContext context, JwtHelper jwtHelper, IEmailService emailService, IConfiguration configuration, ILogger<AuthService> logger)
    {
        _context = context;
        _jwtHelper = jwtHelper;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var email = dto.Email.Trim();
        var username = dto.Username.Trim();
        if (await UserExistsAsync(email, username))
            throw new InvalidOperationException("User already exists with this email or username.");

        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = BC.HashPassword(dto.Password),
            Role = UserRoles.User
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await SendVerificationCodeAsync(email);
        _logger.LogInformation("User {UserId} registered.", user.Id);
        return ToAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var identifier = dto.UsernameOrEmail.Trim();
        var normalized = identifier.ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalized || u.Username.ToLower() == normalized);
        if (user is null || !BC.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid username/email or password.");
        if (user.IsPaused)
            throw new UnauthorizedAccessException("Your account is paused. Please contact an administrator.");

        _logger.LogInformation("User {UserId} signed in.", user.Id);
        return ToAuthResponse(user);
    }

    public Task<bool> UserExistsAsync(string email, string username)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var normalizedUsername = username.Trim().ToLowerInvariant();
        return _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail || u.Username.ToLower() == normalizedUsername);
    }

    public async Task<string> SendVerificationCodeAsync(string email)
    {
        var code = Random.Shared.Next(100000, 1000000).ToString();
        VerificationCodes[email.Trim().ToLowerInvariant()] = (code, DateTime.UtcNow.AddMinutes(15));
        await _emailService.SendVerificationEmailAsync(email.Trim(), code);
        return code;
    }

    public Task<bool> VerifyEmailAsync(VerifyEmailDto dto)
    {
        var email = dto.Email.Trim().ToLowerInvariant();
        if (!VerificationCodes.TryGetValue(email, out var record))
            throw new InvalidOperationException("No active verification code found for this email. Please request a new code.");
        if (DateTime.UtcNow > record.Expiry)
            throw new InvalidOperationException("Verification code has expired. Please request a new code.");
        if (!string.Equals(record.Code, dto.Code.Trim(), StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid verification code. Please check your email.");
        VerificationCodes.TryRemove(email, out _);
        return Task.FromResult(true);
    }

    public async Task<string> ForgotPasswordAsync(ForgotPasswordDto dto)
    {
        var identifier = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier)
            ?? throw new InvalidOperationException("No account found with this email or username.");
        var code = Random.Shared.Next(100000, 1000000).ToString();
        var expiry = DateTime.UtcNow.AddMinutes(15);
        PasswordResetCodes[user.Email.ToLowerInvariant()] = (code, expiry);
        PasswordResetCodes[user.Username.ToLowerInvariant()] = (code, expiry);
        await _emailService.SendPasswordResetEmailAsync(user.Email, code);
        return code;
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var identifier = dto.Email.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier)
            ?? throw new InvalidOperationException("User not found.");
        if (!PasswordResetCodes.TryGetValue(user.Email.ToLowerInvariant(), out var record) &&
            !PasswordResetCodes.TryGetValue(user.Username.ToLowerInvariant(), out record))
            throw new InvalidOperationException("No active password reset request found for this account. Please request a new code.");
        if (DateTime.UtcNow > record.Expiry)
            throw new InvalidOperationException("Password reset code has expired. Please request a new one.");
        if (!string.Equals(record.Code, dto.Code.Trim(), StringComparison.Ordinal))
            throw new InvalidOperationException("Invalid password reset code.");

        user.PasswordHash = BC.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();
        PasswordResetCodes.TryRemove(user.Email.ToLowerInvariant(), out _);
        PasswordResetCodes.TryRemove(user.Username.ToLowerInvariant(), out _);
        _logger.LogInformation("Password reset completed for user {UserId}.", user.Id);
        return true;
    }

    public async Task<bool> ChangePasswordAsync(ChangePasswordDto dto, string requesterUsername)
    {
        if (!string.Equals(dto.UsernameOrEmail.Trim(), requesterUsername, StringComparison.OrdinalIgnoreCase))
            throw new UnauthorizedAccessException("You can only change your own password.");
        var identifier = dto.UsernameOrEmail.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier)
            ?? throw new InvalidOperationException("User not found.");
        if (!BC.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new InvalidOperationException("Current password is incorrect.");
        user.PasswordHash = BC.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Password changed for user {UserId}.", user.Id);
        return true;
    }

    public Task<List<UserSummaryDto>> GetAllUsersAsync() => _context.Users
        .OrderByDescending(u => u.CreatedAt)
        .Select(u => new UserSummaryDto
        {
            Id = u.Id, Username = u.Username, Email = u.Email, Role = u.Role,
            IsPaused = u.IsPaused, CreatedAt = u.CreatedAt,
            PostCount = _context.Posts.Count(p => p.AuthorId == u.Id)
        }).ToListAsync();

    public async Task<bool> UpdateUserRoleAsync(int userId, string newRole, string requesterUsername)
    {
        var user = await _context.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        if (user.Username.Equals(requesterUsername, StringComparison.OrdinalIgnoreCase) && !newRole.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("You cannot remove your own administrator privileges.");
        user.Role = newRole.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase) ? UserRoles.Admin : UserRoles.User;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Administrator {Requester} changed role for user {UserId} to {Role}.", requesterUsername, userId, user.Role);
        return true;
    }

    public async Task<bool> ToggleUserStatusAsync(int userId, bool isPaused, string requesterUsername)
    {
        var user = await _context.Users.FindAsync(userId) ?? throw new KeyNotFoundException("User not found.");
        if (user.Username.Equals(requesterUsername, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("You cannot pause your own account.");
        user.IsPaused = isPaused;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Administrator {Requester} set paused={IsPaused} for user {UserId}.", requesterUsername, isPaused, userId);
        return true;
    }

    public async Task<bool> IsUserPausedAsync(string identifier)
    {
        if (string.IsNullOrWhiteSpace(identifier)) return false;
        var clean = identifier.Trim().ToLowerInvariant();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == clean || u.Username.ToLower() == clean);
        return user?.IsPaused ?? false;
    }

    private AuthResponseDto ToAuthResponse(User user)
    {
        var hours = _configuration.GetValue<double?>("Jwt:ExpireHours") ?? 3;
        return new AuthResponseDto
        {
            Token = _jwtHelper.GenerateToken(user), Username = user.Username, Email = user.Email,
            Role = user.Role, ExpiresAt = DateTime.UtcNow.AddHours(hours)
        };
    }
}
