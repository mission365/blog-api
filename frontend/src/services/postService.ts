import { apiClient } from './api';
import type { CreatePostDto, Post, UpdatePostDto } from '../types';

const LOCAL_STORAGE_POSTS_KEY = 'pulseblog_local_posts';
const LOCAL_STORAGE_DELETED_KEY = 'pulseblog_deleted_ids';
const LOCAL_STORAGE_CATEGORIES_KEY = 'pulseblog_post_categories';
const LOCAL_STORAGE_AUTHORS_KEY = 'pulseblog_post_authors';

function getCategoryMap(): Record<number, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getAuthorMap(): Record<number, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTHORS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePostCategory(id: number, category: string): void {
  try {
    const map = getCategoryMap();
    map[id] = category;
    localStorage.setItem(LOCAL_STORAGE_CATEGORIES_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save category mapping:', err);
  }
}

export function savePostAuthor(id: number, author: string): void {
  try {
    const map = getAuthorMap();
    map[id] = author;
    localStorage.setItem(LOCAL_STORAGE_AUTHORS_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save author mapping:', err);
  }
}

export const SAMPLE_POSTS: Post[] = [
  {
    id: 1,
    title: 'Architecting Scalable Web APIs with ASP.NET Core & Modern React',
    content: `Building modern web applications requires a clear separation of concerns between backend microservices and frontend clients. ASP.NET Core delivers rock-solid performance with its Kestrel web server, built-in dependency injection, and Entity Framework Core ORM.

When paired with a modern React frontend utilizing Vite and Tailwind CSS, developers achieve sub-second hot reloading, type-safe API contracts, and an ultra-responsive user interface.

Key architectural considerations include:
1. Clean RESTful controller patterns and DTO mappings.
2. Cross-Origin Resource Sharing (CORS) configurations.
3. Centralized API proxying in development environments.
4. Robust optimistic UI updates and skeleton loader states for smooth user experiences.`,
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    author: 'Alex Vance',
    category: 'Architecture',
    readTime: '5 min read',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Modern Web Development with Tailwind CSS and React 19',
    content: `Frontend development has matured dramatically with modern utility-first CSS frameworks and reactivity primitives. Tailwind CSS enables developers to construct intricate glassmorphism interfaces and fluid responsive layouts without leaving the JSX markup.

Combine this with React 19’s compiler enhancements, and you achieve near-instant initial render times and butter-smooth transitions across all device sizes.`,
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    author: 'Elena Rostova',
    category: 'Design & UX',
    readTime: '4 min read',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'High-Performance API Design and Database Optimization',
    content: `Optimizing API response latencies is critical for modern web applications. In this article, we examine database indexing strategies, query projection using Entity Framework Core, and caching patterns that reduce server workload by up to 80%.`,
    created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    author: 'Marcus Chen',
    category: 'Engineering',
    readTime: '6 min read',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
  },
];

// Helper to get locally saved posts
function getLocalPosts(): Post[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to save locally saved posts
function saveLocalPosts(posts: Post[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(posts));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Helper to get deleted IDs
function getDeletedIds(): number[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Helper to record deleted ID
function recordDeletedId(id: number): void {
  try {
    const ids = getDeletedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(LOCAL_STORAGE_DELETED_KEY, JSON.stringify(ids));
    }
  } catch (err) {
    console.error('Failed to update deleted IDs:', err);
  }
}

export function enrichPost(post: { id: number; title: string; content: string; created?: string; category?: string; author?: string }): Post {
  const words = (post.content || '').trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  
  const covers = [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
  ];

  const defaultCategories = ['Architecture', 'Design & UX', 'Engineering', 'Security', 'DevOps'];
  const index = Math.abs(post.id) % covers.length;
  const categoryMap = getCategoryMap();
  const authorMap = getAuthorMap();

  const resolvedCategory = post.category || categoryMap[post.id] || defaultCategories[index];
  const resolvedAuthor = post.author || authorMap[post.id] || 'Editorial Team';

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    created: post.created || new Date().toISOString(),
    author: resolvedAuthor,
    category: resolvedCategory,
    readTime: `${minutes} min read`,
    coverImage: covers[index],
  };
}

export const postService = {
  async getAllPosts(): Promise<Post[]> {
    const deletedIds = getDeletedIds();
    const localPosts = getLocalPosts().filter((p) => !deletedIds.includes(p.id));

    try {
      const serverPosts = await apiClient.get<Array<{ id: number; title: string; content: string }>>('/Posts');
      if (Array.isArray(serverPosts) && serverPosts.length > 0) {
        const enrichedServer = serverPosts
          .filter((p) => !deletedIds.includes(p.id))
          .map(enrichPost);

        // Combine server posts with locally created posts (avoid duplicates by ID)
        const combined = [...localPosts];
        for (const s of enrichedServer) {
          if (!combined.some((p) => p.id === s.id)) {
            combined.push(s);
          }
        }
        return combined;
      }
    } catch (err) {
      console.warn('ASP.NET backend unreachable, using local posts and sample posts:', err);
    }

    // Fallback: merge local posts with default sample posts
    const baseSamples = SAMPLE_POSTS.filter((p) => !deletedIds.includes(p.id));
    const combined = [...localPosts];
    for (const s of baseSamples) {
      if (!combined.some((p) => p.id === s.id)) {
        combined.push(s);
      }
    }
    return combined;
  },

  async getPostById(id: number): Promise<Post> {
    const deletedIds = getDeletedIds();
    if (deletedIds.includes(id)) {
      throw new Error(`Post with ID #${id} has been deleted.`);
    }

    // Check local posts first
    const localPosts = getLocalPosts();
    const localMatch = localPosts.find((p) => p.id === id);
    if (localMatch) {
      return localMatch;
    }

    // Try backend
    try {
      const serverPost = await apiClient.get<{ id: number; title: string; content: string }>(`/Posts/${id}`);
      if (serverPost && serverPost.id) {
        return enrichPost(serverPost);
      }
    } catch (err) {
      console.warn(`Could not fetch post ${id} from server:`, err);
    }

    // Check sample posts
    const sample = SAMPLE_POSTS.find((p) => p.id === id);
    if (sample) return sample;

    throw new Error(`Post with ID #${id} not found.`);
  },

  async createPost(dto: CreatePostDto): Promise<{ post: Post; isSyncedWithBackend: boolean }> {
    let serverCreated: { id: number; title: string; content: string } | null = null;
    let isSynced = false;

    try {
      serverCreated = await apiClient.post<{ id: number; title: string; content: string }>('/Posts', {
        title: dto.title,
        content: dto.content,
      });
      isSynced = true;
    } catch (err) {
      console.warn('Backend unavailable during post creation, saving locally:', err);
    }

    const postId = serverCreated?.id || Date.now();
    if (dto.category) {
      savePostCategory(postId, dto.category);
    }
    if (dto.author) {
      savePostAuthor(postId, dto.author);
    }

    const newPost: Post = enrichPost({
      id: postId,
      title: dto.title,
      content: dto.content,
      category: dto.category,
      author: dto.author,
      created: new Date().toISOString(),
    });

    // Save to local storage so it immediately persists across reloads
    const localPosts = getLocalPosts();
    localPosts.unshift(newPost);
    saveLocalPosts(localPosts);

    return { post: newPost, isSyncedWithBackend: isSynced };
  },

  async updatePost(id: number, dto: UpdatePostDto): Promise<{ isSyncedWithBackend: boolean }> {
    const sessionRaw = localStorage.getItem('blog_user_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const isAdmin = session?.role?.toLowerCase() === 'admin';
    const authorMap = getAuthorMap();
    const postAuthor = authorMap[id];

    if (postAuthor && !isAdmin && session?.username && postAuthor.toLowerCase() !== session.username.toLowerCase()) {
      throw new Error("Permission denied: You can only edit your own posts. Admin posts cannot be modified.");
    }

    let isSynced = false;
    try {
      await apiClient.put(`/Posts/${id}`, {
        title: dto.title,
        content: dto.content,
      });
      isSynced = true;
    } catch (err) {
      console.warn(`Backend unavailable during update of post ${id}, updating locally:`, err);
    }

    if (dto.category) {
      savePostCategory(id, dto.category);
    }

    // Update in local storage
    const localPosts = getLocalPosts();
    const index = localPosts.findIndex((p) => p.id === id);
    if (index !== -1) {
      localPosts[index].title = dto.title;
      localPosts[index].content = dto.content;
      if (dto.category) {
        localPosts[index].category = dto.category;
      }
      saveLocalPosts(localPosts);
    } else {
      const updated = enrichPost({ id, title: dto.title, content: dto.content, category: dto.category });
      localPosts.unshift(updated);
      saveLocalPosts(localPosts);
    }

    return { isSyncedWithBackend: isSynced };
  },

  async deletePost(id: number): Promise<{ isSyncedWithBackend: boolean }> {
    const sessionRaw = localStorage.getItem('blog_user_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    const isAdmin = session?.role?.toLowerCase() === 'admin';
    const authorMap = getAuthorMap();
    const postAuthor = authorMap[id];

    if (postAuthor && !isAdmin && session?.username && postAuthor.toLowerCase() !== session.username.toLowerCase()) {
      throw new Error("Permission denied: You can only delete your own posts. Admin posts cannot be removed.");
    }

    let isSynced = false;
    try {
      await apiClient.delete(`/Posts/${id}`);
      isSynced = true;
    } catch (err) {
      console.warn(`Backend unavailable during deletion of post ${id}:`, err);
    }

    // Remove from local posts and mark deleted
    const localPosts = getLocalPosts().filter((p) => p.id !== id);
    saveLocalPosts(localPosts);
    recordDeletedId(id);

    return { isSyncedWithBackend: isSynced };
  },

  async getUserPosts(username: string): Promise<Post[]> {
    const allPosts = await this.getAllPosts();
    if (!username) return allPosts;
    return allPosts.filter(
      (p) => p.author?.toLowerCase() === username.toLowerCase()
    );
  },
};
