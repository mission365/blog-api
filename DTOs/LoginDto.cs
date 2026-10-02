using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class LoginDto
    {
        [Required, StringLength(100)]
        public required string UsernameOrEmail { get; set;}

        [Required, StringLength(128)]
        public required string Password { get; set; }
    }
}
