namespace BlogApi.DTOs
{
    public class PostDto
    {
        public int Id { get; set;}
        public required string Title {get; set;}
        public required string Content {get; set;}
        public DateTime Created { get; set; }
        public int? AuthorId { get; set; }
        public string? Author { get; set; }
    }
}
