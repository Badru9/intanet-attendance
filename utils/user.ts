// src/utils/user.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType } from '../types';

/**
 * Menyimpan data pengguna dan token otentikasi.
 *
 * @param user Data user yang akan disimpan.
 * @param token Token otentikasi yang akan disimpan.
 */
export const saveUser = async (
  user: UserType,
  token: string
): Promise<void> => {
  try {
    console.log('=== SAVING USER DATA ===');
    console.log('User data to save:', user);
    console.log('Token to save:', token ? 'Token exists' : 'No token');

    await AsyncStorage.setItem('user_token', token);
    await AsyncStorage.setItem('user_data', JSON.stringify(user));

    console.log('User data and token saved successfully.');

    // Verify data was saved
    const savedUserData = await AsyncStorage.getItem('user_data');
    const savedToken = await AsyncStorage.getItem('user_token');
    console.log('Verification - Saved user data:', savedUserData);
    console.log('Verification - Saved token exists:', !!savedToken);
  } catch (error) {
    console.error('Terjadi error ketika menyimpan data:', error);
    throw new Error('Terjadi error saat menyimpan data' + error);
  }
};

/**
 * Mengambil data pengguna dari penyimpanan.
 *
 * @returns Promise yang berisi data pengguna atau null jika tidak ada.
 */
export const getUser = async () => {
  try {
    console.log('=== GETTING USER DATA FROM STORAGE ===');

    const userData = await AsyncStorage.getItem('user_data');
    const userToken = await AsyncStorage.getItem('user_token');

    console.log('Raw user data from AsyncStorage:', userData);
    console.log(
      'Raw token from AsyncStorage:',
      userToken ? 'Token exists' : 'No token'
    );

    const parsedUser = userData ? JSON.parse(userData) : null;
    console.log('Parsed user data:', parsedUser);

    return {
      user: parsedUser,
      token: userToken || null,
    };
  } catch (error) {
    console.error('Terjadi error ketika mengambil data:', error);
    throw new Error('Terjadi error saat mengambil data' + error);
  }
};

/**
 * Menghapus data otentikasi (user dan token) dari penyimpanan.
 */
export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_data');
    console.log('Authentication data cleared.');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw new Error('Gagal menghapus data otentikasi.');
  }
};
