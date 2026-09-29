namespace BlogApi.DTOs
{
    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public bool IsPaused { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public int PostCount { get; set; }
    }
}
