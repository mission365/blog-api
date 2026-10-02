using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class VerifyEmailDto
    {
        [Required, RegularExpression("^[0-9]{6}$")]
        [EmailAddress]
        public required string Email { get; set; }

        [Required]
        public required string Code { get; set; }
    }
}
