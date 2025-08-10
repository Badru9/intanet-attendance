// utils/attendanceStorage.ts
// Kode yang diperbarui untuk menyertakan waktu clockIn dan clockOut

import AsyncStorage from '@react-native-async-storage/async-storage';

const ATTENDANCE_STATUS_KEY = 'attendanceStatus';

// Tipe data untuk menyimpan status presensi
export type AttendanceRecord = {
  date: string;
  clockInStatus: 'completed' | 'pending';
  clockOutStatus: 'completed' | 'pending';
  clockInTime: string | null;
  clockOutTime: string | null;
};

/**
 * Mendapatkan status presensi untuk hari ini.
 * Akan membuat record baru jika belum ada atau jika sudah ganti hari.
 */
export const getAttendanceStatus = async (): Promise<AttendanceRecord> => {
  try {
    const storedData = await AsyncStorage.getItem(ATTENDANCE_STATUS_KEY);
    const today = new Date().toISOString().slice(0, 10);

    if (storedData) {
      const record: AttendanceRecord = JSON.parse(storedData);
      // Jika record ada dan untuk hari ini, kembalikan record tersebut.
      if (record.date === today) {
        return record;
      }
    }

    // Jika tidak ada record, atau record dari hari sebelumnya,
    // buat record baru dengan status 'pending' untuk hari ini.
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
    // Jika ada error, tetap kembalikan record baru untuk menghindari stuck di loading
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
 * Menyimpan atau memperbarui status presensi.
 */
export const saveAttendanceStatus = async (record: AttendanceRecord) => {
  try {
    await AsyncStorage.setItem(ATTENDANCE_STATUS_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('Failed to save attendance status:', error);
  }
};
