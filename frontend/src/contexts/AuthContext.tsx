import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('accessToken');
    if (token && !isVerifying) {
      verifyToken();
    } else if (!token) {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (retryCount = 0) => {
    // Prevent duplicate verification calls
    if (isVerifying) {
      console.log('[AuthContext] Already verifying, skipping duplicate call');
      return;
    }
    
    setIsVerifying(true);
    let caughtError: any = null;
    
    try {
      const response = await apiClient.get('/auth/verify');
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error: any) {
      caughtError = error;
      
      // Handle rate limiting with exponential backoff
      if (error.response?.status === 429 && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`[AuthContext] Rate limited, retrying in ${delay}ms...`);
        setTimeout(() => {
          setIsVerifying(false);
          verifyToken(retryCount + 1);
        }, delay);
        return;
      }
      
      // If connection refused and we haven't retried too many times, retry
      if (error.code === 'ECONNREFUSED' && retryCount < 3) {
        setTimeout(() => {
          setIsVerifying(false);
          verifyToken(retryCount + 1);
        }, 1000);
        return;
      }
      
      // Token is invalid or backend unreachable, remove it
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      if (retryCount === 0 || (caughtError?.code !== 'ECONNREFUSED' && caughtError?.response?.status !== 429)) {
        setLoading(false);
        setIsVerifying(false);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Logging in user:', { email });
      
      const response = await apiClient.post('/auth/login', { email, password });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        setUser(user);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      console.log('Logging in with Google');
      
      const response = await apiClient.post('/auth/google', { credential });
      
      console.log('Google login response:', response.data);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        setUser(user);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Google login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      console.log('Registering user:', { email, firstName, lastName });
      
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        firstName,
        lastName
      });
      
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        const { user, tokens } = response.data.data;
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        setUser(user);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};