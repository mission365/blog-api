import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Edit, 
  ExternalLink, 
  FileText, 
  Plus, 
  Trash2, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  BookOpen,
  KeyRound,
  Lock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { postService } from '../services/postService';
import { authService } from '../services/authService';
import type { Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/Modal';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Change Password States
  const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await authService.changePassword({
        usernameOrEmail: user?.username || '',
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password. Please check your current password.';
      setPasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadUserPosts = async () => {
      setIsLoading(true);
      try {
        if (user?.username) {
          const posts = await postService.getUserPosts(user.username);
          setMyPosts(posts);
        }
      } catch (err) {
        console.error('Error fetching user posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPosts();
  }, [isAuthenticated, user?.username, navigate]);

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(postToDelete.id);
      setMyPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
    } catch (err) {
      console.warn('Error deleting post:', err);
      setMyPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalWords = myPosts.reduce(
    (acc, post) => acc + (post.content ? post.content.split(/\s+/).length : 0),
    0
  );

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Author Profile Header Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none rounded-full" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-xl shadow-indigo-600/25">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {user.username}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.role || 'Author'}
                </span>
              </div>
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-500" />
                {user.email}
              </p>
              <p className="text-xs text-indigo-400 font-medium">
                Verified Author Profile
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold transition-all hover:scale-[1.02]"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Admin Center
              </Link>
            )}
            <Link
              to="/admin/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Write New Post
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="space-y-0.5">
            <p className="text-xs text-slate-400 font-medium">My Published Posts</p>
            <p className="text-2xl font-bold text-white">{myPosts.length}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-slate-400 font-medium">Total Words Written</p>
            <p className="text-2xl font-bold text-white">{totalWords.toLocaleString()}</p>
          </div>
          <div className="space-y-0.5 col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-400 font-medium">Public Status</p>
            <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Articles Live on Public Feed
            </p>
          </div>
        </div>
      </div>

      {/* Security & Password Settings Card */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Security & Password
              </h2>
              <p className="text-xs text-slate-400">
                Change your account password to keep your author profile secure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            {showPasswordSection ? (
              <>
                Hide Form <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Change Password <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {showPasswordSection && (
          <form onSubmit={handleChangePassword} className="mt-6 pt-6 border-t border-slate-800/80 space-y-4 max-w-xl">
            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordSection(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* User's Published Articles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              My Articles
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Articles you have published that are visible to all visitors on the Home feed.
            </p>
          </div>

          <Link
            to="/"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            View Public Home Feed &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="glass-card rounded-2xl p-12 text-center text-slate-400 text-sm">
            Loading your articles...
          </div>
        ) : myPosts.length === 0 ? (
          /* Empty state for new registered users */
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No articles published yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Welcome to PulseBlog, <span className="text-white font-medium">{user.username}</span>! Start drafting your first article to share your technical thoughts with the community.
              </p>
            </div>
            <Link
              to="/admin/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Write Your First Article
            </Link>
          </div>
        ) : (
          /* Articles Table */
          <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Article</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Published Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {myPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-850/50 transition-colors group">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500">#{post.id}</span>
                          <div>
                            <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                              {post.title}
                            </p>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {post.content}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 hidden md:table-cell">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-indigo-300">
                          {post.category || 'General'}
                        </span>
                      </td>

                      <td className="py-4 px-4 hidden sm:table-cell text-xs text-slate-400">
                        {post.created ? new Date(post.created).toLocaleDateString() : 'Recent'}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/posts/${post.id}`}
                            title="View Public Post"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/edit/${post.id}`}
                            title="Edit Post"
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setPostToDelete(post)}
                            title="Delete Post"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message={`Are you sure you want to delete "${postToDelete?.title}"? This cannot be undone.`}
        confirmText="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
