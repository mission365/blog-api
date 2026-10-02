using System.Security.Claims;
using BlogApi.DTOs;
using BlogApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BlogApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _service;
    public PostsController(IPostService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<PostDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string sort = "newest")
    {
        if (page < 1 || pageSize is < 1 or > 100)
            return BadRequest(new { message = "Page must be at least 1 and pageSize must be between 1 and 100." });
        return Ok(await _service.GetAllAsync(page, pageSize, search, sort));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PostDto>> GetById(int id)
    {
        var post = await _service.GetByIdAsync(id);
        return post is null ? NotFound(new { message = "Post not found." }) : Ok(post);
    }

    [Authorize]
    [HttpPost]
    public async Task<ActionResult<PostDto>> Create(CreatePostDto dto)
    {
        var created = await _service.CreateAsync(dto, GetRequesterId());
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdatePostDto dto)
    {
        await _service.UpdateAsync(id, dto, GetRequesterId(), User.IsInRole("Admin"));
        return NoContent();
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id, GetRequesterId(), User.IsInRole("Admin"));
        return NoContent();
    }

    private int GetRequesterId()
    {
        var value = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var id) ? id : throw new UnauthorizedAccessException("A valid user identity is required.");
    }
}
