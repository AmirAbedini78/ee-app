/**
 * API Client for Directus CMS communication
 * Handles base URL, headers, authentication, and error handling
 */

// Type declaration for process (available in Node.js and Next.js)
declare const process: {
  env: {
    [key: string]: string | undefined;
    NEXT_PUBLIC_DIRECTUS_URL?: string;
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_API_KEY?: string;
    API_TOKEN?: string;
  };
};

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  method?: RequestMethod;
  params?: Record<string, string | number | boolean>;
  body?: unknown;
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  data?: unknown;
}

/**
 * Get the base API URL from environment variables (Directus)
 */
function getApiBaseUrl(): string {
  // NEXT_PUBLIC_ variables are available at build time in Next.js
  const directusUrl = typeof process !== 'undefined' 
    ? process.env.NEXT_PUBLIC_DIRECTUS_URL 
    : undefined;
  
  // Fallback to legacy API_BASE_URL if DIRECTUS_URL is not set
  const baseUrl = directusUrl || (typeof process !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_BASE_URL 
    : undefined);
  
  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_DIRECTUS_URL is not set. Please set it in your .env.local file (local) or environment variables (production).\n' +
      'Example: NEXT_PUBLIC_DIRECTUS_URL=https://cms.explorerelite.com'
    );
  }
  
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '');
}

/**
 * Get authentication token from localStorage (client-side, internal use)
 */
function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('directus_access_token');
  } catch {
    return null;
  }
}

/**
 * Get default headers for API requests
 */
function getDefaultHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token is available
  const token = getStoredAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add API key if available (for other APIs, not Directus)
  if (typeof window !== 'undefined' && typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_KEY) {
    headers['X-API-Key'] = process.env.NEXT_PUBLIC_API_KEY;
  }

  return headers;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const baseUrl = getApiBaseUrl();
  const url = new URL(endpoint, baseUrl);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = new Error(`API Error: ${response.statusText}`);
    error.status = response.status;
    error.statusText = response.statusText;

    try {
      error.data = await response.json();
    } catch {
      error.data = await response.text();
    }

    throw error;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

/**
 * Main API client function
 */
async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    params,
    body,
    headers: customHeaders,
    ...restOptions
  } = options;

  const url = buildUrl(endpoint, params);
  const defaultHeaders = getDefaultHeaders();
  const headers = {
    ...defaultHeaders,
    ...customHeaders,
  };

  const config: RequestInit = {
    method,
    headers,
    ...restOptions,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    return handleResponse<T>(response);
  } catch (error) {
    if (error instanceof Error && 'status' in error) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convenience methods for different HTTP methods
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method'>) =>
    apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Set authentication token (client-side localStorage)
 */
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('directus_access_token', token);
    } catch (error) {
      console.error('Failed to save token to localStorage:', error);
    }
  }
}

/**
 * Set refresh token (client-side localStorage)
 */
export function setRefreshToken(token: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('directus_refresh_token', token);
    } catch (error) {
      console.error('Failed to save refresh token to localStorage:', error);
    }
  }
}

/**
 * Get authentication token (client-side localStorage)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('directus_access_token');
  } catch {
    return null;
  }
}

/**
 * Get refresh token (client-side localStorage)
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('directus_refresh_token');
  } catch {
    return null;
  }
}

/**
 * Clear authentication tokens
 */
export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('directus_access_token');
      localStorage.removeItem('directus_refresh_token');
    } catch (error) {
      console.error('Failed to clear tokens from localStorage:', error);
    }
  }
}

export default api;
export type { ApiError, RequestOptions };

