// app/screens/main/Home.tsx
// Kode yang dikoreksi penuh dengan penambahan timeout untuk debugging state

import { Feather } from '@expo/vector-icons';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ColorValue,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { UserType } from '../../../types';
import {
  getAttendanceStatus,
  saveAttendanceStatus,
} from '../../../utils/attendanceStorage';
import {
  clearCaptureCallback,
  setCaptureCallback,
} from '../../../utils/callbackStore';

const BACKGROUND_IMAGE_URI =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80';

type AttendanceStatus =
  | 'clock_in_pending'
  | 'clock_out_pending'
  | 'completed'
  | null;

type ButtonProps = {
  onPress: () => void;
  text: string;
  icon: keyof typeof Feather.glyphMap | 'loader';
  colors: [ColorValue, ColorValue, ...ColorValue[]];
  disabled: boolean;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>(null);

  const { getItem } = useAsyncStorage('user');

  const headerAnim = useRef(new Animated.Value(-40)).current;
  const card1Anim = useRef(new Animated.Value(80)).current;
  const card2Anim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Tambahkan timeout untuk simulasi loading dan debugging
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const userJson = await getItem();
        if (userJson != null) {
          const userData: UserType = JSON.parse(userJson);
          setUser(userData);
        }

        const record = await getAttendanceStatus();
        if (record) {
          if (
            record.clockInStatus === 'completed' &&
            record.clockOutStatus === 'pending'
          ) {
            setAttendanceStatus('clock_out_pending');
          } else if (
            record.clockInStatus === 'completed' &&
            record.clockOutStatus === 'completed'
          ) {
            setAttendanceStatus('completed');
          } else {
            // Ini untuk kasus record ada tapi belum clock in
            setAttendanceStatus('clock_in_pending');
          }
        } else {
          setAttendanceStatus('clock_in_pending');
        }
      } catch (e) {
        console.error('Failed to load data from storage', e);
        // Fallback untuk memastikan aplikasi tidak stuck di loading
        setAttendanceStatus('clock_in_pending');
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

    loadData();
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
    return () => clearInterval(intervalId);
  }, []);

  const handleClockIn = async () => {
    const onCaptureData = async (
      photoUri: string,
      locationString: string,
      notes: string | null
    ) => {
      console.log('Simulasi clock in berhasil dengan data:');
      console.log('Photo URI:', photoUri);
      console.log('Location:', locationString);
      console.log('Notes:', notes);

      const newRecord = {
        date: new Date().toISOString().slice(0, 10),
        clockInStatus: 'completed' as 'completed',
        clockOutStatus: 'pending' as 'pending',
      };
      await saveAttendanceStatus(newRecord);
      setAttendanceStatus('clock_out_pending');

      Alert.alert('Sukses', 'Absensi masuk Anda telah tercatat.');
      clearCaptureCallback();
    };
    setCaptureCallback(onCaptureData);
    router.push('/attendance/camera');
  };

  const handleClockOut = async () => {
    const onCaptureData = async (
      photoUri: string,
      locationString: string,
      notes: string | null
    ) => {
      console.log('Simulasi clock out berhasil dengan data:');
      console.log('Photo URI:', photoUri);
      console.log('Location:', locationString);
      console.log('Notes:', notes);

      const record = await getAttendanceStatus();
      if (record) {
        const updatedRecord = {
          ...record,
          clockOutStatus: 'completed' as 'completed',
        };
        await saveAttendanceStatus(updatedRecord);
        setAttendanceStatus('completed');
        Alert.alert('Sukses', 'Absensi keluar Anda telah tercatat.');
      }
      clearCaptureCallback();
    };
    setCaptureCallback(onCaptureData);
    router.push('/attendance/camera');
  };

  const handleLeaveRequest = () => {
    Alert.alert(
      'Ajukan Izin Cuti',
      'Fitur pengajuan cuti akan segera tersedia. Anda akan diarahkan ke halaman pengajuan cuti.',
      [
        {
          text: 'OK',
          onPress: () => {
            router.push('/(tabs)/main/Leave');
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
  };

  const getButtonProps = (): ButtonProps => {
    switch (attendanceStatus) {
      case 'clock_in_pending':
        return {
          onPress: handleClockIn,
          text: 'Clock In',
          icon: 'log-in',
          colors: ['#3B82F6', '#0056CC'],
          disabled: false,
        };
      case 'clock_out_pending':
        return {
          onPress: handleClockOut,
          text: 'Clock Out',
          icon: 'log-out',
          colors: ['#EF4444', '#B91C1C'],
          disabled: false,
        };
      case 'completed':
        return {
          onPress: () => {},
          text: 'Sudah Absen Hari Ini',
          icon: 'check',
          colors: ['#10B981', '#059669'],
          disabled: true,
        };
      default:
        return {
          onPress: () => {},
          text: 'Memuat...',
          icon: 'loader',
          colors: ['#6B7280', '#4B5563'],
          disabled: true,
        };
    }
  };

  const buttonProps = getButtonProps();

  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE_URI }}
      style={styles.container}
    >
      <StatusBar barStyle='light-content' translucent />
      <BlurView
        intensity={Platform.OS === 'ios' ? 20 : 15}
        tint='dark'
        style={styles.blurContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          className='mt-5'
        >
          <Animated.View
            style={[
              styles.header,
              { opacity: fadeAnim, transform: [{ translateY: headerAnim }] },
            ]}
          >
            <Text style={styles.greetingText}>
              Halo, {user?.name || 'Pengguna'}!
            </Text>
            <Text style={styles.dateText}>{currentDate}</Text>
            <Text style={styles.timeText}>{currentTime}</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardContainer,
              { opacity: fadeAnim, transform: [{ translateY: card1Anim }] },
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 25}
              tint='systemMaterialDark'
              style={[styles.glassCard, styles.card]}
            >
              <Text style={styles.cardTitle}>Presensi Hari Ini</Text>
              <View style={styles.statusRow}>
                <Feather
                  name={buttonProps.icon}
                  className={`${buttonProps.icon === 'loader' ? 'animate-spin' : ''}`}
                  size={24}
                  color={
                    buttonProps.disabled
                      ? '#A0AEC0'
                      : buttonProps.icon === 'check'
                        ? '#10B981'
                        : '#A0AEC0'
                  }
                  style={styles.statusIcon}
                />
                <Text style={styles.statusText}>
                  Status: {buttonProps.text}
                </Text>
              </View>
              <TouchableOpacity
                onPress={buttonProps.onPress}
                activeOpacity={0.8}
                disabled={buttonProps.disabled}
                style={[
                  styles.button,
                  buttonProps.disabled && styles.buttonDisabled,
                ]}
              >
                <LinearGradient
                  colors={buttonProps.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Feather
                    name={buttonProps.icon}
                    size={20}
                    color='#FFF'
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>{buttonProps.text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          <Animated.View
            style={[
              styles.cardContainer,
              { opacity: fadeAnim, transform: [{ translateY: card2Anim }] },
            ]}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 25}
              tint='systemMaterialDark'
              style={[styles.glassCard, styles.card]}
            >
              <Text style={styles.cardTitle}>Pengajuan Izin / Cuti</Text>
              <Text style={styles.cardBody}>
                Ajukan permohonan izin atau cuti Anda dengan mudah di sini.
              </Text>
              <TouchableOpacity
                onPress={handleLeaveRequest}
                activeOpacity={0.8}
                style={styles.button}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D68200']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Feather
                    name='calendar'
                    size={20}
                    color='#FFF'
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Ajukan Cuti / Izin</Text>
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </Animated.View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: card2Anim }],
            }}
          >
            <BlurView
              intensity={Platform.OS === 'ios' ? 30 : 25}
              tint='systemMaterialDark'
              style={[styles.glassCard, styles.card]}
            >
              <Text style={styles.cardTitle}>Lain-lain</Text>
              <View style={styles.otherFeaturesGrid}>
                <TouchableOpacity
                  style={[styles.featureButton, styles.glassButton]}
                  onPress={() => handleOtherFeature('Slip Gaji')}
                >
                  <Feather name='dollar-sign' size={30} color='#FFF' />
                  <Text style={styles.featureButtonText}>Slip Gaji</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.featureButton, styles.glassButton]}
                  onPress={() => handleOtherFeature('Informasi Proyek')}
                >
                  <Feather name='briefcase' size={30} color='#FFF' />
                  <Text style={styles.featureButtonText}>Info Proyek</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.featureButton, styles.glassButton]}
                  onPress={() => handleOtherFeature('Pengaturan')}
                >
                  <Feather name='settings' size={30} color='#FFF' />
                  <Text style={styles.featureButtonText}>Pengaturan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.featureButton, styles.glassButton]}
                  onPress={() => handleOtherFeature('Notifikasi')}
                >
                  <Feather name='bell' size={30} color='#FFF' />
                  <Text style={styles.featureButtonText}>Notifikasi</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </BlurView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 80,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 32,
    marginTop: 8,
  },
  greetingText: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '300',
  },
  timeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 4,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  glassCard: {
    backgroundColor: 'rgba(50, 50, 50, 0.2)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    color: '#A0AEC0',
    fontSize: 16,
  },
  button: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cardBody: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '300',
    marginBottom: 16,
  },
  otherFeaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureButton: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButton: {
    backgroundColor: 'rgba(50, 50, 50, 0.3)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureButtonText: {
    color: '#A0AEC0',
    fontSize: 12,
    marginTop: 4,
  },
});
