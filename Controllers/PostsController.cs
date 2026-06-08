using BlogApi.Data;
using BlogApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BlogApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class PostsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PostsController(AppDbContext context)
        {
            _context = context;
        }


        [HttpGet] 
        public async Task<IActionResult> GetAll()
        {
            var posts = await _context.Posts.ToListAsync();
            return Ok(posts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var post= await _context.Posts.FindAsync(id);
            if(post != null)
            {
                return Ok(post);
            }
            return NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Create(Post post)
        {
            if(!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _context.Posts.AddAsync(post);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = post.Id}, post);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Post updatePost)
        {
            var post = await _context.Posts.FindAsync(id);
            if(post != null)
            {
                post.Title = updatePost.Title;
                post.Content = updatePost.Content;

                await _context.SaveChangesAsync();

                return Ok(post);
            }

            return NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var post = await _context.Posts.FindAsync(id);
            if(post != null)
            {
                _context.Posts.Remove(post);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            return NotFound();
        }
    }
}