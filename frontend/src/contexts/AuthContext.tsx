import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { authApi, tokenService, ApiError } from '../services/apiClient';
import type { UserResponse } from '../services/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'kirjastokaveri_user';

function mapUserResponse(userResponse: UserResponse): User {
  return {
    id: String(userResponse.id),
    name: userResponse.full_name || userResponse.username,
    email: userResponse.email,
    username: userResponse.username,
  };
}

function loadStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as User;
    if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse stored user session', error);
  }

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      if (!tokenService.hasTokens()) {
        setIsLoading(false);
        return;
      }

      try {
        const userResponse = await authApi.getCurrentUser();
        const mappedUser = mapUserResponse(userResponse);
        setUser(mappedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      } catch (error) {
        // Token invalid or expired
        console.warn('Failed to validate token:', error);
        tokenService.clearTokens();
        localStorage.removeItem(USER_STORAGE_KEY);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  // Sync across tabs
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== USER_STORAGE_KEY) {
        return;
      }

      if (event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as User;
          setUser(parsed);
        } catch (error) {
          console.warn('Failed to sync user session from storage', error);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authApi.login({ email, password });
      
      // Fetch user data after successful login
      const userResponse = await authApi.getCurrentUser();
      const mappedUser = mapUserResponse(userResponse);
      
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      toast.success(`Welcome back, ${mappedUser.name}!`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          throw new Error('Invalid email or password');
        }
        throw new Error(error.detail || 'Login failed');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Generate username from name
      const username = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '');
      
      await authApi.signup({
        email,
        password,
        username: username || `user_${Date.now()}`,
        full_name: name,
      });
      
      // Fetch user data after successful signup
      const userResponse = await authApi.getCurrentUser();
      const mappedUser = mapUserResponse(userResponse);
      
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      toast.success(`Account created! Welcome, ${mappedUser.name}!`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          const detail = error.detail.toLowerCase();
          if (detail.includes('email')) {
            throw new Error('Email is already registered');
          }
          if (detail.includes('username')) {
            throw new Error('Username is already taken');
          }
        }
        throw new Error(error.detail || 'Signup failed');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      toast.success('Logged out successfully');
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  }), [user, isLoading, login, signup, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
