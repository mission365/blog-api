using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class UpdateUserRoleDto
    {
        [Required, RegularExpression("^(Admin|User)$", ErrorMessage = "Role must be Admin or User.")]
        public required string Role { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsPaused { get; set; }
    }
}
