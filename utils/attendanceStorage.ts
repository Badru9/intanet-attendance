// utils/attendanceStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fungsi untuk membuat kunci dinamis berdasarkan ID pengguna
const getAttendanceKey = (userId: string) => `attendanceStatus_${userId}`;

// Tipe data untuk menyimpan status presensi
export type AttendanceRecord = {
  date: string;
  clockInStatus: 'completed' | 'pending';
  clockOutStatus: 'completed' | 'pending';
  clockInTime: string | null;
  clockOutTime: string | null;
};

/**
 * Mendapatkan status presensi untuk hari ini berdasarkan ID pengguna.
 * Akan membuat record baru jika belum ada atau jika sudah ganti hari.
 */
export const getAttendanceStatus = async (
  userId: string
): Promise<AttendanceRecord> => {
  if (!userId) {
    throw new Error('User ID is required to get attendance status.');
  }
  try {
    const key = getAttendanceKey(userId);
    const storedData = await AsyncStorage.getItem(key);
    const today = new Date().toISOString().slice(0, 10);

    if (storedData) {
      const record: AttendanceRecord = JSON.parse(storedData);
      if (record.date === today) {
        return record;
      }
    }

    const newRecord: AttendanceRecord = {
      date: today,
      clockInStatus: 'pending',
      clockOutStatus: 'pending',
      clockInTime: null,
      clockOutTime: null,
    };
    return newRecord;
  } catch (error) {
    console.error('Failed to get attendance status:', error);
    return {
      date: new Date().toISOString().slice(0, 10),
      clockInStatus: 'pending',
      clockOutStatus: 'pending',
      clockInTime: null,
      clockOutTime: null,
    };
  }
};

/**
 * Menyimpan atau memperbarui status presensi untuk pengguna tertentu.
 */
export const saveAttendanceStatus = async (
  userId: string,
  record: AttendanceRecord
) => {
  if (!userId) {
    throw new Error('User ID is required to save attendance status.');
  }
  try {
    const key = getAttendanceKey(userId);
    await AsyncStorage.setItem(key, JSON.stringify(record));
  } catch (error) {
    console.error('Failed to save attendance status:', error);
  }
};

/**
 * Menghapus status presensi untuk pengguna tertentu (misalnya, saat logout).
 */
export const clearAttendanceStatus = async (userId: string) => {
  if (!userId) {
    console.warn('User ID not provided, cannot clear attendance status.');
    return;
  }
  try {
    const key = getAttendanceKey(userId);
    await AsyncStorage.removeItem(key);
    console.log(`Attendance status cleared for user ${userId}`);
  } catch (error) {
    console.error('Failed to clear attendance status:', error);
  }
};
