import { getToken } from '@/utils/token';
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

// Type definitions for change password
export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
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
        } catch {
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

/**
 * Helper function to make API requests with consistent error handling and retry mechanism
 */
const makeApiRequest = async (
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<any> => {
  const token = await getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      console.log(`API Request [${endpoint}] - Attempt ${attempt}/${retries}`);

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Server Error: ${response.status}`;
        try {
          const errorData = await response.json();
          if (response.status === 422 && errorData.errors) {
            // Handle Laravel validation errors
            const firstErrorKey = Object.keys(errorData.errors)[0];
            errorMessage = firstErrorKey
              ? (errorData.errors[firstErrorKey] as string[])[0]
              : 'Data yang Anda masukkan tidak valid.';
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError);
        }

        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMessage);
        }

        // Retry on server errors (5xx) if we have attempts left
        if (attempt < retries) {
          console.warn(`Server error ${response.status}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          continue;
        }

        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log(`API Response [${endpoint}]:`, responseData);
      return responseData;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          if (attempt < retries) {
            console.warn(
              `Request timeout, retrying... (${attempt}/${retries})`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            continue;
          }
          throw new Error(
            'Request timed out. Please check your internet connection.'
          );
        }

        // Handle network errors
        if (
          error.message.includes('Network request failed') ||
          error.message.includes('fetch')
        ) {
          if (attempt < retries) {
            console.warn(`Network error, retrying... (${attempt}/${retries})`);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            continue;
          }
          throw new Error(
            'Network error. Please check your internet connection.'
          );
        }
      }

      console.error(
        `Error in API request [${endpoint}] - Attempt ${attempt}:`,
        error
      );

      // If it's the last attempt or not a retryable error, throw it
      if (attempt === retries) {
        throw error;
      }

      // Wait before retry for other errors
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }

  throw new Error('Max retries exceeded');
};

/**
 * Change user password
 */
export const changePassword = async (
  data: ChangePasswordPayload
): Promise<ChangePasswordResponse> => {
  try {
    console.log('Changing password...');

    const response = await makeApiRequest('/user/change-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: data.old_password,
        new_password: data.new_password,
      }),
    });

    return response;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};
