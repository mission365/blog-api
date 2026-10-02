using BlogApi.Data;
using BlogApi.Models;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Repositories
{
    public class PostRepository : IPostRepository
    {

        private readonly AppDbContext _context;

        public PostRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Post> Items, int TotalCount)> GetPageAsync(int page, int pageSize, string? search, string sort)
        {
            var query = _context.Posts.AsNoTracking().Include(p => p.Author).AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(p => p.Title.Contains(term) || p.Content.Contains(term));
            }

            query = sort.Equals("oldest", StringComparison.OrdinalIgnoreCase)
                ? query.OrderBy(p => p.Created)
                : sort.Equals("title", StringComparison.OrdinalIgnoreCase)
                    ? query.OrderBy(p => p.Title)
                    : query.OrderByDescending(p => p.Created);

            var totalCount = await query.CountAsync();
            var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
            return (items, totalCount);
        }

        public async Task<Post?> GetByIdAsync(int id)
        {
            return await _context.Posts.Include(p => p.Author).FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Post> AddAsync(Post post)
        {
            await _context.Posts.AddAsync(post);
            await _context.SaveChangesAsync();
            return post;
        }

        public async Task DeleteAsync(Post post)
        {
            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Post post)
        {
            _context.Posts.Update(post);
            await _context.SaveChangesAsync();
        }
    }
}
