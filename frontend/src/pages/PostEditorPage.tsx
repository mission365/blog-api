import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Eye, 
  PenTool, 
  Save, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';

export const PostEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Architecture');
  const [content, setContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isUnauthorized, setIsUnauthorized] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const presetCategories = ['Architecture', 'Engineering', 'Design & UX', 'Security', 'DevOps', 'AWS', 'Tutorial', 'General'];

  useEffect(() => {
    if (isEditMode && id) {
      const loadExistingPost = async () => {
        setIsLoading(true);
        try {
          const post = await postService.getPostById(Number(id));
          const isAuthor = Boolean(user && post.author && post.author.toLowerCase() === user.username.toLowerCase());
          if (!isAdmin && !isAuthor) {
            setIsUnauthorized(true);
            setErrorMessage(`Permission Denied: This article was created by ${post.author || 'Admin'}. Users can only manage their own articles, not Admin articles.`);
            return;
          }

          setTitle(post.title);
          setContent(post.content);
          if (post.category) {
            setCategory(post.category);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Could not fetch post details';
          setErrorMessage(msg);
        } finally {
          setIsLoading(false);
        }
      };
      loadExistingPost();
    }
  }, [id, isEditMode, isAdmin, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Post title is required.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Post content cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const postCategory = category.trim() || 'General';
    const authorName = user?.username || 'Editorial Team';

    try {
      if (isEditMode && id) {
        const result = await postService.updatePost(Number(id), { title, content, category: postCategory });
        if (result.isSyncedWithBackend) {
          setSuccessToast('Article updated & synced with ASP.NET backend!');
        } else {
          setSuccessToast('Article updated locally! (ASP.NET backend is currently offline)');
        }
      } else {
        const result = await postService.createPost({
          title,
          content,
          category: postCategory,
          author: authorName,
        });
        if (result.isSyncedWithBackend) {
          setSuccessToast('New article published to your profile & synced with ASP.NET backend!');
        } else {
          setSuccessToast('New article published to your profile!');
        }
      }

      setTimeout(() => {
        navigate('/profile');
      }, 1200);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving the post';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 180));

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 px-4 py-10 glass-card rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-lg shadow-indigo-600/20">
          <PenTool className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Author Sign In Required</h2>
          <p className="text-sm text-slate-400">
            Sign in or create an account to publish articles to your own author profile.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            to="/login"
            state={{ from: { pathname: '/admin/new' } }}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Access Denied</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {errorMessage || 'You cannot edit this article. Users can only edit their own articles, not Admin articles.'}
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            to="/profile"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Go to My Articles &rarr;
          </Link>
          <Link
            to="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Return to Public Feed
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400">
        Loading post details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb & Action */}
      <div className="flex items-center justify-between">
        <Link
          to={isAdmin ? '/admin' : '/profile'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAdmin ? 'Back to Admin Center' : 'Back to My Profile'}
        </Link>

        {/* Tab switchers: Write vs Preview */}
        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'write'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {isEditMode ? 'Edit Article' : 'Draft New Article'}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          {isEditMode
            ? 'Update the post content. Changes sync immediately with the ASP.NET backend.'
            : 'Fill in the title, category, and body below to publish a new article.'}
        </p>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successToast && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-300 flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'write' ? (
          <>
            {/* Title Input */}
            <div className="space-y-2">
              <label htmlFor="post-title" className="block text-sm font-semibold text-slate-300">
                Article Title
              </label>
              <input
                id="post-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern Web APIs with ASP.NET Core & React"
                maxLength={100}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <div className="flex justify-end text-xs text-slate-500">
                <span>{title.length}/100 characters</span>
              </div>
            </div>

            {/* Category Input */}
            <div className="space-y-2">
              <label htmlFor="post-category" className="block text-sm font-semibold text-slate-300">
                Article Category
              </label>
              <div className="space-y-3">
                <input
                  id="post-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Architecture, Security, Engineering..."
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
                {/* Quick-select chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 mr-1">Suggestions:</span>
                  {presetCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        category.toLowerCase() === cat.toLowerCase()
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-2">
              <label htmlFor="post-content" className="block text-sm font-semibold text-slate-300">
                Article Body
              </label>
              <textarea
                id="post-content"
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article markdown or formatted paragraphs here..."
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder-slate-500 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
              />
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Supports multiple paragraphs, lists, and formatted text</span>
                <span>{wordCount} words &bull; ~{estimatedReadTime} min read</span>
              </div>
            </div>
          </>
        ) : (
          /* Live Preview Mode */
          <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {category || 'General'}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  &bull; Preview Mode
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {title || 'Untitled Article'}
              </h2>
              <p className="text-xs text-slate-400 mt-2">
                {wordCount} words &bull; ~{estimatedReadTime} min read
              </p>
            </div>
            <div className="prose prose-invert max-w-none text-slate-300 text-base leading-relaxed space-y-4">
              {content ? (
                content.split('\n\n').map((para, i) => <p key={i}>{para}</p>)
              ) : (
                <p className="text-slate-500 italic">No content written yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving to API...' : isEditMode ? 'Save Changes' : 'Publish Article'}
          </button>
        </div>
      </form>
    </div>
  );
};
