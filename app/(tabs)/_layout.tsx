// app/_layout.tsx

import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import '../global.css';

// Import Context Providers
// Ini adalah contoh, Anda mungkin perlu membuatnya terlebih dahulu.
import { AuthProvider } from '../../contexts/authContext';
import { ThemeProvider } from '../../contexts/themeContext';

// Import custom hooks jika ada logic inisialisasi yang kompleks
import { useSetupApp } from '../../hooks/useSetupApp';

// Root layout untuk seluruh aplikasi
export default function RootLayout() {
  // Gunakan custom hook untuk inisialisasi
  // Ini bisa mencakup:
  // - Memuat user dari AsyncStorage
  // - Memeriksa status autentikasi
  // - Memuat data awal lainnya
  const { isLoading, error } = useSetupApp();

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

  // Tangani error jika terjadi saat inisialisasi
  if (error) {
    // Tampilkan pesan error yang lebih informatif atau UI khusus
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

  // Wrapper untuk Context Providers
  return (
    <ThemeProvider>
      <AuthProvider>
        {/*
          Slot adalah placeholder di mana rute-rute anak (child routes)
          akan dirender. Semua rute di dalam `app/` akan di-render di sini.
        */}
        <Slot />
        <StatusBar style='light' />
      </AuthProvider>
    </ThemeProvider>
  );
}
