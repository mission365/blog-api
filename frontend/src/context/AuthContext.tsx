import React, { createContext, useContext, useEffect, useState } from 'react';
import { firebaseAuthService, mapFirebaseUser } from '../services/firebaseAuthService';
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
            setUser(JSON.parse(cached));
            setToken(storedToken);
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

  // Firebase Email/Password Login
  const login = async (dto: LoginDto): Promise<UserSession> => {
    const session = await firebaseAuthService.signInWithEmail(dto.usernameOrEmail, dto.password);
    setSession(session);
    return session;
  };

  // Firebase Email/Password Register
  const register = async (dto: RegisterDto): Promise<{ session: UserSession; verificationSent: boolean }> => {
    const result = await firebaseAuthService.registerWithEmail(dto.email, dto.password, dto.username);
    setSession(result.session);
    return result;
  };

  // Firebase Google Popup Login
  const loginWithGoogle = async (): Promise<UserSession> => {
    const session = await firebaseAuthService.signInWithGoogle();
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
