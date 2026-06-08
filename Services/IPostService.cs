using BlogApi.DTOs;

namespace BlogApi.Services
{
    public interface IPostService
    {
        Task<List<PostDto>> GetAllAsync();
        Task<PostDto?> GetByIdAsync(int id);
        Task<PostDto> CreateAsync(CreatePostDto dto);
        Task<bool> UpdateAsync(int id, UpdatePostDto dto);
        Task<bool> DeleteAsync(int id);
    }
}