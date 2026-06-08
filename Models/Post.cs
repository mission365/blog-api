using System.ComponentModel.DataAnnotations;

namespace BlogApi.Models
{
    public class Post
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public required string Title { get; set; }

        [Required]
        public required string Content { get; set; }

        public DateTime Created { get; set; } = DateTime.UtcNow;
    }
}