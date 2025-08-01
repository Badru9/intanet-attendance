// app/_layout.tsx

import { Slot, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar, Text, View } from 'react-native';
import './global.css';

// Import Context Providers
import { AuthProvider, useAuth } from '../contexts/authContext';
import { ThemeProvider } from '../contexts/themeContext';

// Import custom hook
import { useSetupApp } from '../hooks/useSetupApp';

// Root layout untuk seluruh aplikasi
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthInitializer />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Komponen terpisah untuk menangani inisialisasi autentikasi
function AuthInitializer() {
  const { isLoading, error, initialUserData } = useSetupApp();
  const { login, logout, user } = useAuth();
  const segments = useSegments();

  // Efek untuk login user setelah data awal dimuat
  useEffect(() => {
    if (!isLoading && initialUserData.user && initialUserData.token) {
      login(initialUserData.user, initialUserData.token);
    } else if (!isLoading && !initialUserData.user) {
      // Jika tidak ada data user, pastikan state AuthContext kosong
      logout();
    }
  }, [isLoading, initialUserData, login, logout]);

  // Logika redirect berdasarkan status autentikasi
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';

    if (user && inAuthGroup) {
      // User sudah login, redirect ke halaman utama
      // router.replace('/(tabs)/main/Home'); // Menggunakan hook useRouter
    } else if (!user && !inAuthGroup) {
      // User belum login, redirect ke halaman login
      // router.replace('/(auth)/login');
    }
  }, [user, segments]);

  // Tampilkan loading screen saat aplikasi sedang inisialisasi
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}
      >
        <Text style={{ color: '#FFF' }}>Memuat Aplikasi...</Text>
      </View>
    );
  }

  // Tampilkan error jika terjadi
  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FF0000',
        }}
      >
        <Text style={{ color: '#FFF' }}>
          Terjadi kesalahan saat memuat aplikasi.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Slot />
      <StatusBar />
    </>
  );
}
