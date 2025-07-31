// app/services/attendance.ts

import { apiClient } from './api'; // Pastikan apiClient ini sudah dikonfigurasi dengan baseURL

// Tipe data untuk payload attendance
type AttendancePayload = {
  location_check_in: string;
  photo_check_in: string; // URL/URI lokal dari gambar
  notes: string | null; // Notes bisa nullable
};

// Tipe untuk respons sukses dari API
type AttendanceSuccessResponse = {
  success: boolean;
  message: string;
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://your-ngrok-url.ngrok-free.app';

export const attendance = async (
  data: AttendancePayload
): Promise<AttendanceSuccessResponse> => {
  try {
    console.log('API Base URL:', API_BASE_URL);
    console.log('Check In data received by service:', data);

    // 1. Buat FormData untuk mengirim file dan data lainnya
    const formData = new FormData();
    formData.append('location_check_in', data.location_check_in);
    if (data.notes) {
      // notes adalah nullable di Laravel
      formData.append('notes', data.notes);
    }

    // Mendapatkan nama file dari URI lokal untuk FormData
    const filename = data.photo_check_in.split('/').pop();
    const fileType = 'image/jpeg'; // Asumsikan JPEG, sesuaikan jika Anda punya deteksi tipe file yang lebih baik

    // Menambahkan file ke FormData
    formData.append('photo_check_in', {
      uri: data.photo_check_in,
      name: filename || 'photo_check_in.jpg', // Beri nama default jika filename tidak ada
      type: fileType,
    } as any); // Type assertion 'as any' karena FormData di React Native/web sedikit berbeda dengan Node.js

    console.log('FormData prepared:', formData);

    // 2. Kirim permintaan POST dengan Content-Type: multipart/form-data
    // Axios akan secara otomatis mengatur Content-Type menjadi multipart/form-data
    // saat Anda mengirim instance FormData.
    const response = await apiClient.post<AttendanceSuccessResponse>(
      '/api/attendances/check-in',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Anda mungkin perlu timeout yang lebih besar untuk upload file
        timeout: 30000, // 30 detik
      }
    );

    console.log('Check In Successful', response.data);

    // Periksa apakah operasi berhasil berdasarkan respons data
    // ASUMSI: Server Laravel akan mengembalikan JSON { success: true, message: "..." }
    if (!response.data.success) {
      // Jika server mengembalikan success: false, lempar error
      throw new Error(response.data.message || 'Check-in failed');
    }

    return response.data; // Mengembalikan respons data jika berhasil
  } catch (error: any) {
    console.error('Full error during check-in:', error); // Ubah log message
    console.error('Error response data:', error.response?.data);
    console.error('Error status:', error.response?.status);

    let errorMessage = 'Terjadi kesalahan tidak dikenal. Silakan coba lagi.';

    if (error.response) {
      // Server merespons dengan status error (e.g., 4xx, 5xx)
      const statusCode = error.response.status;
      const responseData = error.response.data;

      if (statusCode === 401) {
        errorMessage =
          responseData.message ||
          'Sesi Anda telah habis atau tidak sah. Silakan login kembali.';
      } else if (statusCode === 403) {
        errorMessage =
          responseData.message ||
          'Anda tidak memiliki izin untuk melakukan aksi ini.';
      } else if (statusCode === 422 && responseData.errors) {
        // Handle Laravel validation errors
        const validationErrors = responseData.errors;
        // Ambil pesan error pertama dari validasi Laravel
        const firstErrorKey = Object.keys(validationErrors)[0];
        if (firstErrorKey) {
          errorMessage = validationErrors[firstErrorKey][0];
        } else {
          errorMessage = 'Data yang Anda masukkan tidak valid.';
        }
      } else if (responseData.message) {
        errorMessage = responseData.message; // Ambil pesan error umum dari server
      } else {
        errorMessage = `Server Error: ${statusCode}`;
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada respons (e.g., network error, CORS issues)
      errorMessage =
        'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
    } else {
      // Sesuatu terjadi saat menyiapkan request yang memicu error
      errorMessage = error.message || 'Terjadi kesalahan tak terduga.';
    }

    // Custom error handling for specific Axios codes
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Permintaan terlalu lama. Periksa koneksi atau coba lagi.';
    } else if (error.message && error.message.includes('Network Error')) {
      // Specific for Axios network errors
      errorMessage =
        'Terjadi masalah jaringan. Pastikan Anda terhubung ke internet.';
    }

    // Akhirnya, lempar error baru dengan pesan yang lebih spesifik
    throw new Error(errorMessage);
  }
};
