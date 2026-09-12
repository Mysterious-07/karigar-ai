'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArtisanData, authApi } from '@/lib/api';

interface AuthContextType {
  artisan: ArtisanData | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithOtp: (phone: string, otp: string) => Promise<{ is_new_user: boolean }>;
  logout: () => void;
  updateProfile: (data: Partial<ArtisanData>) => Promise<ArtisanData>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadSession() {
      const storedToken = localStorage.getItem('karigar_auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const user = await authApi.getMe();
          setArtisan(user);
        } catch (err) {
          console.error('Failed to validate session token:', err);
          localStorage.removeItem('karigar_auth_token');
          setToken(null);
          setArtisan(null);
        }
      }
      setIsLoading(false);
    }
    loadSession();
  }, []);

  const loginWithOtp = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.verifyOtp(phone, otp);
      localStorage.setItem('karigar_auth_token', res.token);
      setToken(res.token);
      setArtisan(res.artisan);
      setIsLoading(false);
      return { is_new_user: res.is_new_user };
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('karigar_auth_token');
    setToken(null);
    setArtisan(null);
    router.push('/login');
  };

  const updateProfile = async (data: Partial<ArtisanData>) => {
    const updated = await authApi.updateProfile(data);
    setArtisan(updated);
    return updated;
  };

  const refreshProfile = async () => {
    if (token) {
      try {
        const user = await authApi.getMe();
        setArtisan(user);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        artisan,
        token,
        isAuthenticated: !!token && !!artisan,
        isLoading,
        loginWithOtp,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
