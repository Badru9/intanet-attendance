import axios from 'axios';
import { getToken } from '../utils/token';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://your-ngrok-url.ngrok-free.app';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Set timeout to 30 seconds
});

// Add a request interceptor to include the token in headers
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If we are sending a FormData, we need to let Axios set the Content-Type header.
    // The default 'application/json' will be wrong and cause issues with file uploads.
    if (config.data instanceof FormData) {
      // We must delete the Content-Type header to allow Axios to set it automatically
      // with the correct boundary.
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient };
