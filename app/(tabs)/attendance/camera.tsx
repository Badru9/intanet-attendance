// app/attendance/camera.tsx
// Kode lengkap dengan perbaikan tombol, logika flash, dan desain glassmorphism pada pratinjau.

import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import {
  CameraType,
  CameraView,
  FlashMode,
  useCameraPermissions,
} from 'expo-camera';
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
import { getCaptureCallback } from '../../../utils/callbackStore';

export default function AttendanceCameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    requestPermission();
  }, []);

  const onCameraReady = () => {
    setIsReady(true);
  };

  const handleCapture = async () => {
    if (!isReady || !cameraRef.current) {
      Alert.alert('Kamera belum siap.');
      return;
    }
    setIsReady(false);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        setCapturedPhotoUri(photo.uri);
      }
    } catch (e) {
      console.error('Error saat mengambil foto:', e);
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengambil foto.');
      setIsReady(true);
    }
  };

  const handleUsePhoto = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('Pratinjau tidak ada.');
      return;
    }
    try {
      const locationString = `Lat: -6.1754, Lon: 106.8272`;
      const captureCallback = getCaptureCallback();
      if (captureCallback) {
        captureCallback(capturedPhotoUri, locationString, 'Catatan dari user');
      } else {
        Alert.alert('Error', 'Callback presensi tidak ditemukan.');
      }
      router.back();
    } catch (e) {
      console.error('Error saat memproses presensi:', e);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memproses presensi.');
      setCapturedPhotoUri(null);
      setIsReady(true);
    }
  };

  const handleRetake = () => {
    setCapturedPhotoUri(null);
    setIsReady(true);
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
        // Jika beralih ke kamera depan, matikan flash
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

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Kami membutuhkan izin akses kamera untuk melakukan presensi.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {capturedPhotoUri ? (
        <>
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.previewImage}
            resizeMode='cover'
          />
          <View style={styles.previewActionsContainer}>
            <BlurView
              intensity={30}
              tint='dark'
              style={styles.blurPreviewButtonContainer}
            >
              <TouchableOpacity
                onPress={handleRetake}
                style={styles.previewButton}
              >
                <Feather name='x-circle' size={28} color='#FFF' />
                <Text style={styles.previewButtonText}>Ambil Ulang</Text>
              </TouchableOpacity>
            </BlurView>
            <BlurView
              intensity={30}
              tint='dark'
              style={styles.blurPreviewButtonContainer}
            >
              <TouchableOpacity
                onPress={handleUsePhoto}
                style={styles.previewButton}
              >
                <Feather name='check-circle' size={28} color='#10B981' />
                <Text style={styles.previewButtonText}>Gunakan Foto</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
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

          <View style={[styles.infoOverlay, { top: topPosition + 60 }]}>
            <BlurView intensity={40} tint='dark' style={styles.infoBlur}>
              <Text style={styles.infoText}>Ambil gambar untuk Laporan</Text>
            </BlurView>
          </View>

          <View style={styles.captureButtonContainer}>
            <TouchableOpacity
              onPress={handleCapture}
              style={[
                styles.captureButton,
                !isReady && styles.captureButtonDisabled,
              ]}
              disabled={!isReady}
            >
              <Feather name='camera' size={30} color='#FFF' />
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
    overflow: 'hidden',
  },
  previewButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewButtonText: {
    marginTop: 4,
    color: '#FFF',
    fontWeight: '500',
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
    fontSize: 16,
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
