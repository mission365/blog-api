using BlogApi.DTOs;

namespace BlogApi.Services
{
    public interface IPostService
    {
        Task<PagedResultDto<PostDto>> GetAllAsync(int page, int pageSize, string? search, string sort);
        Task<PostDto?> GetByIdAsync(int id);
        Task<PostDto> CreateAsync(CreatePostDto dto, int authorId);
        Task UpdateAsync(int id, UpdatePostDto dto, int requesterId, bool isAdmin);
        Task DeleteAsync(int id, int requesterId, bool isAdmin);
    }
}
