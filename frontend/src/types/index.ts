export interface Post {
  id: number;
  title: string;
  content: string;
  created?: string;
  author?: string;
  category?: string;
  readTime?: string;
  coverImage?: string;
}

export interface CreatePostDto {
  title: string;
  content: string;
  category?: string;
  author?: string;
}

export interface UpdatePostDto {
  title: string;
  content: string;
  category?: string;
}

export interface LoginDto {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  expiresAt?: string;
}

export interface UserSession {
  username: string;
  email: string;
  role: string;
  token: string;
  photoURL?: string;
  emailVerified?: boolean;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface UserSummary {
  id: number;
  username: string;
  email: string;
  role: string;
  isPaused?: boolean;
  createdAt: string;
  postCount?: number;
}
