using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class ChangePasswordDto
    {
        [Required]
        public required string UsernameOrEmail { get; set; }

        [Required]
        public required string CurrentPassword { get; set; }

        [Required]
        [StringLength(128, MinimumLength = 6)]
        public required string NewPassword { get; set; }
    }
}
