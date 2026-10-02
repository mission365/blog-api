using BlogApi.Models;

namespace BlogApi.Repositories
{
    public interface IPostRepository
    {
        Task<(List<Post> Items, int TotalCount)> GetPageAsync(int page, int pageSize, string? search, string sort);
        Task<Post?> GetByIdAsync(int id);
        Task<Post> AddAsync(Post post);
        Task UpdateAsync(Post post);
        Task DeleteAsync(Post post);
    }
}
