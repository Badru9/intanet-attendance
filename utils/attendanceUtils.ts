// utils/attendanceUtils.ts

/**
 * Utility functions untuk membantu debugging dan monitoring attendance status
 */

import { AttendanceRecord } from './attendanceStorage';

export type AttendanceDebugInfo = {
  timestamp: string;
  userId: string | null;
  isOnline: boolean;
  backendReachable: boolean;
  localStorageStatus: 'available' | 'error' | 'empty';
  attendanceRecord: AttendanceRecord | null;
  errors: string[];
};

/**
 * Fungsi untuk mengecek konektivitas ke backend
 */
export const checkBackendConnectivity = async (
  apiUrl: string
): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 detik timeout

    const response = await fetch(`${apiUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Backend connectivity check failed:', error);
    return false;
  }
};

/**
 * Fungsi untuk debugging informasi attendance
 */
export const getAttendanceDebugInfo = async (
  userId: string | null,
  getAttendanceStatusFn: (userId: string) => Promise<AttendanceRecord>
): Promise<AttendanceDebugInfo> => {
  const debugInfo: AttendanceDebugInfo = {
    timestamp: new Date().toISOString(),
    userId,
    isOnline: navigator.onLine ?? true, // Fallback untuk React Native
    backendReachable: false,
    localStorageStatus: 'empty',
    attendanceRecord: null,
    errors: [],
  };

  // Check backend connectivity
  try {
    const apiUrl =
      process.env.EXPO_PUBLIC_API_URL ||
      'https://your-ngrok-url.ngrok-free.app';
    debugInfo.backendReachable = await checkBackendConnectivity(apiUrl);
  } catch (error) {
    debugInfo.errors.push(`Backend check error: ${error}`);
  }

  // Check local storage
  if (userId) {
    try {
      const record = await getAttendanceStatusFn(userId);
      debugInfo.attendanceRecord = record;
      debugInfo.localStorageStatus = 'available';
    } catch (error) {
      debugInfo.localStorageStatus = 'error';
      debugInfo.errors.push(`Local storage error: ${error}`);
    }
  }

  return debugInfo;
};

/**
 * Fungsi untuk format debug info menjadi string yang mudah dibaca
 */
export const formatDebugInfo = (debugInfo: AttendanceDebugInfo): string => {
  return `
=== ATTENDANCE DEBUG INFO ===
Timestamp: ${debugInfo.timestamp}
User ID: ${debugInfo.userId || 'N/A'}
Online Status: ${debugInfo.isOnline ? 'Online' : 'Offline'}
Backend Reachable: ${debugInfo.backendReachable ? 'Yes' : 'No'}
Local Storage: ${debugInfo.localStorageStatus}
Current Record: ${debugInfo.attendanceRecord ? JSON.stringify(debugInfo.attendanceRecord, null, 2) : 'None'}
Errors: ${debugInfo.errors.length > 0 ? debugInfo.errors.join(', ') : 'None'}
===========================
  `.trim();
};

/**
 * Helper untuk validasi data attendance
 */
export const validateAttendanceData = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data) {
    errors.push('Data is null or undefined');
    return { isValid: false, errors };
  }

  if (!data.today_date) {
    errors.push('Missing today_date');
  }

  if (typeof data.has_checked_in_today !== 'boolean') {
    errors.push('Invalid has_checked_in_today value');
  }

  if (typeof data.has_checked_out_today !== 'boolean') {
    errors.push('Invalid has_checked_out_today value');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Helper untuk menentukan status attendance berdasarkan data backend
 */
export const determineAttendanceStatus = (
  backendData: any
): 'clock_in_pending' | 'clock_out_pending' | 'completed' => {
  if (!backendData) return 'clock_in_pending';

  if (backendData.has_checked_out_today) {
    return 'completed';
  } else if (backendData.has_checked_in_today) {
    return 'clock_out_pending';
  } else {
    return 'clock_in_pending';
  }
};
