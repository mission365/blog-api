using BlogApi.DTOs;
using BlogApi.Models;
using BlogApi.Repositories;

namespace BlogApi.Services;

public class PostService : IPostService
{
    private readonly IPostRepository _repo;
    private readonly ILogger<PostService> _logger;

    public PostService(IPostRepository repo, ILogger<PostService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<PagedResultDto<PostDto>> GetAllAsync(int page, int pageSize, string? search, string sort)
    {
        var (items, totalCount) = await _repo.GetPageAsync(page, pageSize, search, sort);
        return new PagedResultDto<PostDto>
        {
            Items = items.Select(ToDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<PostDto?> GetByIdAsync(int id)
    {
        var post = await _repo.GetByIdAsync(id);
        return post is null ? null : ToDto(post);
    }

    public async Task<PostDto> CreateAsync(CreatePostDto dto, int authorId)
    {
        var post = new Post { Title = dto.Title.Trim(), Content = dto.Content.Trim(), AuthorId = authorId };
        var created = await _repo.AddAsync(post);
        _logger.LogInformation("Post {PostId} created by user {UserId}.", created.Id, authorId);
        return ToDto(created);
    }

    public async Task UpdateAsync(int id, UpdatePostDto dto, int requesterId, bool isAdmin)
    {
        var post = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Post not found.");
        EnsureCanManage(post, requesterId, isAdmin);
        post.Title = dto.Title.Trim();
        post.Content = dto.Content.Trim();
        await _repo.UpdateAsync(post);
        _logger.LogInformation("Post {PostId} updated by user {UserId}.", id, requesterId);
    }

    public async Task DeleteAsync(int id, int requesterId, bool isAdmin)
    {
        var post = await _repo.GetByIdAsync(id) ?? throw new KeyNotFoundException("Post not found.");
        EnsureCanManage(post, requesterId, isAdmin);
        await _repo.DeleteAsync(post);
        _logger.LogInformation("Post {PostId} deleted by user {UserId}.", id, requesterId);
    }

    private static void EnsureCanManage(Post post, int requesterId, bool isAdmin)
    {
        if (!isAdmin && (post.AuthorId is null || post.AuthorId != requesterId))
        {
            throw new UnauthorizedAccessException("You can only manage your own posts.");
        }
    }

    private static PostDto ToDto(Post post) => new()
    {
        Id = post.Id,
        Title = post.Title,
        Content = post.Content,
        Created = post.Created,
        AuthorId = post.AuthorId,
        Author = post.Author?.Username
    };
}
