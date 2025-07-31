// app/screens/main/attendance/camera.tsx

import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router'; // Hapus useLocalSearchParams karena tidak lagi dipakai untuk callback
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { DESIGN_TOKENS } from '../../../constants/designTokens';
import {
  clearCaptureCallback,
  getCaptureCallback,
} from '../../../utils/callbackStore'; // Import from callbackStore

export default function AttendanceCameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] =
    Location.useForegroundPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Ambil callback dari callbackStore, BUKAN dari useLocalSearchParams
  // Kita akan ambil callback ini saat takePicture dipanggil
  // onCaptureCallback tidak lagi perlu di state karena diambil saat dibutuhkan

  useEffect(() => {
    // Request permissions on component mount
    (async () => {
      // Request Camera Permission
      if (!permission?.granted) {
        const { status: camStatus } = await requestPermission();
        if (camStatus !== 'granted') {
          Alert.alert(
            'Izin Kamera Diperlukan',
            'Kami membutuhkan izin kamera untuk mengambil foto presensi. Anda bisa mengaktifkannya di pengaturan aplikasi.'
          );
          router.back();
          return;
        }
      }

      // Request Location Permission
      if (!locationPermission?.granted) {
        const { status: locStatus } = await requestLocationPermission();
        if (locStatus !== 'granted') {
          Alert.alert(
            'Izin Lokasi Diperlukan',
            'Kami membutuhkan izin lokasi untuk mencatat posisi presensi Anda. Anda bisa mengaktifkannya di pengaturan aplikasi.'
          );
          // Opsi: Anda bisa memutuskan apakah akan tetap membiarkan pengguna melanjutkan atau kembali.
          // Untuk presensi, lokasi biasanya wajib, jadi opsi kembali mungkin relevan.
          // Atau, nonaktifkan tombol 'ambil foto' jika lokasi tidak diizinkan.
          // Saat ini, tetap izinkan tapi berikan warning.
        }
      }
    })();

    // Cleanup the callback store when the component unmounts or before it re-renders for a new capture
    return () => {
      // clearCaptureCallback(); // Pertimbangkan untuk membersihkan di sini atau setelah callback dipanggil
    };
  }, [
    permission,
    locationPermission,
    requestPermission,
    requestLocationPermission,
  ]);

  if (!permission || !locationPermission) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-900'>
        <ActivityIndicator size='large' color={DESIGN_TOKENS.colors.primary} />
        <Text className='mt-4 text-white text-lg'>Memuat izin...</Text>
      </View>
    );
  }

  if (!permission.granted || !locationPermission.granted) {
    return (
      <View className='flex-1 justify-center items-center px-6 bg-gray-900'>
        <BlurView
          intensity={Platform.OS === 'ios' ? 30 : 25}
          tint='dark'
          className='rounded-xl p-8 bg-glassCardBg border-0.5 border-glassBorder shadow-md'
          style={{
            shadowColor: 'rgba(0,0,0,0.3)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <Text
            style={{
              ...DESIGN_TOKENS.typography.h2,
              color: DESIGN_TOKENS.colors.textPrimary,
            }}
            className='text-center mb-4'
          >
            Izin Diperlukan
          </Text>
          <Text
            style={{
              ...DESIGN_TOKENS.typography.bodyLight,
              color: DESIGN_TOKENS.colors.textSecondary,
            }}
            className='text-center mb-6'
          >
            Aplikasi membutuhkan izin kamera dan lokasi untuk fitur presensi.
            Mohon berikan izin di pengaturan perangkat Anda.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              await requestPermission();
              await requestLocationPermission();
            }}
            className='rounded-md overflow-hidden'
          >
            <LinearGradient
              colors={[DESIGN_TOKENS.colors.primary, '#0056CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className='h-14 justify-center items-center flex-row shadow-lg'
              style={{
                shadowColor: DESIGN_TOKENS.colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Text
                style={{
                  ...DESIGN_TOKENS.typography.button,
                  color: DESIGN_TOKENS.colors.textOnButton,
                }}
              >
                Beri Izin
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);

      try {
        // 1. Ambil Lokasi GPS (ulang untuk akurasi terbaru)
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        });
        const locationString = `${location.coords.latitude},${location.coords.longitude}`;
        console.log('Location Captured:', locationString);

        // 2. Ambil Foto
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          exif: false,
        });

        if (photo && photo.uri) {
          console.log('Photo URI Captured:', photo.uri);

          // Ambil callback dari store, dan panggil
          const storedCallback = getCaptureCallback();
          if (storedCallback) {
            storedCallback(photo.uri, locationString, null); // Panggil callback
            clearCaptureCallback(); // Bersihkan callback setelah digunakan
          } else {
            // Fallback jika tidak ada callback (harusnya tidak terjadi jika flow benar)
            Alert.alert(
              'Sukses',
              `Foto dan lokasi berhasil diambil! URI: ${photo.uri}, Lokasi: ${locationString}`
            );
          }
          router.back();
        } else {
          Alert.alert(
            'Gagal Mengambil Foto',
            'Terjadi masalah saat mengambil foto.'
          );
        }
      } catch (error: any) {
        console.error('Error during photo/location capture:', error);
        Alert.alert(
          'Error',
          `Gagal mengambil data: ${error.message || 'Terjadi kesalahan tidak dikenal.'}`
        );
      } finally {
        setIsCapturing(false);
      }
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <StatusBar barStyle='light-content' backgroundColor='black' />
      <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef}>
        <View className='flex-1 bg-transparent justify-between p-6'>
          {/* Top controls (e.g., close button) */}
          <View className='flex-row justify-end mt-4'>
            <TouchableOpacity
              onPress={() => router.back()}
              className='p-3 rounded-full bg-glassBg border-0.5 border-glassBorder'
            >
              <Feather
                name='x'
                size={24}
                color={DESIGN_TOKENS.colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Bottom controls */}
          <View className='flex-row justify-between items-end mb-6'>
            {/* Flip Camera Button */}
            <TouchableOpacity
              onPress={toggleCameraFacing}
              className='p-4 rounded-full bg-glassBg border-0.5 border-glassBorder'
            >
              <Feather
                name='refresh-cw'
                size={24}
                color={DESIGN_TOKENS.colors.textPrimary}
              />
            </TouchableOpacity>

            {/* Capture Button */}
            <TouchableOpacity
              onPress={takePicture}
              disabled={isCapturing}
              className='w-20 h-20 rounded-full items-center justify-center bg-primary border-4 border-white-400'
              style={{
                opacity: isCapturing ? 0.7 : 1,
                borderColor: DESIGN_TOKENS.colors.textPrimary,
              }}
            >
              {isCapturing ? (
                <ActivityIndicator
                  size='small'
                  color={DESIGN_TOKENS.colors.textOnButton}
                />
              ) : (
                <View className='w-16 h-16 rounded-full bg-white'></View>
              )}
            </TouchableOpacity>

            {/* Placeholder for future features or just for spacing */}
            <View className='w-14 h-14' />
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}
