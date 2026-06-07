import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { authAPI, usersAPI, TOKEN_KEY } from '../services/api';
import toast from 'react-hot-toast';

// Create Auth Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'business_nexus_user';

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from token on initial load
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const response = await authAPI.getMe();
          const userData = response.data.user;
          setUser(mapUserFromAPI(userData));
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mapUserFromAPI(userData)));
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // Map API user to frontend User type (MongoDB _id -> id)
  const mapUserFromAPI = (apiUser: Record<string, unknown>): User => {
    return {
      ...apiUser,
      id: (apiUser._id as string) || (apiUser.id as string),
    } as User;
  };

  // Login function — calls real API
  const login = async (email: string, password: string, role: UserRole): Promise<{requires2FA?: boolean, userId?: string, demoOtp?: string} | void> => {
    setIsLoading(true);

    try {
      const response = await authAPI.login({ email, password, role });
      
      if (response.data.requires2FA) {
        return { requires2FA: true, userId: response.data.userId, demoOtp: response.data.demoOtp };
      }

      const { token, user: userData } = response.data;

      // Store token
      if (token) localStorage.setItem(TOKEN_KEY, token);

      // Store user
      if (userData) {
        const mappedUser = mapUserFromAPI(userData);
        setUser(mappedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      }

      toast.success('Successfully logged in!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const verify2FA = async (userId: string, code: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authAPI.verify2FA(userId, code);
      const { token, user: userData } = response.data;

      if (token) localStorage.setItem(TOKEN_KEY, token);
      if (userData) {
        const mappedUser = mapUserFromAPI(userData);
        setUser(mappedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));
      }
      toast.success('Successfully logged in!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Invalid code';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function — calls real API
  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await authAPI.register(name, email, password, role);
      const { token, user: userData } = response.data;

      // Store token
      localStorage.setItem(TOKEN_KEY, token);

      // Store user
      const mappedUser = mapUserFromAPI(userData);
      setUser(mappedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mappedUser));

      toast.success('Account created successfully!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password — calls real API
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authAPI.forgotPassword(email);
      toast.success('Password reset instructions sent to your email');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to send reset email';
      toast.error(message);
      throw new Error(message);
    }
  };

  // Reset password — calls real API
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await authAPI.resetPassword(token, newPassword);
      toast.success('Password reset successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to reset password';
      toast.error(message);
      throw new Error(message);
    }
  };

  // Logout function
  const logout = (): void => {
    // Call API to update online status (fire and forget)
    authAPI.logout().catch(() => {});

    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  // Update user profile — calls real API
  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const response = await usersAPI.updateUser(userId, updates);
      const updatedUser = mapUserFromAPI(response.data.user);

      // Update current user if it's the same user
      if (user?.id === userId) {
        setUser(updatedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }

      toast.success('Profile updated successfully');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    login,
    verify2FA,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};