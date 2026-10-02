using System.ComponentModel.DataAnnotations;

namespace BlogApi.DTOs
{
    public class CreatePostDto
    {
        [Required, StringLength(100, MinimumLength = 1)]
        public required string Title {get; set;}

        [Required, StringLength(50000, MinimumLength = 1)]
        public required string Content {get; set;}
    }
}
