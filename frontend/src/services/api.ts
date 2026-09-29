// API client for ASP.NET Web API communication
const TOKEN_KEY = 'blog_jwt_token';
const USER_KEY = 'blog_user_session';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// In development, relative /api paths leverage the Vite dev server proxy to avoid CORS completely.
// In production, VITE_API_BASE_URL can point to the deployed ASP.NET backend URL.
const API_BASE_URL = import.meta.env.DEV
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` : '/api');

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const { headers = {}, ...restOptions } = options;

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  const token = getStoredToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      headers: requestHeaders,
      ...restOptions,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status} (${response.statusText})`;
      if (response.status === 405) {
        errorMessage = `Request failed with status 405: Backend API is not reachable on this server.`;
      }
      if (typeof data === 'object' && data !== null) {
        if ('message' in data && typeof (data as { message: unknown }).message === 'string') {
          errorMessage = (data as { message: string }).message;
        } else if ('title' in data && typeof (data as { title: unknown }).title === 'string') {
          errorMessage = (data as { title: string }).title;
        }
      }
      
      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return data as T;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Network error: Unable to reach backend server');
  }
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => apiRequest<T>(url, { method: 'GET', ...options }),
  post: <T>(url: string, body?: unknown, options?: RequestInit) => 
    apiRequest<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  put: <T>(url: string, body?: unknown, options?: RequestInit) => 
    apiRequest<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: <T>(url: string, options?: RequestInit) => 
    apiRequest<T>(url, { method: 'DELETE', ...options }),
};
