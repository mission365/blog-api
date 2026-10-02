using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class ForgotPasswordDto
    {
        [Required, EmailAddress]
        public required string Email { get; set; }
    }
}
