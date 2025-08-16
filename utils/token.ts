// src/utils/token.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Menyimpan token otentikasi ke AsyncStorage.
 *
 * @param token Token yang akan disimpan.
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('user_token', token);
    console.log('Token berhasil disimpan.');
  } catch (error) {
    console.error('Terjadi error saat menyimpan token:', error);
    throw new Error('Gagal menyimpan token.');
  }
};

/**
 * Mengambil token otentikasi dari AsyncStorage.
 *
 * @returns Promise yang berisi token atau null jika tidak ada.
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('user_token');
    console.log(
      'Token dari AsyncStorage:',
      token ? 'Ditemukan' : 'Tidak Ditemukan'
    );

    console.log('Token yang diambil:', token);
    return token;
  } catch (error) {
    console.error('Terjadi error saat mengambil token:', error);
    return null;
  }
};

/**
 * Menghapus token otentikasi dari AsyncStorage.
 */
export const removeToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('user_token');
    console.log('Token berhasil dihapus.');
  } catch (error) {
    console.error('Terjadi error saat menghapus token:', error);
    throw new Error('Gagal menghapus token.');
  }
};
