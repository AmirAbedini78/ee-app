/**
 * API Client for backend communication
 * Handles base URL, headers, authentication, and error handling
 */

// Type declaration for process (available in Node.js and Next.js)
declare const process: {
  env: {
    [key: string]: string | undefined;
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
 * Get the base API URL from environment variables
 */
function getApiBaseUrl(): string {
  // NEXT_PUBLIC_ variables are available at build time in Next.js
  const baseUrl = typeof process !== 'undefined' 
    ? process.env.NEXT_PUBLIC_API_BASE_URL 
    : undefined;
  
  if (!baseUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_BASE_URL is not set. Please set it in your .env.local file (local) or environment variables (production).\n' +
      'If you are not using API calls, you can ignore this error. Set the environment variable only when you start using API.'
    );
  }
  
  // Remove trailing slash if present
  return baseUrl.replace(/\/$/, '');
}

/**
 * Get default headers for API requests
 */
function getDefaultHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add API key if available (client-side)
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
 * Set authentication token (for server-side usage)
 * Note: This is a placeholder. In practice, tokens should be stored securely
 * (e.g., in session storage, cookies, or server-side state management)
 */
export function setAuthToken(token: string): void {
  // This can be used in server components or API routes
  // For client-side, use headers in the request options
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    process.env.API_TOKEN = token;
  }
}

/**
 * Get authentication token (for server-side usage)
 */
export function getAuthToken(): string | undefined {
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    return process.env.API_TOKEN;
  }
  return undefined;
}

export default api;
export type { ApiError, RequestOptions };

