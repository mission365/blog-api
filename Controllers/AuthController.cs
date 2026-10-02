using BlogApi.DTOs;
using BlogApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto) => Ok(await _authService.RegisterAsync(dto));

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto) => Ok(await _authService.LoginAsync(dto));

    [HttpPost("send-verification-code")]
    public async Task<IActionResult> SendVerificationCode(ForgotPasswordDto dto)
    {
        await _authService.SendVerificationCodeAsync(dto.Email);
        return Ok(new { message = "A verification code has been dispatched to your email inbox." });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
        => Ok(new { success = await _authService.VerifyEmailAsync(dto), message = "Email verified successfully!" });

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
    {
        await _authService.ForgotPasswordAsync(dto);
        return Ok(new { message = "A password reset code has been sent to your email inbox." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        => Ok(new { success = await _authService.ResetPasswordAsync(dto), message = "Password reset successfully." });

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var requester = User.Identity?.Name ?? throw new UnauthorizedAccessException("A valid user identity is required.");
        return Ok(new { success = await _authService.ChangePasswordAsync(dto, requester), message = "Password changed successfully." });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("users")]
    public async Task<ActionResult<List<UserSummaryDto>>> GetAllUsers() => Ok(await _authService.GetAllUsersAsync());

    [Authorize(Roles = "Admin")]
    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, UpdateUserRoleDto dto)
    {
        await _authService.UpdateUserRoleAsync(id, dto.Role, User.Identity?.Name ?? string.Empty);
        return Ok(new { success = true, role = dto.Role, message = $"User role successfully updated to {dto.Role}." });
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("users/{id:int}/status")]
    public async Task<IActionResult> ToggleUserStatus(int id, UpdateUserStatusDto dto)
    {
        await _authService.ToggleUserStatusAsync(id, dto.IsPaused, User.Identity?.Name ?? string.Empty);
        var statusText = dto.IsPaused ? "paused" : "resumed";
        return Ok(new { success = true, isPaused = dto.IsPaused, message = $"User account successfully {statusText}." });
    }

    [HttpGet("check-paused")]
    public async Task<IActionResult> CheckPaused([FromQuery] string email)
        => Ok(new { isPaused = await _authService.IsUserPausedAsync(email) });
}
