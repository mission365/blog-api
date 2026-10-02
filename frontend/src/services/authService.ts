import { apiClient, clearStoredAuth, setStoredToken } from './api';
import type { AuthResponse, LoginDto, RegisterDto, UserSession, UserSummary } from '../types';

const USER_SESSION_KEY = 'blog_user_session';
const VERIFIED_EMAILS_KEY = 'blog_verified_emails';
export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/Auth/login', dto);
      if (response.token) {
        setStoredToken(response.token);
        this.setUserSession({
          username: response.username,
          email: response.email,
          role: response.role,
          token: response.token,
        });
      }
      return response;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('paused')) {
        throw err;
      }

      throw err;
    }
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    return await apiClient.post<AuthResponse>('/Auth/register', dto);
  },

  async sendVerificationCode(email: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/Auth/send-verification-code', { email });
  },

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>('/Auth/verify-email', { email, code });
    if (res.success) {
      this.markEmailVerified(email);
    }
    return res;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return await apiClient.post<{ message: string }>('/Auth/forgot-password', { email });
  },

  async resetPassword(dto: { email: string; code: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return await apiClient.post<{ success: boolean; message: string }>('/Auth/reset-password', dto);
  },

  async changePassword(dto: { usernameOrEmail: string; currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    return await apiClient.post<{ success: boolean; message: string }>('/Auth/change-password', dto);
  },

  async getAllUsers(): Promise<UserSummary[]> {
    try {
      const serverUsers = await apiClient.get<UserSummary[]>('/Auth/users');
      return serverUsers;
    } catch (err) {
      console.warn('Backend unavailable while fetching users:', err);
      return [];
    }
  },

  async updateUserRole(userId: number, role: string): Promise<{ success: boolean; role: string; message: string }> {
    return await apiClient.put<{ success: boolean; role: string; message: string }>(`/Auth/users/${userId}/role`, { role });
  },

  async toggleUserStatus(userId: number, isPaused: boolean): Promise<{ success: boolean; isPaused: boolean; message: string }> {
    return await apiClient.put<{ success: boolean; isPaused: boolean; message: string }>(`/Auth/users/${userId}/status`, { isPaused });
  },

  async isAccountPaused(identifier: string): Promise<boolean> {
    if (!identifier) return false;
    const clean = identifier.trim().toLowerCase();

    // The API is the source of truth for account state.
    try {
      const res = await apiClient.get<{ isPaused: boolean }>(`/Auth/check-paused?email=${encodeURIComponent(clean)}`);
      if (res && typeof res.isPaused === 'boolean') {
        return res.isPaused;
      }
    } catch {
      // ignore
    }

    return false;
  },

  logout(): void {
    clearStoredAuth();
  },

  getUserSession(): UserSession | null {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  },

  setUserSession(session: UserSession): void {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  },

  isEmailVerified(email: string): boolean {
    try {
      const raw = localStorage.getItem(VERIFIED_EMAILS_KEY);
      const verified = raw ? JSON.parse(raw) : [];
      return verified.includes(email.toLowerCase());
    } catch {
      return false;
    }
  },

  markEmailVerified(email: string): void {
    try {
      const raw = localStorage.getItem(VERIFIED_EMAILS_KEY);
      const verified: string[] = raw ? JSON.parse(raw) : [];
      if (!verified.includes(email.toLowerCase())) {
        verified.push(email.toLowerCase());
        localStorage.setItem(VERIFIED_EMAILS_KEY, JSON.stringify(verified));
      }
    } catch (err) {
      console.error('Failed to save verified email:', err);
    }
  },
};
