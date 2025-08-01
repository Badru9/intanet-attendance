// hooks/useSetupApp.ts

import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { UserType } from '../types';

/**
 * Custom hook untuk melakukan setup awal aplikasi.
 * Hanya bertanggung jawab untuk memuat data dari AsyncStorage.
 */
export const useSetupApp = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initialUserData, setInitialUserData] = useState<{
    user: UserType | null | any;
    token: string | null;
  }>({ user: null, token: null });
  const [error, setError] = useState<Error | null>(null);

  // Ambil token dan user dari storage
  const { getItem: getUserItem } = useAsyncStorage('user');
  const { getItem: getTokenItem } = useAsyncStorage('token'); // Asumsi Anda menyimpan token di kunci 'token'

  useEffect(() => {
    const setup = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const userJson = await getUserItem();
        const token = await getTokenItem(); // Ambil token

        let userData = null;
        if (userJson) {
          userData = JSON.parse(userJson);
        }

        setInitialUserData({ user: userData, token: token });
      } catch (e: any) {
        console.error('Failed to setup app:', e);
        setError(e);
      } finally {
        setIsLoading(false);
      }
    };

    setup();
  }, []);

  return { isLoading, error, initialUserData };
};
