using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        public required string Email { get; set; }

        [Required]
        public required string Code { get; set; }

        [Required]
        [MinLength(6)]
        public required string NewPassword { get; set; }
    }
}
