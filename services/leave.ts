// services/leave.ts

import { getToken } from '@/utils/token';
import * as FileSystem from 'expo-file-system';

// Types for leave request data
export type LeaveType =
  | 'annual'
  | 'sick'
  | 'maternity'
  | 'paternity'
  | 'emergency'
  | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export type LeaveRequestData = {
  id: number;
  user_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: LeaveStatus;
  attachment?: string;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  approver?: {
    id: number;
    name: string;
    email: string;
  };
};

export type CreateLeavePayload = {
  leave_type: LeaveType;
  start_date: string; // Format: YYYY-MM-DD
  end_date: string; // Format: YYYY-MM-DD
  reason: string;
  attachment?: string; // File URI for mobile
};

export type LeaveListResponse = {
  success: boolean;
  data: {
    current_page: number;
    data: LeaveRequestData[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: any[];
    next_page_url?: string;
    path: string;
    per_page: number;
    prev_page_url?: string;
    to: number;
    total: number;
  };
  message?: string;
};

export type LeaveCreateResponse = {
  success: boolean;
  message: string;
  data?: LeaveRequestData;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://your-ngrok-url.ngrok-free.app';

/**
 * Helper function to handle all fetch requests with consistent error handling and retry mechanism
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
    const timeoutId = setTimeout(() => controller.abort(), 45000); // Increased timeout to 45 seconds

    try {
      console.log(`API Request [${endpoint}] - Attempt ${attempt}/${retries}`);

      const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
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
 * Helper function for FormData requests (file uploads) with retry mechanism
 */
const makeFormDataRequest = async (
  endpoint: string,
  formData: FormData,
  retries: number = 3
): Promise<any> => {
  const token = await getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `FormData Request [${endpoint}] - Attempt ${attempt}/${retries}`
      );

      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return;

          console.log(`XHR Status [${endpoint}]:`, xhr.status);
          console.log(`XHR Response [${endpoint}]:`, xhr.responseText);

          try {
            const responseData = JSON.parse(xhr.responseText || '{}');

            if (xhr.status >= 200 && xhr.status < 300) {
              if (responseData.success) {
                resolve(responseData);
              } else {
                reject(
                  new Error(responseData.message || `API Error: ${xhr.status}`)
                );
              }
            } else if (xhr.status === 422 && responseData.errors) {
              // Handle Laravel validation errors
              const firstErrorKey = Object.keys(responseData.errors)[0];
              const firstErrorMessage = firstErrorKey
                ? (responseData.errors[firstErrorKey] as string[])[0]
                : 'Data yang Anda masukkan tidak valid.';
              reject(new Error(firstErrorMessage));
            } else {
              reject(
                new Error(responseData.message || `Server Error: ${xhr.status}`)
              );
            }
          } catch (parseError) {
            console.error('Response parsing error:', parseError);
            reject(new Error('Invalid response format from server.'));
          }
        };

        xhr.onerror = () => {
          console.error('XHR Network Error');
          reject(new Error('Network error. Check your internet connection.'));
        };

        xhr.ontimeout = () => {
          console.error('XHR Timeout');
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.timeout = 90000; // 90 seconds timeout for file uploads
        xhr.open('POST', `${API_BASE_URL}/api${endpoint}`, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');

        xhr.send(formData);
      });
    } catch (error) {
      console.error(
        `FormData request error [${endpoint}] - Attempt ${attempt}:`,
        error
      );

      if (attempt === retries) {
        throw error;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }

  throw new Error('Max retries exceeded for FormData request');
};

/**
 * Get leave requests list with optional filters
 */
export const getLeaveRequests = async (
  page: number = 1,
  perPage: number = 15,
  status?: LeaveStatus | 'all',
  leaveType?: LeaveType | 'all'
): Promise<LeaveListResponse> => {
  try {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());

    if (status && status !== 'all') {
      params.append('status', status);
    }

    if (leaveType && leaveType !== 'all') {
      params.append('leave_type', leaveType);
    }

    const queryString = params.toString();
    const endpoint = `/leave-requests${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching leave requests from:', endpoint);

    return await makeApiRequest(endpoint, {
      method: 'GET',
    });
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};

/**
 * Create a new leave request
 */
export const createLeaveRequest = async (
  data: CreateLeavePayload
): Promise<LeaveCreateResponse> => {
  try {
    const formData = new FormData();

    formData.append('leave_type', data.leave_type);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('reason', data.reason.trim());

    // Handle file attachment if provided
    if (data.attachment) {
      const fileInfo = await FileSystem.getInfoAsync(data.attachment);
      if (!fileInfo.exists) {
        throw new Error('File attachment tidak ditemukan');
      }

      const filename =
        data.attachment.split('/').pop() ||
        `leave_attachment_${Date.now()}.jpg`;
      formData.append('attachment', {
        uri: data.attachment,
        type: 'image/jpeg', // Adjust based on file type
        name: filename,
      } as any);
    }

    console.log('Creating leave request with data:', {
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
      has_attachment: !!data.attachment,
    });

    return await makeFormDataRequest('/leave-requests', formData);
  } catch (error) {
    console.error('Error creating leave request:', error);
    throw error;
  }
};

/**
 * Helper function to convert LeaveType from backend to frontend format
 */
export const mapLeaveTypeToDisplay = (leaveType: LeaveType): string => {
  const mapping: Record<LeaveType, string> = {
    annual: 'Cuti Tahunan',
    sick: 'Sakit',
    maternity: 'Cuti Melahirkan',
    paternity: 'Cuti Ayah',
    emergency: 'Cuti Darurat',
    unpaid: 'Cuti Tanpa Gaji',
  };
  return mapping[leaveType] || leaveType;
};

/**
 * Helper function to convert LeaveStatus from backend to frontend format
 */
export const mapLeaveStatusToDisplay = (status: LeaveStatus): string => {
  const mapping: Record<LeaveStatus, string> = {
    pending: 'Sedang Diproses',
    approved: 'Disetujui',
    rejected: 'Ditolak',
  };
  return mapping[status] || status;
};

/**
 * Helper function to convert frontend LeaveType to backend format
 */
export const mapDisplayToLeaveType = (displayType: string): LeaveType => {
  const mapping: Record<string, LeaveType> = {
    'Cuti Tahunan': 'annual',
    Liburan: 'annual', // Map existing frontend types
    Cuti: 'annual',
    Sakit: 'sick',
    'Cuti Melahirkan': 'maternity',
    'Cuti Ayah': 'paternity',
    'Cuti Darurat': 'emergency',
    'Cuti Tanpa Gaji': 'unpaid',
  };
  return mapping[displayType] || 'annual';
};

/**
 * Format date range for display
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (start.getTime() === end.getTime()) {
    return formatDate(start);
  }

  return `${formatDate(start)} - ${formatDate(end)}`;
};

/**
 * Delete a leave request
 */
export const deleteLeaveRequest = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Deleting leave request with ID:', id);

    const response = await makeApiRequest(`/leave-requests/${id}`, {
      method: 'DELETE',
    });

    return response;
  } catch (error) {
    console.error('Error deleting leave request:', error);
    throw error;
  }
};
