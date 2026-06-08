namespace BlogApi.DTOs
{
    public class CreatePostDto
    {
        public required string Title {get; set;}
        public required string Content {get; set;}
    }
}