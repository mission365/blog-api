import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { getStoredToken, setStoredToken } from '../services/api';
import type { LoginDto, RegisterDto, UserSession } from '../types';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<any>;
  register: (dto: RegisterDto) => Promise<any>;
  setSession: (session: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = getStoredToken();
    const savedSession = authService.getUserSession();
    if (savedToken && savedSession) {
      setToken(savedToken);
      setUser(savedSession);
    }
    setIsLoading(false);
  }, []);

  const setSession = (session: UserSession) => {
    authService.setUserSession(session);
    setStoredToken(session.token);
    setToken(session.token);
    setUser(session);
  };

  const login = async (dto: LoginDto) => {
    const res = await authService.login(dto);
    setToken(res.token);
    setUser({
      username: res.username,
      email: res.email,
      role: res.role,
      token: res.token,
    });
    return res;
  };

  const register = async (dto: RegisterDto) => {
    const res = await authService.register(dto);
    return res;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;
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
