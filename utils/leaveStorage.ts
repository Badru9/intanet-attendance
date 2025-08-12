// utils/leaveStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export type LeaveType = 'Liburan' | 'Cuti' | 'Sakit';
export type LeaveStatus = 'Sedang Diproses' | 'Disetujui' | 'Ditolak';

export interface LeaveItem {
  id: string;
  type: LeaveType;
  title: string;
  dateRange: string;
  status: LeaveStatus;
  month: string;
  year: string;
  reason?: string;
  submittedDate: string;
}

const LEAVE_DATA_KEY = 'leaveData';

// Data dummy untuk inisialisasi dengan lebih banyak item
const initialLeaveData: LeaveItem[] = [
  {
    id: uuidv4(),
    type: 'Liburan',
    title: 'Liburan Keluarga',
    dateRange: 'Kamis 7 Agustus - Minggu 10 Agustus',
    status: 'Sedang Diproses',
    month: 'Agustus',
    year: '2025',
    reason: 'Berlibur bersama keluarga ke Bali',
    submittedDate: '2025-08-01',
  },
  {
    id: uuidv4(),
    type: 'Sakit',
    title: 'Sakit Demam',
    dateRange: 'Senin 7 Juli - Kamis 10 Juli',
    status: 'Disetujui',
    month: 'Juli',
    year: '2025',
    reason: 'Demam tinggi dan perlu istirahat total',
    submittedDate: '2025-07-06',
  },
  {
    id: uuidv4(),
    type: 'Cuti',
    title: 'Cuti Tahunan 2025',
    dateRange: 'Senin 5 Mei - Jumat 9 Mei',
    status: 'Disetujui',
    month: 'Mei',
    year: '2025',
    reason: 'Menggunakan hak cuti tahunan',
    submittedDate: '2025-04-25',
  },
  {
    id: uuidv4(),
    type: 'Liburan',
    title: 'Liburan Akhir Tahun',
    dateRange: 'Kamis 7 Juni - Minggu 10 Juni',
    status: 'Ditolak',
    month: 'Juni',
    year: '2025',
    reason: 'Permintaan cuti tidak disetujui karena proyek sedang padat',
    submittedDate: '2025-06-01',
  },
  {
    id: uuidv4(),
    type: 'Cuti',
    title: 'Cuti Pernikahan',
    dateRange: 'Senin 18 September - Jumat 22 September',
    status: 'Sedang Diproses',
    month: 'September',
    year: '2025',
    reason: 'Menikah di kampung halaman',
    submittedDate: '2025-08-10',
  },
  {
    id: uuidv4(),
    type: 'Sakit',
    title: 'Sakit Gigi',
    dateRange: 'Kamis 14 Agustus',
    status: 'Disetujui',
    month: 'Agustus',
    year: '2025',
    reason: 'Ke dokter gigi untuk cabut gigi',
    submittedDate: '2025-08-11',
  },
  {
    id: uuidv4(),
    type: 'Liburan',
    title: 'Liburan Lebaran',
    dateRange: 'Senin 31 Maret - Jumat 4 April',
    status: 'Disetujui',
    month: 'Maret',
    year: '2025',
    reason: 'Mudik lebaran ke kampung halaman',
    submittedDate: '2025-03-20',
  },
  {
    id: uuidv4(),
    type: 'Cuti',
    title: 'Cuti Acara Keluarga',
    dateRange: 'Selasa 14 Oktober',
    status: 'Sedang Diproses',
    month: 'Oktober',
    year: '2025',
    reason: 'Menghadiri acara pernikahan sepupu',
    submittedDate: '2025-08-12',
  },
  {
    id: uuidv4(),
    type: 'Sakit',
    title: 'Sakit flu',
    dateRange: 'Rabu 12 November - Jumat 14 November',
    status: 'Ditolak',
    month: 'November',
    year: '2025',
    reason: 'Belum menyerahkan surat dokter',
    submittedDate: '2025-11-10',
  },
];

/**
 * Mendapatkan semua data cuti dari AsyncStorage.
 * Jika tidak ada, akan menginisialisasi dengan data dummy.
 */
export const getLeaveData = async (): Promise<LeaveItem[]> => {
  try {
    const storedData = await AsyncStorage.getItem(LEAVE_DATA_KEY);
    if (storedData) {
      return JSON.parse(storedData) as LeaveItem[];
    } else {
      await AsyncStorage.setItem(
        LEAVE_DATA_KEY,
        JSON.stringify(initialLeaveData)
      );
      return initialLeaveData;
    }
  } catch (error) {
    console.error('Failed to get leave data:', error);
    return [];
  }
};

/**
 * Menyimpan array data cuti ke AsyncStorage.
 */
export const saveLeaveData = async (leaveItems: LeaveItem[]) => {
  try {
    await AsyncStorage.setItem(LEAVE_DATA_KEY, JSON.stringify(leaveItems));
  } catch (error) {
    console.error('Failed to save leave data:', error);
  }
};

/**
 * Menambahkan data cuti baru.
 * Menerima data tanpa ID, status, dan tanggal diajukan, lalu mengisinya secara otomatis.
 */
export const addLeaveItem = async (
  newItem: Omit<LeaveItem, 'id' | 'status' | 'submittedDate'>
): Promise<LeaveItem[]> => {
  try {
    const existingData = await getLeaveData();
    const newLeave: LeaveItem = {
      ...newItem,
      id: uuidv4(),
      status: 'Sedang Diproses', // Default status untuk pengajuan baru
      submittedDate: new Date().toISOString().slice(0, 10), // Tanggal saat ini
    };
    const updatedData = [newLeave, ...existingData];
    await saveLeaveData(updatedData);
    return updatedData;
  } catch (error) {
    console.error('Failed to add new leave item:', error);
    return [];
  }
};

/**
 * Menghapus item cuti berdasarkan ID.
 */
export const deleteLeaveItem = async (id: string): Promise<LeaveItem[]> => {
  try {
    const existingData = await getLeaveData();
    const updatedData = existingData.filter((item) => item.id !== id);
    await saveLeaveData(updatedData);
    return updatedData;
  } catch (error) {
    console.error('Failed to delete leave item:', error);
    return [];
  }
};

export const getLeaveItemById = async (
  id: string
): Promise<LeaveItem | undefined> => {
  try {
    const allLeaveData = await getLeaveData();
    return allLeaveData.find((item) => item.id === id);
  } catch (error) {
    console.error('Failed to get leave item by ID:', error);
    return undefined;
  }
};
