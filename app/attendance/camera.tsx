// app/attendance/camera.tsx

import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCaptureCallback } from '../../utils/callbackStore';

// Mengambil waktu saat ini dalam format yang mudah dibaca
const getCurrentTimeFormatted = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export default function AttendanceCameraScreen() {
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, requestLocationPermission] =
    Location.useForegroundPermissions();
  const [isReady, setIsReady] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [currentTime, setCurrentTime] = useState<string>(
    getCurrentTimeFormatted()
  );
  const [locationString, setLocationString] =
    useState<string>('Mencari lokasi...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileSizeInfo, setFileSizeInfo] = useState<string>('');
  const [isLocationReady, setIsLocationReady] = useState(false);

  // State untuk menyimpan data saat foto diambil
  const [captureData, setCaptureData] = useState<{
    time: string;
    location: string;
  } | null>(null);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<number | null>(null);

  // Image manipulator hook - hanya aktif ketika ada foto
  const imageManipulator = ImageManipulator.useImageManipulator(
    capturedPhotoUri ?? ''
  );

  useEffect(() => {
    // Meminta izin kamera dan lokasi saat komponen pertama kali dimuat
    const getPermissions = async () => {
      await requestCameraPermission();
      await requestLocationPermission();
      if (locationPermission?.granted) {
        updateLocation();
      }
    };
    getPermissions();
  }, []);

  useEffect(() => {
    // Memperbarui waktu setiap detik hanya jika foto belum diambil
    if (!capturedPhotoUri) {
      timerRef.current = setInterval(() => {
        setCurrentTime(getCurrentTimeFormatted());
      }, 1000) as number;
    } else {
      // Hentikan timer saat foto sudah diambil
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [capturedPhotoUri]);

  // Update lokasi secara berkala ketika kamera aktif
  useEffect(() => {
    if (!capturedPhotoUri && locationPermission?.granted) {
      const locationUpdateInterval = setInterval(() => {
        updateLocation();
      }, 5000); // Update setiap 5 detik

      return () => clearInterval(locationUpdateInterval);
    }
  }, [capturedPhotoUri, locationPermission?.granted]);

  // Setup image manipulator ketika foto berhasil diambil
  useEffect(() => {
    if (capturedPhotoUri && imageManipulator) {
      try {
        // Setup transformasi untuk kompresi optimal
        imageManipulator.reset(); // Reset ke state awal
        imageManipulator.resize({ width: 1000 }); // Resize untuk mengurangi ukuran file
      } catch (error) {
        console.error('Error setting up image manipulator:', error);
      }
    }
  }, [capturedPhotoUri, imageManipulator]);

  // Fungsi untuk mengecek ukuran file
  const getFileSize = async (uri: string): Promise<number> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists ? fileInfo.size || 0 : 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  };

  // Fungsi untuk format ukuran file
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const updateLocation = async () => {
    if (!locationPermission?.granted) {
      setLocationString('Izin lokasi tidak diberikan');
      setIsLocationReady(false);
      return;
    }
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const { latitude, longitude } = location.coords;
      setLocationString(
        `Lat: ${latitude.toFixed(4)} \nLon: ${longitude.toFixed(4)}`
      );
      setIsLocationReady(true);
    } catch (e) {
      console.error('Error saat mendapatkan lokasi:', e);
      setLocationString('Gagal mendapatkan lokasi.');
      setIsLocationReady(false);
    }
  };

  const onCameraReady = () => {
    setIsReady(true);
  };

  const handleCapture = async () => {
    if (!isReady || !cameraRef.current) {
      Alert.alert('Kamera belum siap.');
      return;
    }
    if (!locationPermission?.granted) {
      Alert.alert(
        'Izin lokasi diperlukan',
        'Mohon berikan izin lokasi untuk melanjutkan.'
      );
      return;
    }
    setIsReady(false);
    try {
      // Ambil waktu dan lokasi tepat saat foto diambil
      const captureTime = getCurrentTimeFormatted();
      await updateLocation(); // Pastikan lokasi terbaru

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Kualitas awal yang baik
        skipProcessing: false,
      });
      if (photo) {
        setCapturedPhotoUri(photo.uri);

        // Cek ukuran file asli
        // const originalSize = await getFileSize(photo.uri);
        // setFileSizeInfo(`Original: ${formatFileSize(originalSize)}`);

        // Simpan data capture untuk digunakan nanti
        setCaptureData({
          time: captureTime,
          location: locationString,
        });
      }
    } catch (e) {
      console.error('Error saat mengambil foto:', e);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengambil foto.');
      setIsReady(true);
    }
  };

  const handleUsePhoto = async () => {
    if (!capturedPhotoUri || !captureData || !imageManipulator) {
      Alert.alert('Pratinjau tidak ada atau gambar belum siap.');
      return;
    }

    setIsProcessing(true);

    try {
      const captureCallback = getCaptureCallback();
      if (captureCallback) {
        // Reset manipulator dan terapkan transformasi
        imageManipulator.reset(); // Reset ke state awal

        // Terapkan transformasi secara berurutan untuk optimasi ukuran
        imageManipulator.resize({ width: 1000 }); // Resize untuk mengurangi ukuran

        // Bisa tambah transformasi lain jika diperlukan:
        // imageManipulator.rotate(0); // Rotasi jika diperlukan
        // imageManipulator.crop({ x: 0, y: 0, width: 1000, height: 1000 }); // Crop jika diperlukan

        // Render hasil manipulasi
        const renderedImage = await imageManipulator.renderAsync();

        // Save dengan kompresi tinggi untuk memastikan < 2MB
        const finalImage = await renderedImage.saveAsync({
          compress: 0.6, // Kompresi 60% untuk ukuran file kecil
          format: ImageManipulator.SaveFormat.JPEG,
        });

        // Cek ukuran file hasil kompresi
        const compressedSize = await getFileSize(finalImage.uri);
        const originalSizeMatch = fileSizeInfo.match(/Original: (.+)/);

        console.log(
          `File size - Original: ${originalSizeMatch?.[1] || 'Unknown'}, Compressed: ${formatFileSize(compressedSize)}`
        );

        // Jika masih lebih dari 2MB, kompresi ulang
        const maxSizeInBytes = 2 * 1024 * 1024; // 2MB dalam bytes
        let finalUri = finalImage.uri;

        if (compressedSize > maxSizeInBytes) {
          Alert.alert(
            'Info',
            `Ukuran file masih ${formatFileSize(compressedSize)}, melakukan kompresi tambahan...`
          );

          // Kompresi ulang dengan setting lebih agresif
          imageManipulator.reset();
          imageManipulator.resize({ width: 800 }); // Resize lebih kecil

          const secondRender = await imageManipulator.renderAsync();
          const secondCompress = await secondRender.saveAsync({
            compress: 0.4, // Kompresi lebih tinggi
            format: ImageManipulator.SaveFormat.JPEG,
          });

          const finalSize = await getFileSize(secondCompress.uri);
          console.log(`Final compressed size: ${formatFileSize(finalSize)}`);
          finalUri = secondCompress.uri;
        }

        // Kirim hasil ke callback
        captureCallback(finalUri, captureData.location, 'Catatan dari user');
      } else {
        Alert.alert('Error', 'Callback presensi tidak ditemukan.');
      }
      router.back();
    } catch (e) {
      console.error('Error saat memproses presensi:', e);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memproses presensi.');
      setCapturedPhotoUri(null);
      setCaptureData(null);
      setIsReady(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPhotoUri(null);
    setCaptureData(null);
    setFileSizeInfo('');
    setIsReady(true);
    setIsProcessing(false);
    // Mulai lagi update waktu dan lokasi
    setCurrentTime(getCurrentTimeFormatted());
    updateLocation();
  };

  const toggleFlash = () => {
    setFlashMode((prevMode) => {
      switch (prevMode) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
          return 'off';
        default:
          return 'off';
      }
    });
  };

  const toggleCameraType = () => {
    setCameraType((currentType) => {
      if (currentType === 'back') {
        setFlashMode('off');
        return 'front';
      }
      return 'back';
    });
  };

  const getFlashIcon = () => {
    switch (flashMode) {
      case 'on':
        return 'zap';
      case 'auto':
        return 'zap-off';
      case 'off':
      default:
        return 'zap-off';
    }
  };

  const topPosition = Platform.OS === 'ios' ? 60 : 40;

  if (!cameraPermission || !locationPermission) {
    return <View />;
  }

  if (!cameraPermission.granted || !locationPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Kami membutuhkan izin akses kamera dan lokasi untuk presensi.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => {
            requestCameraPermission();
            requestLocationPermission();
          }}
        >
          <Text style={styles.permissionButtonText}>Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const OverlayTimeLocation = () => (
    <View style={[styles.timeLocationOverlay]}>
      <BlurView intensity={40} tint='dark' style={styles.infoBlur}>
        <Text
          style={{
            ...styles.infoText,
            fontSize: 20,
            fontWeight: 'semibold',
            marginBottom: 8,
          }}
        >
          PT Intan Digital Internet ( INTANET )
        </Text>
        <Text style={styles.infoText}>
          {captureData ? captureData.time : currentTime}
        </Text>
        <Text style={styles.infoText}>
          {captureData ? captureData.location : locationString}
        </Text>
        {fileSizeInfo && (
          <Text style={{ ...styles.infoText, fontSize: 14, marginTop: 4 }}>
            {fileSizeInfo}
          </Text>
        )}
      </BlurView>
    </View>
  );

  return (
    <View style={styles.container}>
      {capturedPhotoUri ? (
        <>
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.previewImage}
            resizeMode='cover'
          />
          <OverlayTimeLocation />
          <View style={styles.previewActionsContainer}>
            <View style={styles.blurPreviewButtonContainer}>
              <TouchableOpacity
                onPress={handleRetake}
                style={{ ...styles.previewButton, backgroundColor: '#EF4444' }}
                disabled={isProcessing}
              >
                <Feather name='x' size={28} color='#FFF' />
              </TouchableOpacity>
            </View>
            <View style={styles.blurPreviewButtonContainer}>
              <TouchableOpacity
                onPress={handleUsePhoto}
                style={{
                  ...styles.previewButton,
                  backgroundColor: isProcessing ? '#6B7280' : '#10B981',
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Feather name='loader' size={28} color='#FFF' />
                ) : (
                  <Feather name='check' size={28} color='#FFF' />
                )}
              </TouchableOpacity>
            </View>
          </View>
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <BlurView
                intensity={60}
                tint='dark'
                style={styles.processingBlur}
              >
                <Text style={styles.processingText}>Memproses gambar...</Text>
              </BlurView>
            </View>
          )}
        </>
      ) : (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            ref={cameraRef}
            onCameraReady={onCameraReady}
            facing={cameraType}
            flash={flashMode}
          />
          <View style={[styles.topControls, { top: topPosition }]}>
            <BlurView intensity={40} tint='dark' style={styles.blurContainer}>
              <TouchableOpacity onPress={() => router.back()}>
                <Feather name='arrow-left' size={24} color='#FFF' />
              </TouchableOpacity>
            </BlurView>
            <View style={styles.topRightControls}>
              {cameraType === 'back' && (
                <BlurView
                  intensity={40}
                  tint='dark'
                  style={styles.blurContainer}
                >
                  <TouchableOpacity onPress={toggleFlash}>
                    <Feather
                      name={getFlashIcon()}
                      size={24}
                      color={flashMode === 'on' ? '#FBBF24' : '#FFF'}
                    />
                  </TouchableOpacity>
                </BlurView>
              )}
              <BlurView intensity={40} tint='dark' style={styles.blurContainer}>
                <TouchableOpacity onPress={toggleCameraType}>
                  <Feather
                    name={cameraType === 'front' ? 'repeat' : 'camera'}
                    size={24}
                    color='#FFF'
                  />
                </TouchableOpacity>
              </BlurView>
            </View>
          </View>
          <OverlayTimeLocation />
          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              onPress={handleCapture}
              style={[
                styles.captureButton,
                (!isReady || !isLocationReady) && styles.captureButtonDisabled,
              ]}
              disabled={!isReady || !isLocationReady}
            >
              {!isLocationReady ? (
                <Feather name='loader' size={30} color='#FFF' />
              ) : (
                <Feather name='camera' size={30} color='#FFF' />
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000',
  },
  permissionText: {
    textAlign: 'center',
    color: '#FFF',
  },
  permissionButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  previewActionsContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
    paddingHorizontal: 20,
  },
  blurPreviewButtonContainer: {
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  previewButton: {
    marginBottom: 30,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    marginTop: 4,
    color: '#FFF',
    fontWeight: '500',
  },
  processingOverlay: {
    position: 'absolute',
    top: '45%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -25 }],
    zIndex: 20,
  },
  processingBlur: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  processingText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  topControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timeLocationOverlay: {
    position: 'absolute',
    left: 16,
    bottom: 200,
    zIndex: 10,
  },
  blurContainer: {
    borderRadius: 9999,
    padding: 8,
    overflow: 'hidden',
  },
  infoOverlay: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
  },
  infoBlur: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  infoText: {
    color: '#FFF',
    fontSize: 20,
  },
  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
});
