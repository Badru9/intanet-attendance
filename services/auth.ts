import { apiClient } from './api';

type AuthType = {
  email: string;
  password: string;
};

export type RegisterType = {
  name: string;
  email: string;
  address: string;
  phone: string;
  password: string;
  password_confirmation: string;
};

export type LoginResponse = {
  user: any;
  access_token: string;
  token_type: string;
  message?: string;
  success: boolean;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://your-ngrok-url.ngrok-free.app';

export const login = async (data: AuthType): Promise<LoginResponse> => {
  console.log('API Base URL:', API_BASE_URL);
  try {
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

export const register = (data: RegisterType): Promise<LoginResponse> => {
  return new Promise((resolve, reject) => {
    const { name, email, password, password_confirmation, phone, address } =
      data;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('password_confirmation', password_confirmation);
    formData.append('phone', phone);
    formData.append('address', address);

    const xhr = new XMLHttpRequest();
    const url = `${API_BASE_URL}/api/register`;

    xhr.open('POST', url, true);
    // Set header 'Accept' untuk memastikan backend merespons dengan JSON
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        // Sembunyikan loading indicator di sini jika ada
      }
    };

    xhr.onload = () => {
      console.log(`[XHR Status]: ${xhr.status}`);
      console.log(`[XHR Response]: ${xhr.responseText}`);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseJson: LoginResponse = JSON.parse(xhr.responseText);
          console.log('Register successful', responseJson);
          resolve(responseJson);
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          reject(new Error('Gagal memproses respons dari server.'));
        }
      } else {
        let errorMessage = `HTTP error! status: ${xhr.status}`;
        try {
          const errorJson = JSON.parse(xhr.responseText);
          // Mengambil pesan error dari backend, jika ada
          if (errorJson.message) {
            errorMessage = errorJson.message;
          } else if (errorJson.errors) {
            // Mengambil error validasi pertama
            const firstErrorKey = Object.keys(errorJson.errors)[0];
            errorMessage = errorJson.errors[firstErrorKey][0];
          }
        } catch (e) {
          // Biarkan errorMessage default jika respons bukan JSON
        }
        console.error('Register error:', errorMessage);
        reject(new Error(errorMessage));
      }
    };

    xhr.onerror = () => {
      console.error('[XHR] Network error');
      reject(new Error('Terjadi kesalahan jaringan. Periksa koneksi Anda.'));
    };

    xhr.ontimeout = () => {
      console.error('[XHR] Request timed out');
      reject(new Error('Waktu permintaan habis. Silakan coba lagi.'));
    };

    console.log('Sending registration data to:', url);
    xhr.send(formData);
  });
};

export const logout = async (token: string): Promise<void> => {
  console.log('Logging out with token:', token);
  if (!token) {
    throw new Error('No token provided for logout');
  }

  const url = '/api/logout';

  console.log('Logout URL:', url);

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
