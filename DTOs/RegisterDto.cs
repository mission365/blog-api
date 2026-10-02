using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class RegisterDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set;}

        [Required]
        [StringLength(50, MinimumLength = 3)]
        [RegularExpression("^[a-zA-Z0-9_.-]+$")]
        public required string Username { get; set; }

        [Required]
        [StringLength(128, MinimumLength = 6)]
        public required string Password { get; set; }
    }
}
