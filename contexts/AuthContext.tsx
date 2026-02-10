'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { authApi, tokenUtils, AuthApiError } from '@/lib/api/auth';
import type {
  AuthState,
  AuthContextType,
  LoginRequest,
  RegisterRequest,
  AuthUser,
  AuthTokens,
} from '@/types/auth';

// Auth action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AuthUser; tokens: AuthTokens } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_USER'; payload: AuthUser }
  | { type: 'SET_TOKENS'; payload: AuthTokens }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true to check for existing session
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };

    case 'SET_TOKENS':
      return {
        ...state,
        tokens: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Decode user info from JWT token payload as fallback
  const decodeUserFromToken = useCallback((token: string): AuthUser | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }, []);

  // Initialize authentication state from stored tokens
  const initializeAuth = useCallback(async () => {
    try {
      const { accessToken, refreshToken } = tokenUtils.getTokens();

      if (!accessToken || !refreshToken) {
        dispatch({ type: 'AUTH_LOGOUT' });
        return;
      }

      // Check if access token is expired
      if (tokenUtils.isTokenExpired(accessToken)) {
        // Try to refresh the token
        try {
          const response = await authApi.refreshToken({ refreshToken });
          const { tokens } = response.data;

          tokenUtils.setTokens(tokens.accessToken, tokens.refreshToken);
          dispatch({ type: 'SET_TOKENS', payload: tokens });

          // Get user info with new token
          try {
            const userResponse = await authApi.getCurrentUser();
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: userResponse.data.user,
                tokens
              }
            });
          } catch {
            // Fallback: decode user from new token
            const user = decodeUserFromToken(tokens.accessToken);
            if (user) {
              dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
            } else {
              tokenUtils.clearTokens();
              dispatch({ type: 'AUTH_LOGOUT' });
            }
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and logout
          tokenUtils.clearTokens();
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else {
        // Access token is valid, get user info
        try {
          const userResponse = await authApi.getCurrentUser();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: userResponse.data.user,
              tokens: { accessToken, refreshToken, expiresIn: 15 * 60 }
            }
          });
        } catch (userError) {
          // Fallback: decode user from existing token
          const user = decodeUserFromToken(accessToken);
          if (user) {
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user,
                tokens: { accessToken, refreshToken, expiresIn: 15 * 60 }
              }
            });
          } else {
            tokenUtils.clearTokens();
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, [decodeUserFromToken]);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();

    // Listen for logout events from API client
    const handleLogoutEvent = () => {
      tokenUtils.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleLogoutEvent);

      return () => {
        window.removeEventListener('auth:logout', handleLogoutEvent);
      };
    }
    return undefined;
  }, [initializeAuth]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!state.tokens?.accessToken || !state.tokens?.refreshToken) {
      return;
    }

    const tokenExpiration = tokenUtils.getTokenExpiration(state.tokens.accessToken);
    if (!tokenExpiration) return;

    // Refresh token 2 minutes before expiration
    const refreshTime = tokenExpiration - Date.now() - (2 * 60 * 1000);
    
    if (refreshTime > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, refreshTime);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [state.tokens]);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authApi.login(credentials);
      const { user, tokens } = response.data;
      
      tokenUtils.setTokens(tokens.accessToken, tokens.refreshToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const response = await authApi.register(data);
      const { user, tokens } = response.data;
      
      tokenUtils.setTokens(tokens.accessToken, tokens.refreshToken);
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, tokens } });
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Registration failed. Please try again.';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async (options: { logoutFromAll?: boolean } = {}) => {
    try {
      const { refreshToken } = tokenUtils.getTokens();
      
      if (refreshToken) {
        await authApi.logout({ 
          refreshToken, 
          logoutFromAll: options.logoutFromAll 
        });
      }
    } catch (error) {
      // Log error but don't throw - we want to clear local state regardless
      console.error('Logout API call failed:', error);
    } finally {
      tokenUtils.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    const { refreshToken } = tokenUtils.getTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authApi.refreshToken({ refreshToken });
      const { tokens } = response.data;
      
      tokenUtils.setTokens(tokens.accessToken, tokens.refreshToken);
      dispatch({ type: 'SET_TOKENS', payload: tokens });
      
      return tokens;
    } catch (error) {
      // Refresh failed, logout user
      tokenUtils.clearTokens();
      dispatch({ type: 'AUTH_LOGOUT' });
      throw error;
    }
  }, []);

  // Forgot password function
  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authApi.forgotPassword({ email });
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Failed to send reset email. Please try again.';
      throw new Error(message);
    }
  }, []);

  // Reset password function
  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      await authApi.resetPassword({ token, password });
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Password reset failed. Please try again.';
      throw new Error(message);
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!state.isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      await authApi.changePassword({ currentPassword, newPassword });
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Password change failed. Please try again.';
      throw new Error(message);
    }
  }, [state.isAuthenticated]);

  // Verify email function
  const verifyEmail = useCallback(async (token: string) => {
    try {
      const response = await authApi.verifyEmail({ token });
      
      // Update user verification status if currently authenticated
      if (state.user) {
        dispatch({ 
          type: 'SET_USER', 
          payload: { 
            ...state.user, 
            isVerified: true 
          } 
        });
      }
      
      return response;
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Email verification failed. Please try again.';
      throw new Error(message);
    }
  }, [state.user]);

  // Resend verification function
  const resendVerification = useCallback(async (email: string) => {
    try {
      await authApi.resendVerification({ email });
    } catch (error) {
      const message = error instanceof AuthApiError 
        ? error.message 
        : 'Failed to resend verification email. Please try again.';
      throw new Error(message);
    }
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyEmail,
    resendVerification,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;