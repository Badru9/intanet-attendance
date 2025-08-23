// app/services/attendance.ts

import { getToken } from '@/utils/token';
import * as FileSystem from 'expo-file-system';

// Tipe data untuk payload attendance dan check-out
type AttendancePayload = {
  location_check_in: string;
  photo_check_in: string;
  notes: string | null;
};

type CheckOutPayload = {
  location_check_out: string;
  photo_check_out: string;
  notes: string | null;
};

// Tipe untuk respons sukses dari API
type AttendanceSuccessResponse = {
  success: boolean;
  message: string;
};

// Tipe untuk respons status attendance dari API
type AttendanceStatusResponse = {
  success: boolean;
  data: {
    user_id: number;
    user_name: string;
    today_date: string;
    can_check_in: boolean;
    can_check_out: boolean;
    has_checked_in_today: boolean;
    has_checked_out_today: boolean;
    today_attendance?: {
      id: number;
      check_in_time?: string;
      check_out_time?: string;
      location_check_in?: string;
      location_check_out?: string;
      notes?: string;
      status: string;
      date: string;
      working_hours?: any;
    };
    monthly_stats: {
      month: string;
      month_name: string;
      total_days: number;
      present_days: number;
      absent_days: number;
      late_days: number;
      leave_days: number;
      sick_days: number;
      attendance_rate: number;
      total_working_hours: any;
    };
    recent_attendances: any[];
  };
  message: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://your-ngrok-url.ngrok-free.app';

/**
 * Helper function to handle all XMLHttpRequest requests.
 * Ensures consistent error handling and header setup.
 */
const makeRequest = (
  method: 'POST' | 'PATCH',
  url: string,
  formData: FormData,
  token: string
): Promise<AttendanceSuccessResponse> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }

      console.log('XHR Status:', xhr.status);
      console.log('XHR Response:', xhr.responseText);

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
          // Handles Laravel validation errors
          const firstErrorKey = Object.keys(responseData.errors)[0];
          const firstErrorMessage = firstErrorKey
            ? (responseData.errors[firstErrorKey] as string[])[0]
            : 'Data yang Anda masukkan tidak valid.';
          reject(new Error(firstErrorMessage));
        } else {
          // Handles other HTTP errors
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

    xhr.timeout = 60000; // 60 seconds timeout
    xhr.open(method, url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');

    xhr.send(formData);
  });
};

/**
 * Function to get current attendance status from backend
 */
export const getAttendanceStatusFromBackend =
  async (): Promise<AttendanceStatusResponse> => {
    const token = await getToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${API_BASE_URL}/api/attendances/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || `Server Error: ${response.status}`
        );
      }

      return responseData;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      console.error('Error fetching attendance status from backend:', error);
      throw error;
    }
  };

/**
 * Function to get attendance history from backend
 */
export const getAttendanceHistory = async (
  month?: string,
  year?: string
): Promise<any> => {
  const token = await getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Build query parameters with proper validation
    const params = new URLSearchParams();

    // Convert month and year to integers and validate
    if (month) {
      const monthNum = parseInt(month, 10);
      if (monthNum >= 1 && monthNum <= 12) {
        params.append('month', monthNum.toString());
      }
    }

    if (year) {
      const yearNum = parseInt(year, 10);
      if (yearNum >= 2020 && yearNum <= 2100) {
        params.append('year', yearNum.toString());
      }
    }

    // Add pagination parameters
    params.append('per_page', '31'); // Get full month data

    const queryString = params.toString();
    const url = `${API_BASE_URL}/api/attendances/history${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching attendance history from:', url);
    console.log('Parameters:', { month, year });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseData = await response.json();

    console.log('Backend response:', responseData);

    if (!response.ok) {
      throw new Error(
        responseData.message || `Server Error: ${response.status}`
      );
    }

    return responseData;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    console.error('Error fetching attendance history from backend:', error);
    throw error;
  }
};

/**
 * Function to handle user check-in.
 * Prepares the FormData and calls the helper function.
 */
export const attendance = async (
  data: AttendancePayload
): Promise<AttendanceSuccessResponse> => {
  const token = await getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const fileInfo = await FileSystem.getInfoAsync(data.photo_check_in);
  if (!fileInfo.exists) {
    throw new Error('File tidak ditemukan');
  }

  const formData = new FormData();
  formData.append(
    'location_check_in',
    data.location_check_in.replace(/\n/g, ', ')
  );
  if (data.notes && data.notes.trim() !== '') {
    formData.append('notes', data.notes.trim());
  }

  const filename =
    data.photo_check_in.split('/').pop() || `attendance_${Date.now()}.jpg`;
  formData.append('photo_check_in', {
    uri: data.photo_check_in,
    type: 'image/jpeg',
    name: filename,
  } as any);

  console.log('Sending check-in request...');
  return makeRequest(
    'POST',
    `${API_BASE_URL}/api/attendances/check-in`,
    formData,
    token
  );
};

/**
 * Function to handle user check-out.
 * Prepares the FormData and calls the helper function.
 */
export const checkOut = async (
  data: CheckOutPayload
): Promise<AttendanceSuccessResponse> => {
  const token = await getToken();
  if (!token) {
    throw new Error('No authentication token found. Please log in.');
  }

  const fileInfo = await FileSystem.getInfoAsync(data.photo_check_out);
  if (!fileInfo.exists) {
    throw new Error('File photo check-out tidak ditemukan.');
  }

  const formData = new FormData();
  formData.append(
    'location_check_out',
    data.location_check_out.replace(/\n/g, ', ')
  );
  if (data.notes && data.notes.trim() !== '') {
    formData.append('notes', data.notes.trim());
  }

  const filename =
    data.photo_check_out.split('/').pop() || `checkout_${Date.now()}.jpg`;
  formData.append('photo_check_out', {
    uri: data.photo_check_out,
    type: 'image/jpeg',
    name: filename,
  } as any);

  console.log('Sending check-out request...');
  // Kunci Perbaikan: Ubah metode dari 'PATCH' menjadi 'POST'
  return makeRequest(
    'POST',
    `${API_BASE_URL}/api/attendances/check-out`,
    formData,
    token
  );
};
