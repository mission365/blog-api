using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class ResetPasswordDto
    {
        [Required, EmailAddress]
        public required string Email { get; set; }

        [Required, RegularExpression("^[0-9]{6}$")]
        public required string Code { get; set; }

        [Required, StringLength(128, MinimumLength = 6)]
        public required string NewPassword { get; set; }
    }
}
