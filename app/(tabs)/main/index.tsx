// app/screens/main/Home.tsx (atau di mana pun komponen Home Anda berada)
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

// Import UserType jika belum
import { UserType } from '../../types/index'; // Pastikan path ini benar

export default function Home() {
  // Inisialisasi state user dengan null atau objek kosong yang sesuai
  const [user, setUser] = useState<UserType | null>(null);

  // useAsyncStorage hanya menyediakan fungsi getItem/setItem, bukan state yang langsung sinkron
  const { getItem } = useAsyncStorage('user');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const jsonValue = await getItem(); // <--- WAJIB MENGGUNAKAN AWAIT DI SINI
        console.log('Raw data from async storage:', jsonValue); // Log raw string JSON

        if (jsonValue != null) {
          const userData: UserType = JSON.parse(jsonValue); // Parse JSON string
          setUser(userData); // Set state dengan data user
          console.log('Parsed user data from async storage:', userData); // Log parsed object
        } else {
          console.log('No user data found in async storage.');
        }
      } catch (e) {
        console.error('Failed to load user from async storage', e);
      }
    };

    loadUser(); // Panggil fungsi async
  }, []); // Dependensi useEffect harus mencakup getItem

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {user ? (
        <View>
          <Text className='text-3xl font-bold'>
            Selamat Datang, {user.name}!
          </Text>
          <Text>Email: {user.email}</Text>
          <Text>Alamat: {user.address}</Text>
          {/* Tampilkan detail user lainnya sesuai kebutuhan */}
        </View>
      ) : (
        <Text>Memuat data pengguna...</Text>
      )}
    </View>
  );
}
