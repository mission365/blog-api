using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class ForgotPasswordDto
    {
        [Required]
        public required string Email { get; set; }
    }
}
