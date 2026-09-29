// Services/IAuthService.cs
using BlogApi.DTOs;

namespace BlogApi.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<bool> UserExistsAsync(string email, string username);
        Task<string> SendVerificationCodeAsync(string email);
        Task<bool> VerifyEmailAsync(VerifyEmailDto dto);
        Task<string> ForgotPasswordAsync(ForgotPasswordDto dto);
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
        Task<bool> ChangePasswordAsync(ChangePasswordDto dto);
        Task<List<UserSummaryDto>> GetAllUsersAsync();
        Task<bool> UpdateUserRoleAsync(int userId, string newRole, string requesterUsername);
        Task<bool> ToggleUserStatusAsync(int userId, bool isPaused, string requesterUsername);
    }
}