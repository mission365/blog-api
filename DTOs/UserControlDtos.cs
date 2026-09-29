namespace BlogApi.DTOs
{
    public class UpdateUserRoleDto
    {
        public required string Role { get; set; }
    }

    public class UpdateUserStatusDto
    {
        public bool IsPaused { get; set; }
    }
}
