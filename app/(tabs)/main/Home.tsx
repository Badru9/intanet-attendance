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

// Import UserType jika belum
import { UserType } from '../../types/index'; // Pastikan path ini benar
// Import DESIGN_TOKENS yang baru dibuat
import { DESIGN_TOKENS } from '../../constants/designTokens'; // Adjust path as needed

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
  >(null); // To track current state

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
    // Load user data
    const loadUser = async () => {
      try {
        const jsonValue = await getItem();
        if (jsonValue != null) {
          const userData: UserType = JSON.parse(jsonValue);
          setUser(userData);
        }
      } catch (e) {
        console.error('Failed to load user from async storage', e);
      }
    };

    // Update time every second
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

    loadUser();
    updateDateTime(); // Initial call
    const intervalId = setInterval(updateDateTime, 1000); // Update every second

    // Start entrance animations
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
  }, [getItem]);

  // --- Handlers for main features ---

  const handlePresence = async () => {
    Alert.alert(
      'Konfirmasi Presensi',
      `Anda akan melakukan ${attendanceStatus === 'clock_in' ? 'Clock Out' : 'Clock In'} sekarang?`,
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Ya, Lanjutkan',
          onPress: async () => {
            // TODO: Integrate with your backend API for attendance
            // Example: const response = await attendanceApi.record({ type: 'clock_in' });
            // For now, simulate success
            console.log(
              `User ${user?.name} performing ${attendanceStatus === 'clock_in' ? 'Clock Out' : 'Clock In'}`
            );
            setAttendanceStatus((prev) =>
              prev === 'clock_in' ? 'clock_out' : 'clock_in'
            ); // Toggle status
            Alert.alert(
              'Sukses',
              `Presensi ${attendanceStatus === 'clock_in' ? 'Clock Out' : 'Clock In'} berhasil!`
            );
          },
        },
      ]
    );
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
              marginTop: DESIGN_TOKENS.spacing.md, // Adjusted for better visual
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
                    ? 'Sudah Clock In'
                    : 'Belum Clock In'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handlePresence}
                activeOpacity={0.8}
                style={{
                  borderRadius: DESIGN_TOKENS.borderRadius.md,
                  overflow: 'hidden', // Ensures gradient is clipped
                }}
              >
                <LinearGradient
                  colors={
                    attendanceStatus === 'clock_in'
                      ? ['#FF3B30', '#CC2D2D']
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
                  <Feather
                    name={
                      attendanceStatus === 'clock_in' ? 'log-out' : 'log-in'
                    }
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
                    {attendanceStatus === 'clock_in' ? 'Clock Out' : 'Clock In'}
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
              transform: [{ translateY: card2Anim }], // Reuse same animation for now
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
                    width: '48%', // Approx half width with spacing
                    marginBottom: DESIGN_TOKENS.spacing.md,
                    borderRadius: DESIGN_TOKENS.borderRadius.md,
                    backgroundColor: DESIGN_TOKENS.colors.glassInputBg, // Lighter glass background
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
