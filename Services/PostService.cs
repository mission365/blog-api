using BlogApi.DTOs;
using BlogApi.Models;
using BlogApi.Repositories;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Http.HttpResults;

namespace BlogApi.Services
{
    public class PostService : IPostService
    {

        private readonly IPostRepository _repo;

        public PostService(IPostRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<PostDto>> GetAllAsync()
        {
            var posts = await _repo.GetAllAsync();

            return posts.Select(p => new PostDto
            {
                Id = p.Id,
                Title = p.Title,
                Content = p.Content
            }).ToList();
        }

        public async Task<PostDto?> GetByIdAsync(int id)
        {
            var post = await _repo.GetByIdAsync(id);

            if(post == null) return null;

            return new PostDto
            {
                Id = post.Id,
                Title = post.Title,
                Content = post.Content
            };
        }

        public async Task<PostDto> CreateAsync(CreatePostDto dto)
        {
            var post = new Post
            {
                Title = dto.Title,
                Content = dto.Content
            };

            var created = await _repo.AddAsync(post);

            return new PostDto
            {
                Id = created.Id,
                Title = created.Title,
                Content = created.Content
            };
        }

        public async Task<bool> UpdateAsync(int id, UpdatePostDto dto)
        {
            var post = await _repo.GetByIdAsync(id);

            if(post == null) return false;

            post.Title = dto.Title;
            post.Content = dto.Content;

            await _repo.UpdateAsync(post);

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var post = await _repo.GetByIdAsync(id);

            if(post == null) return false;

            await _repo.DeleteAsync(post);
            return true;
        }
    }

}