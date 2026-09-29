using System.Collections.Concurrent;
using BlogApi.Data;
using BlogApi.DTOs;
using BlogApi.Models;
using BlogApi.Helpers;
using Microsoft.EntityFrameworkCore;
using BC = BCrypt.Net.BCrypt;

namespace BlogApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtHelper _jwtHelper;
        private readonly IEmailService _emailService;

        // In-memory code stores for email verification and password reset
        private static readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> _verificationCodes = new();
        private static readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> _passwordResetCodes = new();
        private static readonly ConcurrentDictionary<string, bool> _verifiedEmails = new();

        public AuthService(AppDbContext context, JwtHelper jwtHelper, IEmailService emailService)
        {
            _context = context;
            _jwtHelper = jwtHelper;
            _emailService = emailService;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (await UserExistsAsync(dto.Email, dto.Username))
                throw new Exception("User already exists with this email or username");

            var isAdmin = dto.Email.Trim().Equals("mission.use02@gmail.com", StringComparison.OrdinalIgnoreCase) ||
                          dto.Username.Trim().Equals("mission.use02", StringComparison.OrdinalIgnoreCase) ||
                          dto.Username.Trim().Equals("mission02", StringComparison.OrdinalIgnoreCase);

            var user = new User
            {
                Email = dto.Email.Trim(),
                Username = dto.Username.Trim(),
                PasswordHash = BC.HashPassword(dto.Password),
                Role = isAdmin ? UserRoles.Admin : UserRoles.User
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Automatically generate email verification code
            var code = await SendVerificationCodeAsync(dto.Email);

            var token = _jwtHelper.GenerateToken(user);
            return new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.UsernameOrEmail || u.Username == dto.UsernameOrEmail);

            if (user == null)
                throw new Exception("Invalid username/email or password");

            if (!BC.Verify(dto.Password, user.PasswordHash))
                throw new Exception("Invalid username/email or password");

            if (user.IsPaused)
            {
                throw new Exception("Your account is paused. Please mail to open your account.");
            }

            if (user.Email.Trim().Equals("mission.use02@gmail.com", StringComparison.OrdinalIgnoreCase) && user.Role != UserRoles.Admin)
            {
                user.Role = UserRoles.Admin;
                await _context.SaveChangesAsync();
            }

            var token = _jwtHelper.GenerateToken(user);
            return new AuthResponseDto
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };
        }

        public async Task<bool> UserExistsAsync(string email, string username)
        {
            return await _context.Users.AnyAsync(u => u.Email == email || u.Username == username);
        }

        public async Task<string> SendVerificationCodeAsync(string email)
        {
            var code = Random.Shared.Next(100000, 999999).ToString();
            _verificationCodes[email.ToLower()] = (code, DateTime.UtcNow.AddMinutes(15));

            Console.WriteLine("\n========================================================");
            Console.WriteLine($"📧 [EMAIL VERIFICATION DISPATCH: {email}]");
            Console.WriteLine($"   Verification Code: {code}");
            Console.WriteLine("========================================================\n");

            await _emailService.SendVerificationEmailAsync(email, code);
            return code;
        }

        public Task<bool> VerifyEmailAsync(VerifyEmailDto dto)
        {
            var email = dto.Email.ToLower();
            if (_verificationCodes.TryGetValue(email, out var record))
            {
                if (DateTime.UtcNow > record.Expiry)
                    throw new Exception("Verification code has expired. Please request a new code.");

                if (record.Code != dto.Code.Trim())
                    throw new Exception("Invalid verification code. Please check your email.");

                _verifiedEmails[email] = true;
                _verificationCodes.TryRemove(email, out _);
                return Task.FromResult(true);
            }

            throw new Exception("No active verification code found for this email. Please request a new code.");
        }

        public async Task<string> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var identifier = dto.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier);
            if (user == null)
                throw new Exception("No account found with this email or username.");

            var emailKey = user.Email.ToLower();
            var usernameKey = user.Username.ToLower();
            var code = Random.Shared.Next(100000, 999999).ToString();

            _passwordResetCodes[emailKey] = (code, DateTime.UtcNow.AddMinutes(15));
            _passwordResetCodes[usernameKey] = (code, DateTime.UtcNow.AddMinutes(15));
            _passwordResetCodes[identifier] = (code, DateTime.UtcNow.AddMinutes(15));

            Console.WriteLine("\n========================================================");
            Console.WriteLine($"📧 [PASSWORD RESET DISPATCH: {user.Email} (User: {user.Username})]");
            Console.WriteLine($"   Reset Code: {code}");
            Console.WriteLine("========================================================\n");

            await _emailService.SendPasswordResetEmailAsync(user.Email, code);
            return code;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var identifier = dto.Email.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.Username.ToLower() == identifier);
            if (user == null)
                throw new Exception("User not found.");

            var emailKey = user.Email.ToLower();
            var usernameKey = user.Username.ToLower();

            if (!_passwordResetCodes.TryGetValue(emailKey, out var record) &&
                !_passwordResetCodes.TryGetValue(usernameKey, out record) &&
                !_passwordResetCodes.TryGetValue(identifier, out record))
            {
                throw new Exception("No active password reset request found for this account. Please request a new code.");
            }

            if (DateTime.UtcNow > record.Expiry)
                throw new Exception("Password reset code has expired. Please request a new one.");

            if (record.Code != dto.Code.Trim())
                throw new Exception("Invalid password reset code.");

            user.PasswordHash = BC.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            _passwordResetCodes.TryRemove(emailKey, out _);
            _passwordResetCodes.TryRemove(usernameKey, out _);
            _passwordResetCodes.TryRemove(identifier, out _);
            return true;
        }

        public async Task<bool> ChangePasswordAsync(ChangePasswordDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => 
                u.Email == dto.UsernameOrEmail || u.Username == dto.UsernameOrEmail);

            if (user == null)
                throw new Exception("User not found.");

            if (!BC.Verify(dto.CurrentPassword, user.PasswordHash))
                throw new Exception("Current password is incorrect.");

            user.PasswordHash = BC.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<UserSummaryDto>> GetAllUsersAsync()
        {
            return await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new UserSummaryDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    Role = u.Role,
                    IsPaused = u.IsPaused,
                    CreatedAt = u.CreatedAt,
                    PostCount = 0
                })
                .ToListAsync();
        }

        public async Task<bool> UpdateUserRoleAsync(int userId, string newRole, string requesterUsername)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("User not found.");

            if (!string.IsNullOrEmpty(requesterUsername) && 
                user.Username.Equals(requesterUsername, StringComparison.OrdinalIgnoreCase) && 
                !newRole.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("You cannot remove your own administrator privileges.");
            }

            user.Role = newRole.Equals(UserRoles.Admin, StringComparison.OrdinalIgnoreCase) ? UserRoles.Admin : UserRoles.User;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleUserStatusAsync(int userId, bool isPaused, string requesterUsername)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new Exception("User not found.");

            if (!string.IsNullOrEmpty(requesterUsername) && 
                user.Username.Equals(requesterUsername, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("You cannot pause your own account.");
            }

            if (user.Email.Trim().Equals("mission.use02@gmail.com", StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("The primary administrator account cannot be paused.");
            }

            user.IsPaused = isPaused;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IsUserPausedAsync(string identifier)
        {
            if (string.IsNullOrWhiteSpace(identifier))
                return false;

            var clean = identifier.Trim().ToLower();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == clean || u.Username.ToLower() == clean);
            return user?.IsPaused ?? false;
        }
    }
}