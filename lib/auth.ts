/**
 * Authentication service for Directus CMS
 * Handles login, register, logout, and token management
 */

import api, { ApiError } from './api-client';
import { setAuthToken, setRefreshToken, clearAuthTokens, getAuthToken, getRefreshToken } from './api-client';

// Directus API response types
interface DirectusAuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires: number;
    expires_at?: string;
  };
}

interface DirectusUserResponse {
  data: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    status?: string;
  };
}

interface DirectusErrorResponse {
  errors: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  status?: string;
}

/**
 * Extract error message from Directus API error response
 */
function extractErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const errorData = error.data as DirectusErrorResponse | undefined;
    
    if (errorData?.errors && errorData.errors.length > 0) {
      return errorData.errors[0].message;
    }
    
    // Try to extract message from Directus error format
    if (typeof error.data === 'object' && error.data !== null) {
      const data = error.data as Record<string, unknown>;
      if (data.message) {
        return String(data.message);
      }
    }
    
    // Fallback to status-based messages
    if (error.status === 401) {
      return 'Invalid email or password';
    }
    if (error.status === 403) {
      return 'Access forbidden';
    }
    if (error.status === 404) {
      return 'Endpoint not found';
    }
    if (error.status === 422) {
      return 'Validation error. Please check your input.';
    }
    if (error.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    return error.statusText || 'An error occurred';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Login user with email and password
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  try {
    const response = await api.post<DirectusAuthResponse>(
      '/auth/login',
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    // Store tokens
    if (response.data?.access_token) {
      setAuthToken(response.data.access_token);
    }
    if (response.data?.refresh_token) {
      setRefreshToken(response.data.refresh_token);
    }

    // Get user information
    const userResponse = await api.get<DirectusUserResponse>('/users/me');
    
    return {
      id: userResponse.data.id,
      email: userResponse.data.email,
      firstName: userResponse.data.first_name,
      lastName: userResponse.data.last_name,
      role: userResponse.data.role,
      status: userResponse.data.status,
    };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Register a new user
 */
export async function register(credentials: RegisterCredentials): Promise<AuthUser> {
  try {
    // Create user in Directus
    const createUserResponse = await api.post<DirectusUserResponse>(
      '/users',
      {
        email: credentials.email,
        password: credentials.password,
        first_name: credentials.first_name,
        last_name: credentials.last_name,
      }
    );

    // After creating user, automatically login
    const loginResponse = await api.post<DirectusAuthResponse>(
      '/auth/login',
      {
        email: credentials.email,
        password: credentials.password,
      }
    );

    // Store tokens
    if (loginResponse.data?.access_token) {
      setAuthToken(loginResponse.data.access_token);
    }
    if (loginResponse.data?.refresh_token) {
      setRefreshToken(loginResponse.data.refresh_token);
    }

    return {
      id: createUserResponse.data.id,
      email: createUserResponse.data.email,
      firstName: createUserResponse.data.first_name,
      lastName: createUserResponse.data.last_name,
      role: createUserResponse.data.role,
      status: createUserResponse.data.status,
    };
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Logout user and clear tokens
 */
export function logout(): void {
  clearAuthTokens();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(): Promise<string> {
  const refreshTokenValue = getRefreshToken();
  
  if (!refreshTokenValue) {
    throw new Error('No refresh token available');
  }

  try {
    // Get Directus URL from environment
    const directusUrl = typeof process !== 'undefined' 
      ? process.env.NEXT_PUBLIC_DIRECTUS_URL 
      : undefined;
    
    if (!directusUrl) {
      throw new Error('Directus URL not configured');
    }

    const baseUrl = directusUrl.replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshTokenValue,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.errors?.[0]?.message || 'Failed to refresh token');
    }

    const result = await response.json() as DirectusAuthResponse;

    if (result.data?.access_token) {
      setAuthToken(result.data.access_token);
    }
    if (result.data?.refresh_token) {
      setRefreshToken(result.data.refresh_token);
    }

    return result.data.access_token;
  } catch (error) {
    // If refresh fails, clear all tokens
    clearAuthTokens();
    const errorMessage = extractErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }

  try {
    const response = await api.get<DirectusUserResponse>('/users/me');
    
    return {
      id: response.data.id,
      email: response.data.email,
      firstName: response.data.first_name,
      lastName: response.data.last_name,
      role: response.data.role,
      status: response.data.status,
    };
  } catch (error) {
    // If token is invalid, clear tokens
    if (error instanceof ApiError && error.status === 401) {
      clearAuthTokens();
    }
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

