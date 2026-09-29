import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Edit, 
  ExternalLink, 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Layers, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Users,
  Calendar,
  Mail,
  RefreshCw,
  Clock,
  CheckCircle2,
  PauseCircle,
  Play
} from 'lucide-react';
import { postService } from '../services/postService';
import { authService } from '../services/authService';
import type { Post, UserSummary } from '../types';
import { ConfirmModal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'articles'>('users');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Articles search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Users search & filter
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user' | 'paused'>('all');

  // Account status toggle modal state
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserSummary | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<number | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [postsData, usersData] = await Promise.all([
        postService.getAllPosts(),
        authService.getAllUsers()
      ]);
      setPosts(postsData);
      setUsers(usersData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not fetch dashboard data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isAdmin]);

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await postService.deletePost(postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
      showSuccessToast('Article deleted successfully.');
    } catch (err) {
      console.warn('API error deleting post, updating locally for UI:', err);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      setPostToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const showSuccessToast = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => {
      setActionSuccess(null);
    }, 3500);
  };

  // Toggle user role between Admin and User
  const handleRoleChange = async (targetUser: UserSummary, newRole: 'Admin' | 'User') => {
    if (targetUser.username.toLowerCase() === user?.username?.toLowerCase()) {
      alert("You cannot change your own administrator role.");
      return;
    }

    setIsUpdatingRole(targetUser.id);
    try {
      await authService.updateUserRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      showSuccessToast(`Updated ${targetUser.username}'s role to ${newRole}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user role';
      setError(msg);
    } finally {
      setIsUpdatingRole(null);
    }
  };

  // Toggle user account paused status
  const handleConfirmStatusToggle = async () => {
    if (!userToToggleStatus) return;
    const target = userToToggleStatus;
    const nextStatus = !target.isPaused;

    setIsUpdatingStatus(true);
    try {
      await authService.toggleUserStatus(target.id, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, isPaused: nextStatus } : u))
      );
      setUserToToggleStatus(null);
      showSuccessToast(
        nextStatus
          ? `Account for "${target.username}" is now paused. They cannot log in.`
          : `Account for "${target.username}" has been resumed.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change account status';
      setError(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Helper to compute user's post count
  const getUserPostCount = (username: string) => {
    if (!username) return 0;
    return posts.filter(
      (p) => p.author && p.author.toLowerCase() === username.toLowerCase()
    ).length;
  };

  // Helper to format date
  const formatAccountDate = (dateString?: string) => {
    if (!dateString) return { date: 'Recent', time: '' };
    try {
      const d = new Date(dateString);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    } catch {
      return { date: 'Recent', time: '' };
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.author && p.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    
    let matchesRole = true;
    if (userRoleFilter === 'admin') {
      matchesRole = u.role.toLowerCase() === 'admin';
    } else if (userRoleFilter === 'user') {
      matchesRole = u.role.toLowerCase() !== 'admin';
    } else if (userRoleFilter === 'paused') {
      matchesRole = Boolean(u.isPaused);
    }

    return matchesSearch && matchesRole;
  });

  const totalWords = posts.reduce(
    (acc, post) => acc + (post.content ? post.content.split(/\s+/).length : 0),
    0
  );

  const adminCount = users.filter((u) => u.role.toLowerCase() === 'admin').length;
  const authorCount = users.filter((u) => u.role.toLowerCase() !== 'admin').length;
  const pausedCount = users.filter((u) => u.isPaused).length;

  // Access control guard: Only Admins can access this page
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin Access Required</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The Admin Portal is reserved exclusively for platform administrators. As an author, you can manage all of your published articles from your personal Profile page.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2.5">
          <Link
            to="/profile"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Go to My Author Profile &rarr;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Control Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Global management portal. Control user roles, pause or resume account statuses, and moderate platform articles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Create Article
          </Link>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-sm text-emerald-300 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-xs text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Articles</p>
            <p className="text-2xl font-bold text-white">{posts.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Registered Users</p>
            <p className="text-2xl font-bold text-white">{users.length}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Words</p>
            <p className="text-2xl font-bold text-white">{totalWords.toLocaleString()}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Paused Accounts</p>
            <p className="text-2xl font-bold text-white">
              {pausedCount}{' '}
              <span className="text-xs font-normal text-slate-400">
                {pausedCount === 1 ? 'account' : 'accounts'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <Users className="w-4 h-4" />
          Registered Users &amp; Permissions
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'users' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
          }`}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'articles'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-850'
          }`}
        >
          <FileText className="w-4 h-4" />
          Articles Management
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'articles' ? 'bg-indigo-700/80 text-white' : 'bg-slate-800 text-slate-300'
          }`}>
            {posts.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden space-y-0">
          {/* Users Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search by username or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Filter by Role / Status */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
              <span className="text-xs text-slate-400 mr-1 hidden md:inline">Filter:</span>
              <button
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  userRoleFilter === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  userRoleFilter === 'admin'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-amber-300 hover:bg-slate-850'
                }`}
              >
                Admins ({adminCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  userRoleFilter === 'user'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-850'
                }`}
              >
                Authors ({authorCount})
              </button>
              <button
                onClick={() => setUserRoleFilter('paused')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  userRoleFilter === 'paused'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-rose-300 hover:bg-slate-850'
                }`}
              >
                Paused ({pausedCount})
              </button>
            </div>
          </div>

          {/* Users Table */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading users from SQL Server database...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Users className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm">No users found matching your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">User Account</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role Control</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 text-center">Post Count</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Account Created</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.map((u) => {
                    const postCount = getUserPostCount(u.username);
                    const formatted = formatAccountDate(u.createdAt);
                    const isCurrentUser = user?.username?.toLowerCase() === u.username.toLowerCase();
                    const isUserAdmin = u.role.toLowerCase() === 'admin';
                    const isPrimaryAdmin = u.email.toLowerCase() === 'mission.use02@gmail.com';
                    const isBusyRole = isUpdatingRole === u.id;

                    return (
                      <tr 
                        key={u.id} 
                        className={`hover:bg-slate-850/50 transition-colors group ${
                          u.isPaused ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        {/* User Account */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-md shrink-0 ${
                              isUserAdmin
                                ? 'bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-amber-600/20'
                                : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-600/20'
                            }`}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                  {u.username}
                                </p>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-slate-500">
                                User ID: #{u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-none">{u.email}</span>
                          </div>
                        </td>

                        {/* Role Control */}
                        <td className="py-4 px-4">
                          {isCurrentUser || isPrimaryAdmin ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                              Admin
                            </span>
                          ) : (
                            <div className="inline-flex items-center rounded-lg bg-slate-900 border border-slate-700/80 p-0.5">
                              <button
                                onClick={() => handleRoleChange(u, 'User')}
                                disabled={isBusyRole}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  !isUserAdmin
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                                title="Set role as Author"
                              >
                                Author
                              </button>
                              <button
                                onClick={() => handleRoleChange(u, 'Admin')}
                                disabled={isBusyRole}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                  isUserAdmin
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                    : 'text-slate-400 hover:text-amber-300'
                                }`}
                                title="Promote to Administrator"
                              >
                                Admin
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Account Status Badge */}
                        <td className="py-4 px-4">
                          {u.isPaused ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                              <PauseCircle className="w-3.5 h-3.5 text-rose-400" />
                              Paused
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Post Count */}
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            postCount > 0
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                          }`}>
                            <FileText className="w-3.5 h-3.5" />
                            {postCount} {postCount === 1 ? 'post' : 'posts'}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="py-4 px-4 hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              {formatted.date}
                            </span>
                            {formatted.time && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatted.time}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Admin Action: Pause / Resume */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {isCurrentUser ? (
                            <span className="text-xs text-slate-500 italic">Current Session</span>
                          ) : isPrimaryAdmin ? (
                            <span className="text-xs text-amber-500/80 font-medium">Protected Admin</span>
                          ) : (
                            <button
                              onClick={() => setUserToToggleStatus(u)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                u.isPaused
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {u.isPaused ? (
                                <>
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  Resume Account
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="w-3.5 h-3.5" />
                                  Pause Account
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ARTICLES MANAGEMENT */}
      {activeTab === 'articles' && (
        <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="text-xs text-slate-400 self-end sm:self-center">
              Showing {filteredPosts.length} of {posts.length} entries
            </div>
          </div>

          {/* Loading Spinner */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Loading articles from ASP.NET backend...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm">No articles found matching your query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Article</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Author</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredPosts.map((post) => (
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
                        {post.author?.toLowerCase() === 'admin' || post.author?.toLowerCase() === user?.username?.toLowerCase() ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                            Admin ({post.author || 'Admin'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 inline-flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            Author: {post.author || 'Author'}
                          </span>
                        )}
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
                            title="View Live Article"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/edit/${post.id}`}
                            title="Edit Article"
                            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setPostToDelete(post)}
                            title="Delete Article"
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
          )}
        </div>
      )}

      {/* Account Pause / Resume Confirmation Modal */}
      <ConfirmModal
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={handleConfirmStatusToggle}
        title={userToToggleStatus?.isPaused ? 'Resume Account Access' : 'Pause User Account'}
        message={
          userToToggleStatus?.isPaused
            ? `Are you sure you want to resume access for "${userToToggleStatus?.username}"? They will be able to log in and publish again.`
            : `Are you sure you want to pause "${userToToggleStatus?.username}"? When they attempt to sign in, they will be blocked with: "Your account is paused. Please mail to open your account."`
        }
        confirmText={userToToggleStatus?.isPaused ? 'Resume Account' : 'Pause Account'}
        isDestructive={!userToToggleStatus?.isPaused}
        isLoading={isUpdatingStatus}
      />

      {/* Delete Article Confirmation Modal */}
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
