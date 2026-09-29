import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Edit3, 
  Share2, 
  Trash2, 
  Check, 
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { postService } from '../services/postService';
import type { Post } from '../types';
import { PostDetailSkeleton } from '../components/LoadingSkeleton';
import { ConfirmModal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const isAuthor = Boolean(user && post?.author && post.author.toLowerCase() === user.username.toLowerCase());
  const canManagePost = isAuthenticated && (isAdmin || isAuthor);

  useEffect(() => {
    const loadPost = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const postData = await postService.getPostById(Number(id));
        setPost(postData);

        const allPosts = await postService.getAllPosts();
        setRelatedPosts(allPosts.filter((p) => p.id !== Number(id)).slice(0, 3));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load post';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPost();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    if (!post) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(post.id);
      setIsDeleteModalOpen(false);
      navigate('/admin');
    } catch (err) {
      console.error('Failed to delete post:', err);
      setIsDeleteModalOpen(false);
      navigate('/');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Post Not Found</h2>
        <p className="text-sm text-slate-400">{error || 'The requested article could not be located.'}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Navigation & Direct Action Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Share Article Link"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied Link!' : 'Share'}
          </button>

          {canManagePost && (
            <>
              <Link
                to={`/admin/edit/${post.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Post
              </Link>

              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Article Header */}
      <header className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            {post.category || 'Article'}
          </span>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {post.readTime || '4 min read'}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex items-center gap-4 py-4 border-y border-slate-800/80">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md shadow-indigo-600/20">
            {post.author ? post.author.charAt(0) : 'A'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{post.author || 'Editorial Team'}</p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Published {post.created ? new Date(post.created).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
              </span>
              <span>&bull;</span>
              <span>Post ID #{post.id}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Cover Image */}
      {post.coverImage && (
        <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-[460px] shadow-2xl">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover object-center"
          />
        </div>
      )}

      {/* Article Body Content */}
      <div className="prose prose-invert max-w-none space-y-6 text-slate-200 text-base sm:text-lg leading-relaxed font-normal">
        {post.content.split('\n\n').map((paragraph, index) => {
          if (paragraph.startsWith('1.') || paragraph.startsWith('-')) {
            return (
              <ul key={index} className="list-disc pl-6 space-y-2 text-slate-300">
                {paragraph.split('\n').map((item, itemIdx) => (
                  <li key={itemIdx}>{item.replace(/^[-*]|\d+\.\s*/, '')}</li>
                ))}
              </ul>
            );
          }

          if (paragraph.length < 80 && !paragraph.endsWith('.')) {
            return (
              <h2 key={index} className="text-xl sm:text-2xl font-bold text-white pt-4">
                {paragraph}
              </h2>
            );
          }

          return <p key={index}>{paragraph}</p>;
        })}
      </div>

      {/* Next / Related Articles */}
      {relatedPosts.length > 0 && (
        <div className="pt-12 border-t border-slate-800 space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Recommended Reading</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <Link
                key={related.id}
                to={`/posts/${related.id}`}
                className="glass-card rounded-xl p-5 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    {related.category || 'Article'}
                  </span>
                  <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {related.title}
                  </h4>
                </div>
                <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{related.readTime || '3 min'}</span>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">Read &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Blog Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete Post"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </article>
  );
};
