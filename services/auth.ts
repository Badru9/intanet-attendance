import { apiClient } from './api';

type AuthType = {
  email: string;
  password: string;
};

type RegisterType = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type LoginResponse = {
  user: any;
  access_token: string;
  token_type: string;
  message?: string;
  success: boolean;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://your-ngrok-url.ngrok-free.app';

export const login = async (data: AuthType): Promise<LoginResponse> => {
  try {
    console.log('API Base URL:', API_BASE_URL);
    console.log('Login data:', data);

    const response = await apiClient.post<LoginResponse>('/api/login', data);

    console.log('Login successful', response.data);

    // Periksa apakah login berhasil
    if (!response.data.success) {
      throw new Error(response.data.message || 'Login failed');
    }

    return response.data;
  } catch (error: any) {
    console.error('Full error during login:', error);
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);

    if (error.response?.status === 401) {
      throw new Error(error.response.data.message || 'Invalid credentials');
    } else if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      const firstError = Object.values(errors)[0] as string[];
      throw new Error(firstError[0] || 'Validation error');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout');
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error('Network error - check your internet connection');
    }

    throw error;
  }
};

export const register = async (data: RegisterType): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/api/register', data);
    console.log('Register successful', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Register error:', error.response?.data);
    throw error;
  }
};

export const logout = async (token: string): Promise<void> => {
  try {
    await apiClient.post(
      '/api/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error: any) {
    console.error('Logout error:', error.response?.data);
    throw error;
  }
};

// Helper function untuk API calls yang membutuhkan auth
export const authenticatedRequest = async (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  token: string,
  data?: any
) => {
  try {
    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      ...(data && { data }),
    };

    const response = await apiClient(config);
    return response.data;
  } catch (error: any) {
    console.error(`${method} ${url} error:`, error.response?.data);
    throw error;
  }
};

// Get current user data
export const getCurrentUser = async (token: string) => {
  try {
    const response = await apiClient.get('/api/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Get current user error:', error.response?.data);
    throw error;
  }
};

// Refresh token
export const refreshToken = async (token: string) => {
  try {
    const response = await apiClient.post(
      '/api/refresh-token',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Refresh token error:', error.response?.data);
    throw error;
  }
};
