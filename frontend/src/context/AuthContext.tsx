import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuthService, mapFirebaseUser } from '../services/firebaseAuthService';
import { authService } from '../services/authService';
import { getStoredToken, setStoredToken, clearStoredAuth } from '../services/api';
import type { LoginDto, RegisterDto, UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<UserSession>;
  register: (dto: RegisterDto) => Promise<{ session: UserSession; verificationSent: boolean }>;
  loginWithGoogle: () => Promise<UserSession>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  setSession: (session: UserSession) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_SESSION_KEY = 'blog_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with Firebase Auth state
  useEffect(() => {
    const unsubscribe = firebaseAuthService.onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const email = firebaseUser.email || '';
          const isPaused = await authService.isAccountPaused(email);
          if (isPaused) {
            console.warn('[AUTH] Paused account detected in Firebase state:', email);
            await firebaseAuthService.logout();
            clearStoredAuth();
            localStorage.removeItem(USER_SESSION_KEY);
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return;
          }

          const session = await mapFirebaseUser(firebaseUser);
          setUser(session);
          setToken(session.token);
          setStoredToken(session.token);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
        } catch (e) {
          console.error('Failed to map Firebase user:', e);
        }
      } else {
        // Check if there is a local cached session
        const cached = localStorage.getItem(USER_SESSION_KEY);
        const storedToken = getStoredToken();
        if (cached && storedToken) {
          try {
            const parsed = JSON.parse(cached) as UserSession;
            const isPaused = await authService.isAccountPaused(parsed.email);
            if (isPaused) {
              clearStoredAuth();
              localStorage.removeItem(USER_SESSION_KEY);
              setUser(null);
              setToken(null);
            } else {
              setUser(parsed);
              setToken(storedToken);
            }
          } catch {
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setSession = (session: UserSession) => {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    setStoredToken(session.token);
    setToken(session.token);
    setUser(session);
  };

  // Firebase Email/Password Login with Pause Check
  const login = async (dto: LoginDto): Promise<UserSession> => {
    // 1. Check if user is paused before signing in
    const isPausedBefore = await authService.isAccountPaused(dto.usernameOrEmail);
    if (isPausedBefore) {
      throw new Error('Your account is paused. Please mail to open your account.');
    }

    const session = await firebaseAuthService.signInWithEmail(dto.usernameOrEmail, dto.password);
    
    // 2. Check if the authenticated account is paused
    const isPausedAfter = await authService.isAccountPaused(session.email);
    if (isPausedAfter) {
      await firebaseAuthService.logout();
      clearStoredAuth();
      localStorage.removeItem(USER_SESSION_KEY);
      throw new Error('Your account is paused. Please mail to open your account.');
    }

    setSession(session);
    return session;
  };

  // Firebase Email/Password Register
  const register = async (dto: RegisterDto): Promise<{ session: UserSession; verificationSent: boolean }> => {
    const result = await firebaseAuthService.registerWithEmail(dto.email, dto.password, dto.username);
    setSession(result.session);
    return result;
  };

  // Firebase Google Popup Login with Pause Check
  const loginWithGoogle = async (): Promise<UserSession> => {
    const session = await firebaseAuthService.signInWithGoogle();

    // Check if the Google account is paused
    const isPaused = await authService.isAccountPaused(session.email);
    if (isPaused) {
      await firebaseAuthService.logout();
      clearStoredAuth();
      localStorage.removeItem(USER_SESSION_KEY);
      throw new Error('Your account is paused. Please mail to open your account.');
    }

    setSession(session);
    return session;
  };

  // Firebase Password Reset Email
  const resetPassword = async (email: string): Promise<void> => {
    await firebaseAuthService.sendPasswordReset(email);
  };

  // Firebase Resend Verification Email
  const resendVerification = async (): Promise<void> => {
    await firebaseAuthService.resendVerificationEmail();
  };

  // Firebase Logout
  const logout = async (): Promise<void> => {
    try {
      await firebaseAuthService.logout();
    } catch (e) {
      console.warn('Firebase logout warning:', e);
    }
    clearStoredAuth();
    localStorage.removeItem(USER_SESSION_KEY);
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        loginWithGoogle,
        resetPassword,
        resendVerification,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
