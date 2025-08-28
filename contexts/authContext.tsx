// src/contexts/authContext.tsx

import {
  login as loginApi,
  LoginResponse,
  logout as logoutApi,
} from '@/services/auth';
import { UserType } from '@/types';
import { clearAttendanceStatus } from '@/utils/attendanceStorage';
import { getToken } from '@/utils/token';
import { clearAuthData, getUser, saveUser } from '@/utils/user';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

// Definisikan tipe untuk context
interface AuthContextType {
  user: UserType | null;
  token: string | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efek untuk memuat token dan user dari local storage saat aplikasi dimulai
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        console.log('=== LOADING AUTH DATA FROM STORAGE ===');
        const storedAuthData = await getUser();

        console.log('Stored auth data:', storedAuthData);

        if (storedAuthData.token && storedAuthData.user) {
          console.log('Setting user and token from storage...');
          setToken(storedAuthData.token);
          setUser(storedAuthData.user);
          console.log('User and token set from storage successfully');
        } else {
          console.log('No valid user/token found in storage');
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const login = async (data: any) => {
    try {
      console.log('=== AUTHCONTEXT LOGIN START ===');
      console.log('Login payload:', data);

      const response: LoginResponse = await loginApi(data);
      console.log('Login API response:', response);

      const newToken = response.access_token;
      const newUser = response.user as UserType;

      console.log('New user data:', newUser);
      console.log('New token exists:', !!newToken);

      // Gunakan fungsi utilitas untuk menyimpan data pengguna dan token
      await saveUser(newUser, newToken);

      console.log('Setting user and token in state...');
      setToken(newToken);
      setUser(newUser);

      console.log('Login successful in context');
    } catch (error) {
      console.error('Login failed in context', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Dapatkan token paling baru dari penyimpanan lokal sebelum logout
      const currentToken = await getToken();
      console.log('Logging out with token:', currentToken);

      if (currentToken) {
        await logoutApi(currentToken);
        console.log('Successfully logged out from API.');
      }
    } catch (error) {
      console.error('Logout failed on API, but clearing local storage:', error);
    } finally {
      console.log('finally');

      // Hapus juga data presensi yang terkait dengan pengguna
      if (user) {
        await clearAttendanceStatus(String(user.id));
      }

      // Gunakan fungsi utilitas untuk menghapus data otentikasi
      await clearAuthData();
      setUser(null);
      setToken(null);
    }
  };

  const value = { user, token, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook untuk menggunakan context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
