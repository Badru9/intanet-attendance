// app/screens/main/Home.tsx

import { Feather } from '@expo/vector-icons';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import UserType
import { UserType } from '../../types/index';
// Import DESIGN_TOKENS
import { DESIGN_TOKENS } from '../../constants/designTokens';
// Import attendance service
import { attendance } from '../../../services/attendance'; // Adjust path if necessary
// Import callback store
import {
  clearCaptureCallback,
  setCaptureCallback,
} from '../../utils/callbackStore';

// Latar belakang yang sama untuk konsistensi
const BACKGROUND_IMAGE_URI =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<
    'clock_in' | 'clock_out' | null
  >(null); // 'clock_in' means already clocked in today, 'clock_out' means not yet
  const [isProcessingAttendance, setIsProcessingAttendance] = useState(false); // State for loading/processing

  const { getItem } = useAsyncStorage('user');

  // Animation values
  const headerAnim = useRef(
    new Animated.Value(-DESIGN_TOKENS.spacing.xl)
  ).current;
  const card1Anim = useRef(
    new Animated.Value(DESIGN_TOKENS.spacing.xxl)
  ).current;
  const card2Anim = useRef(
    new Animated.Value(DESIGN_TOKENS.spacing.xxl)
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadUserAndAttendanceStatus = async () => {
      try {
        const jsonValue = await getItem();
        if (jsonValue != null) {
          const userData: UserType = JSON.parse(jsonValue);
          setUser(userData);
          // TODO: Di sini, Anda perlu memuat status presensi pengguna untuk hari ini dari API backend.
          // Contoh: panggil API `/api/attendances/today-status`
          // Jika ada record presensi hari ini, set attendanceStatus('clock_in').
          // Jika tidak ada atau record menunjukkan belum check-in, set attendanceStatus('clock_out').
          // Untuk demonstrasi, kita akan default ke 'clock_out'.
          setAttendanceStatus('clock_out'); // Default: pengguna belum clock in.
        } else {
          // User data not found, maybe redirect to login?
          // router.replace('/auth/login');
        }
      } catch (e) {
        console.error(
          'Failed to load user or attendance status from async storage',
          e
        );
        // Handle error, e.g., show alert and redirect to login
      }
    };

    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };

    loadUserAndAttendanceStatus();
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.stagger(150, [
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(card1Anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(card2Anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    return () => clearInterval(intervalId); // Cleanup interval
  }, []); // Add getItem to dependencies if it's not stable across renders

  // --- Handlers for main features ---

  const handlePresence = async () => {
    // Disable interaction if already processing
    if (isProcessingAttendance) {
      return;
    }

    // Logic for preventing multiple clock-ins
    // Based on your Laravel controller, it only allows one check-in per day.
    // So, if attendanceStatus is 'clock_in', we prevent further clock-ins.
    if (attendanceStatus === 'clock_in') {
      Alert.alert(
        'Sudah Absen',
        'Anda sudah melakukan absensi hari ini. Tidak bisa melakukan Clock In lagi.',
        [{ text: 'OK' }]
      );
      return;
    }

    // This is the callback function that will be executed after photo/location capture
    // in AttendanceCameraScreen.
    const onCaptureData = async (
      photoUri: string,
      locationString: string,
      notes: string | null
    ) => {
      setIsProcessingAttendance(true); // Set loading true while sending to API
      try {
        const attendanceData = {
          location_check_in: locationString,
          photo_check_in: photoUri,
          notes: notes,
        };

        // Call the attendance service
        const response = await attendance(attendanceData);

        if (response.success) {
          setAttendanceStatus('clock_in'); // Update status to reflect successful clock-in
          Alert.alert('Sukses', response.message || 'Presensi berhasil!');
        } else {
          Alert.alert(
            'Gagal Presensi',
            response.message || 'Terjadi kesalahan saat presensi.'
          );
        }
      } catch (error: any) {
        console.error('Error sending attendance data:', error);
        Alert.alert(
          'Error Presensi',
          error.message || 'Terjadi kesalahan tidak terduga saat presensi.'
        );
      } finally {
        setIsProcessingAttendance(false); // Reset loading state
        clearCaptureCallback(); // Clear the callback from the store after execution
      }
    };

    // Before navigating to the camera screen, set the callback in the store.
    setCaptureCallback(onCaptureData);

    // Navigate to the camera screen. No need to pass params directly.
    router.push('/(tabs)/main/attendance/camera');
  };

  const handleLeaveRequest = () => {
    Alert.alert(
      'Ajukan Izin Cuti',
      'Fitur pengajuan cuti akan segera tersedia. Anda akan diarahkan ke halaman pengajuan cuti.',
      [
        {
          text: 'OK',
          onPress: () => {
            router.push('/(tabs)/main/Leave'); // Navigate to a dedicated leave request screen
          },
        },
      ]
    );
  };

  const handleOtherFeature = (featureName: string) => {
    Alert.alert(
      'Fitur Lain',
      `Anda mengklik fitur: ${featureName}. Ini adalah placeholder.`
    );
    // TODO: Implement navigation or logic for other features
  };

  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE_URI }}
      style={{ flex: 1 }}
      resizeMode='cover'
    >
      <StatusBar
        barStyle='light-content'
        translucent
        backgroundColor='transparent'
      />
      <BlurView
        intensity={Platform.OS === 'ios' ? 20 : 15}
        tint='dark'
        style={{
          flex: 1,
          paddingTop: StatusBar.currentHeight || DESIGN_TOKENS.spacing.xxl,
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: DESIGN_TOKENS.spacing.lg,
            paddingBottom: DESIGN_TOKENS.spacing.xxl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: headerAnim }],
              marginBottom: DESIGN_TOKENS.spacing.xl,
              marginTop: DESIGN_TOKENS.spacing.md,
            }}
          >
            <Text
              style={{
                ...DESIGN_TOKENS.typography.h1,
                color: DESIGN_TOKENS.colors.textPrimary,
                marginBottom: DESIGN_TOKENS.spacing.xs,
              }}
            >
              Halo, {user?.name || 'Pengguna'}!
            </Text>
            <Text
              style={{
                ...DESIGN_TOKENS.typography.bodyLight,
                color: DESIGN_TOKENS.colors.textSecondary,
              }}
            >
              {currentDate}
            </Text>
            <Text
              style={{
                ...DESIGN_TOKENS.typography.h2,
                color: DESIGN_TOKENS.colors.textPrimary,
                marginTop: DESIGN_TOKENS.spacing.xs,
              }}
            >
              {currentTime}
            </Text>
          </Animated.View>

          {/* Quick Actions Section */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: card1Anim }],
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 25}
              tint='systemMaterialDark'
              style={{
                borderRadius: DESIGN_TOKENS.borderRadius.xl,
                overflow: 'hidden',
                backgroundColor: DESIGN_TOKENS.colors.glassCardBg,
                borderWidth: 0.5,
                borderColor: DESIGN_TOKENS.colors.glassBorder,
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5,
                padding: DESIGN_TOKENS.spacing.xl,
              }}
            >
              <Text
                style={{
                  ...DESIGN_TOKENS.typography.h3,
                  color: DESIGN_TOKENS.colors.textPrimary,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                }}
              >
                Presensi Hari Ini
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: DESIGN_TOKENS.spacing.md,
                }}
              >
                <Feather
                  name={
                    attendanceStatus === 'clock_in' ? 'check-circle' : 'circle'
                  }
                  size={24}
                  color={
                    attendanceStatus === 'clock_in'
                      ? DESIGN_TOKENS.colors.success
                      : DESIGN_TOKENS.colors.textSecondary
                  }
                  style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                />
                <Text
                  style={{
                    ...DESIGN_TOKENS.typography.body,
                    color: DESIGN_TOKENS.colors.textSecondary,
                  }}
                >
                  Status:{' '}
                  {attendanceStatus === 'clock_in'
                    ? 'Sudah Melakukan Absensi'
                    : 'Belum Melakukan Absensi'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePresence}
                activeOpacity={0.8}
                disabled={
                  isProcessingAttendance || attendanceStatus === 'clock_in'
                } // Disable if processing OR already clocked in
                style={{
                  borderRadius: DESIGN_TOKENS.borderRadius.md,
                  overflow: 'hidden',
                  opacity:
                    isProcessingAttendance || attendanceStatus === 'clock_in'
                      ? 0.7
                      : 1, // Visual feedback when disabled
                }}
              >
                <LinearGradient
                  colors={
                    attendanceStatus === 'clock_in'
                      ? ['#FF3B30', '#CC2D2D'] // Red for already clocked in
                      : [DESIGN_TOKENS.colors.primary, '#0056CC']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 56,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    shadowColor: DESIGN_TOKENS.colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  {isProcessingAttendance ? (
                    <Feather
                      name='loader'
                      size={20}
                      color={DESIGN_TOKENS.colors.textOnButton}
                      style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                    />
                  ) : (
                    <Feather
                      name={
                        attendanceStatus === 'clock_in' ? 'check' : 'log-in' // Show check icon if already clocked in
                      }
                      size={20}
                      color={DESIGN_TOKENS.colors.textOnButton}
                      style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                    />
                  )}
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.button,
                      color: DESIGN_TOKENS.colors.textOnButton,
                    }}
                  >
                    {isProcessingAttendance
                      ? 'Memproses...'
                      : attendanceStatus === 'clock_in'
                        ? 'Sudah Absen Hari Ini'
                        : 'Clock In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {/* Leave Request Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: card2Anim }],
              marginBottom: DESIGN_TOKENS.spacing.lg,
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 25}
              tint='systemMaterialDark'
              style={{
                borderRadius: DESIGN_TOKENS.borderRadius.xl,
                overflow: 'hidden',
                backgroundColor: DESIGN_TOKENS.colors.glassCardBg,
                borderWidth: 0.5,
                borderColor: DESIGN_TOKENS.colors.glassBorder,
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5,
                padding: DESIGN_TOKENS.spacing.xl,
              }}
            >
              <Text
                style={{
                  ...DESIGN_TOKENS.typography.h3,
                  color: DESIGN_TOKENS.colors.textPrimary,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                }}
              >
                Pengajuan Izin / Cuti
              </Text>
              <Text
                style={{
                  ...DESIGN_TOKENS.typography.bodyLight,
                  color: DESIGN_TOKENS.colors.textSecondary,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                }}
              >
                Ajukan permohonan izin atau cuti Anda dengan mudah di sini.
              </Text>
              <TouchableOpacity
                onPress={handleLeaveRequest}
                activeOpacity={0.8}
                style={{
                  borderRadius: DESIGN_TOKENS.borderRadius.md,
                  overflow: 'hidden',
                }}
              >
                <LinearGradient
                  colors={[DESIGN_TOKENS.colors.accent, '#D68200']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    height: 56,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    shadowColor: DESIGN_TOKENS.colors.accent,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  <Feather
                    name='calendar'
                    size={20}
                    color={DESIGN_TOKENS.colors.textOnButton}
                    style={{ marginRight: DESIGN_TOKENS.spacing.sm }}
                  />
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.button,
                      color: DESIGN_TOKENS.colors.textOnButton,
                    }}
                  >
                    Ajukan Cuti / Izin
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          {/* Other Features Section (Example) */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: card2Anim }],
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 25}
              tint='systemMaterialDark'
              style={{
                borderRadius: DESIGN_TOKENS.borderRadius.xl,
                overflow: 'hidden',
                backgroundColor: DESIGN_TOKENS.colors.glassCardBg,
                borderWidth: 0.5,
                borderColor: DESIGN_TOKENS.colors.glassBorder,
                shadowColor: 'rgba(0, 0, 0, 0.2)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 5,
                padding: DESIGN_TOKENS.spacing.xl,
              }}
            >
              <Text
                style={{
                  ...DESIGN_TOKENS.typography.h3,
                  color: DESIGN_TOKENS.colors.textPrimary,
                  marginBottom: DESIGN_TOKENS.spacing.md,
                }}
              >
                Lain-lain
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                {/* Example Feature Button */}
                <TouchableOpacity
                  style={{
                    width: '48%',
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.borderRadius.md,
                    backgroundColor: DESIGN_TOKENS.colors.glassInputBg,
                    borderWidth: 0.5,
                    borderColor: DESIGN_TOKENS.colors.glassBorder,
                    padding: DESIGN_TOKENS.spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleOtherFeature('Slip Gaji')}
                >
                  <Feather
                    name='dollar-sign'
                    size={30}
                    color={DESIGN_TOKENS.colors.textPrimary}
                  />
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.caption,
                      color: DESIGN_TOKENS.colors.textSecondary,
                      marginTop: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    Slip Gaji
                  </Text>
                </TouchableOpacity>

                {/* Example Feature Button */}
                <TouchableOpacity
                  style={{
                    width: '48%',
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.borderRadius.md,
                    backgroundColor: DESIGN_TOKENS.colors.glassInputBg,
                    borderWidth: 0.5,
                    borderColor: DESIGN_TOKENS.colors.glassBorder,
                    padding: DESIGN_TOKENS.spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleOtherFeature('Informasi Proyek')}
                >
                  <Feather
                    name='briefcase'
                    size={30}
                    color={DESIGN_TOKENS.colors.textPrimary}
                  />
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.caption,
                      color: DESIGN_TOKENS.colors.textSecondary,
                      marginTop: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    Info Proyek
                  </Text>
                </TouchableOpacity>

                {/* Add more feature buttons as needed */}
                <TouchableOpacity
                  style={{
                    width: '48%',
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.borderRadius.md,
                    backgroundColor: DESIGN_TOKENS.colors.glassInputBg,
                    borderWidth: 0.5,
                    borderColor: DESIGN_TOKENS.colors.glassBorder,
                    padding: DESIGN_TOKENS.spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleOtherFeature('Pengaturan')}
                >
                  <Feather
                    name='settings'
                    size={30}
                    color={DESIGN_TOKENS.colors.textPrimary}
                  />
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.caption,
                      color: DESIGN_TOKENS.colors.textSecondary,
                      marginTop: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    Pengaturan
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    width: '48%',
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.borderRadius.md,
                    backgroundColor: DESIGN_TOKENS.colors.glassInputBg,
                    borderWidth: 0.5,
                    borderColor: DESIGN_TOKENS.colors.glassBorder,
                    padding: DESIGN_TOKENS.spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleOtherFeature('Notifikasi')}
                >
                  <Feather
                    name='bell'
                    size={30}
                    color={DESIGN_TOKENS.colors.textPrimary}
                  />
                  <Text
                    style={{
                      ...DESIGN_TOKENS.typography.caption,
                      color: DESIGN_TOKENS.colors.textSecondary,
                      marginTop: DESIGN_TOKENS.spacing.xs,
                    }}
                  >
                    Notifikasi
                  </Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}
