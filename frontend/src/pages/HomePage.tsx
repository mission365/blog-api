import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';
import { postService } from '../services/postService';
import type { Post } from '../types';
import { PostCardSkeleton } from '../components/LoadingSkeleton';

export const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Architecture', 'Security', 'Design & UX', 'Engineering', 'DevOps', 'AWS'];

  const fetchPosts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await postService.getAllPosts();
      setPosts(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load posts from API';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const featuredPost = posts[0];
  const regularPosts = filteredPosts.filter((p) => p.id !== (featuredPost && selectedCategory === 'All' && !searchQuery ? featuredPost.id : -1));

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-slate-800/60">
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl rounded-full pointer-events-none transform -translate-y-12" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Write your thoughts
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Master the Modern Web
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Deep technical insights on software engineering, system architecture, and cutting-edge web development
          </p>

          {/* Search Bar & Category Filter */}
          <div className="max-w-2xl mx-auto pt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by title, keywords or content..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-lg"
              />
            </div>

            {/* Categories */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Error Banner */}
        {error && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-center justify-between text-rose-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={fetchPosts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold text-rose-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry API
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <PostCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {/* Featured Post (Only show on first load with no search query) */}
        {!isLoading && !searchQuery && selectedCategory === 'All' && featuredPost && (
          <div className="relative group">
            <div className="glass-card rounded-3xl overflow-hidden border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 h-64 lg:h-auto relative overflow-hidden">
                <img
                  src={featuredPost.coverImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop'}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent lg:hidden" />
              </div>
              <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Featured Article
                    </span>
                    <span className="text-xs text-slate-400">{featuredPost.readTime || '5 min read'}</span>
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    <Link to={`/posts/${featuredPost.id}`}>{featuredPost.title}</Link>
                  </h2>
                  <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                    {featuredPost.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-300">
                      {featuredPost.author?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{featuredPost.author || 'Editorial Team'}</p>
                      <p className="text-[11px] text-slate-400">
                        {featuredPost.created ? new Date(featuredPost.created).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/posts/${featuredPost.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group/btn"
                  >
                    Read Story
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        {!isLoading && regularPosts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {searchQuery || selectedCategory !== 'All' ? 'Matching Articles' : 'Recent Articles'}
              </h2>
              <span className="text-xs text-slate-400">
                {regularPosts.length} {regularPosts.length === 1 ? 'post' : 'posts'} available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <article
                  key={post.id}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col group border border-slate-800/80 hover:border-indigo-500/30 transition-all duration-300"
                >
                  <div className="h-48 relative overflow-hidden bg-slate-900">
                    <img
                      src={post.coverImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop'}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-indigo-300 border border-slate-700">
                        {post.category || 'Article'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.created ? new Date(post.created).toLocaleDateString() : 'Recent'}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime || '4 min read'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                        <Link to={`/posts/${post.id}`}>{post.title}</Link>
                      </h3>

                      <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {post.author ? post.author.charAt(0) : <UserIcon className="w-3 h-3" />}
                        </div>
                        <span className="text-xs text-slate-300 font-medium">
                          {post.author || 'Author'}
                        </span>
                      </div>

                      <Link
                        to={`/posts/${post.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group/link"
                      >
                        Read Post
                        <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPosts.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl glass-card border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">No articles found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              No matching posts for &quot;{searchQuery}&quot;. Try adjusting your search query or selected category.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
