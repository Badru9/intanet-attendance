import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { login } from '../../services/auth';
// Pastikan Anda sudah mengonfigurasi Tailwind CSS di proyek Expo Anda.
// Biasanya, tidak ada import khusus untuk Tailwind di JSX itu sendiri,
// karena ia bekerja dengan memproses nama kelas yang Anda berikan.

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (email && password) {
      // Alert.alert('Login Berhasil', `Email: ${email}\nPassword: ${password}`);
      // Di sini Anda akan mengintegrasikan logika autentikasi dengan backend
      // dan navigasi ke halaman berikutnya setelah login.

      const response = await login({ email, password });
      console.log('response on login', response);
    } else {
      Alert.alert('Error', 'Mohon masukkan email dan password Anda.');
    }
  };

  return (
    <View className='flex-1 items-center justify-center bg-gray-100 p-5'>
      <Text className='text-3xl font-bold text-gray-800 mb-2'>
        Selamat Datang!
      </Text>
      <Text className='text-base text-gray-600 mb-10'>
        Silakan login untuk melanjutkan
      </Text>

      <TextInput
        className='w-full h-12 bg-white rounded-lg px-4 mb-4 text-base border border-gray-300 shadow-sm'
        placeholder='Email'
        autoFocus
        placeholderTextColor='#9ca3af'
        keyboardType='email-address'
        autoCapitalize='none'
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        className='w-full h-12 bg-white rounded-lg px-4 mb-6 text-base border border-gray-300 shadow-sm'
        placeholder='Password'
        placeholderTextColor='#9ca3af'
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className='w-full h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 shadow-md'
        onPress={handleLogin}
      >
        <Text className='text-white text-lg font-semibold'>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          Alert.alert('Lupa Password?', 'Fitur ini akan segera tersedia.')
        }
      >
        <Text className='text-blue-600 text-sm'>Lupa Password?</Text>
      </TouchableOpacity>
    </View>
  );
}
