import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ColorValue,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ATTENDANCE_STATUS } from '../../constants/constants';
import { useAuth } from '../../contexts/authContext';
import {
  attendance,
  checkOut,
  getAttendanceStatusFromBackend,
} from '../../services/attendance';
import {
  getAttendanceStatus,
  saveAttendanceStatus,
} from '../../utils/attendanceStorage';
import {
  clearCaptureCallback,
  setCaptureCallback,
} from '../../utils/callbackStore';

type AttendanceStatus = keyof typeof ATTENDANCE_STATUS;

type ButtonProps = {
  onPress: () => void;
  text: string;
  colors: ColorValue[];
  disabled: boolean;
};

export default function Home() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(); // Tambahkan authLoading
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>('loading');
  const [attendanceTimes, setAttendanceTimes] = useState({
    clockIn: '--:--',
    clockOut: '--:--',
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const animatedScale = useRef(new Animated.Value(1)).current;

  // Untuk refresh data setelah absensi
  const loadDataRef = useRef<() => Promise<void> | null>(null);

  useEffect(() => {
    console.log('=== USE EFFECT TRIGGERED ===');
    console.log('Auth loading:', authLoading);
    console.log('User exists:', !!user);
    console.log('User details:', user);
    console.log('User ID:', user?.id);
    console.log('User name:', user?.name);
    console.log('User email:', user?.email);

    // Jangan lakukan apapun jika auth masih loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }

    let isMounted = true; // Flag untuk mencegah state update setelah unmount

    const loadData = async (isManualRefresh = false) => {
      console.log('=== LOAD DATA START ===');
      console.log('User status:', !!user);
      console.log('User data:', user);
      console.log('Is manual refresh:', isManualRefresh);
      console.log('Is mounted:', isMounted);

      if (!user) {
        console.log('No user found, setting to loading state');
        // Jika tidak ada user, set ke loading state
        if (isMounted) {
          setAttendanceStatus('loading');
          setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
          setIsInitialLoading(false);
        }
        return;
      }

      try {
        console.log(
          'Starting to load attendance data for user:',
          user.id,
          isManualRefresh ? '(Manual Refresh)' : '(Auto Load)'
        );

        // Set loading hanya jika ini adalah initial load
        if (!isManualRefresh && isMounted) {
          setAttendanceStatus('loading');
        }

        // Pertama, coba ambil data dari backend
        let backendSuccess = false;
        try {
          console.log('Attempting to fetch from backend...');
          const backendResponse = await getAttendanceStatusFromBackend();
          console.log('Backend response received:', backendResponse);

          if (backendResponse.success && backendResponse.data) {
            const backendData = backendResponse.data;
            const today = new Date().toISOString().slice(0, 10);

            if (backendData.today_date === today) {
              let clockInTime = '--:--';
              let clockOutTime = '--:--';

              // Ambil data dari today_attendance jika ada
              if (backendData.today_attendance) {
                if (backendData.today_attendance.check_in_time) {
                  clockInTime = new Date(
                    backendData.today_attendance.check_in_time
                  ).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }

                if (backendData.today_attendance.check_out_time) {
                  clockOutTime = new Date(
                    backendData.today_attendance.check_out_time
                  ).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                }
              }

              // Update local storage dengan data terbaru dari backend
              const localRecord = {
                date: backendData.today_date,
                clockInStatus: backendData.has_checked_in_today
                  ? ('completed' as const)
                  : ('pending' as const),
                clockInTime: clockInTime,
                clockOutStatus: backendData.has_checked_out_today
                  ? ('completed' as const)
                  : ('pending' as const),
                clockOutTime: clockOutTime,
              };

              await saveAttendanceStatus(String(user.id), localRecord);

              // Update state dengan data dari backend hanya jika component masih mounted
              if (isMounted) {
                setAttendanceTimes({
                  clockIn: clockInTime,
                  clockOut: clockOutTime,
                });

                // Tentukan status berdasarkan data dari backend
                if (backendData.has_checked_out_today) {
                  setAttendanceStatus('completed');
                } else if (backendData.has_checked_in_today) {
                  setAttendanceStatus('clock_out_pending');
                } else {
                  setAttendanceStatus('clock_in_pending');
                }
              }

              backendSuccess = true;
              console.log('Successfully loaded data from backend');
            } else {
              // Hari yang berbeda, reset status
              console.log('Different date detected, resetting status');
              if (isMounted) {
                setAttendanceStatus('clock_in_pending');
                setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
              }
              backendSuccess = true;
            }
          }
        } catch (backendError) {
          console.log(
            'Backend check failed, will fallback to local storage. Error:',
            backendError
          );

          // Jika error adalah network error, beri informasi pada user
          if (
            backendError instanceof Error &&
            (backendError.message.includes('Network') ||
              backendError.message.includes('timeout') ||
              backendError.message.includes('fetch'))
          ) {
            console.log('Network error detected, using offline mode');
            // Optional: show toast or alert about offline mode
          }
        }

        // Jika backend gagal, fallback ke local storage
        if (!backendSuccess) {
          console.log('Falling back to local storage');
          try {
            const record = await getAttendanceStatus(String(user.id));
            const today = new Date().toISOString().slice(0, 10);

            if (record.date === today) {
              if (isMounted) {
                setAttendanceTimes({
                  clockIn: record.clockInTime || '--:--',
                  clockOut: record.clockOutTime || '--:--',
                });

                if (record.clockOutStatus === 'completed') {
                  setAttendanceStatus('completed');
                } else if (record.clockInStatus === 'completed') {
                  setAttendanceStatus('clock_out_pending');
                } else {
                  setAttendanceStatus('clock_in_pending');
                }
              }
            } else {
              // Reset untuk hari baru
              if (isMounted) {
                setAttendanceStatus('clock_in_pending');
                setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
              }
            }
            console.log('Successfully loaded data from local storage');
          } catch (localError) {
            console.error('Failed to load from local storage:', localError);
            // Fallback terakhir - set ke pending state
            if (isMounted) {
              setAttendanceStatus('clock_in_pending');
              setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load attendance data:', error);
        // Ensure status is not stuck in loading
        if (isMounted) {
          setAttendanceStatus('clock_in_pending');
          setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    };

    // Simpan reference untuk manual refresh
    loadDataRef.current = () => loadData(true);

    // Load data pertama kali
    loadData(false);

    // Setup time updates
    const updateDateTime = () => {
      if (isMounted) {
        const now = new Date();
        setCurrentDate(
          now.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        );
        setCurrentTime(
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
        );
      }
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => {
      isMounted = false; // Set flag ketika component akan unmount
      clearInterval(intervalId);
    };
  }, [user, authLoading]); // Only depend on user and authLoading, NOT isInitialLoading to avoid loops

  // Fungsi untuk manual refresh data
  const refreshAttendanceData = async () => {
    console.log('=== MANUAL REFRESH TRIGGERED ===');
    console.log('User:', !!user);
    console.log('Auth loading:', authLoading);
    console.log('API loading:', isApiLoading);
    console.log('Initial loading:', isInitialLoading);

    if (!user) {
      console.log('No user, showing alert');
      Alert.alert('Error', 'User tidak ditemukan');
      return;
    }

    if (authLoading) {
      console.log('Auth still loading, cannot refresh');
      Alert.alert('Info', 'Tunggu proses login selesai');
      return;
    }

    if (isApiLoading) {
      console.log('API call in progress, cannot refresh');
      Alert.alert('Info', 'Sedang memproses permintaan lain');
      return;
    }

    if (loadDataRef.current) {
      console.log('Calling loadDataRef.current()');
      setIsInitialLoading(true);
      try {
        await loadDataRef.current();
        console.log('Manual refresh completed successfully');
      } catch (error) {
        console.error('Manual refresh failed:', error);
        Alert.alert('Error', 'Gagal memuat ulang data kehadiran');
      }
    } else {
      console.log('loadDataRef.current is null');
      Alert.alert('Error', 'Fungsi refresh tidak tersedia');
    }
  };

  const handleClockIn = async () => {
    if (isApiLoading || !user) return;
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const onCaptureData = async (
        photoUri: string,
        locationString: string,
        notes: string | null
      ) => {
        if (!user) return;
        setIsApiLoading(true);
        try {
          const response = await attendance({
            photo_check_in: photoUri,
            location_check_in: locationString,
            notes,
          });

          if (response.success) {
            const newRecord = {
              date: new Date().toISOString().slice(0, 10),
              clockInStatus: 'completed' as const,
              clockInTime: new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              clockOutStatus: 'pending' as const,
              clockOutTime: '--:--',
            };
            await saveAttendanceStatus(String(user.id), newRecord);
            setAttendanceStatus('clock_out_pending');
            setAttendanceTimes({
              ...attendanceTimes,
              clockIn: newRecord.clockInTime,
            });
            Alert.alert('Sukses', response.message);
            // Refresh data dari backend agar UI update
            if (loadDataRef.current) await loadDataRef.current();
          } else {
            Alert.alert('Gagal', response.message);
          }
        } catch (error: any) {
          Alert.alert('Error', error.message);
        } finally {
          setIsApiLoading(false);
          clearCaptureCallback();
        }
      };
      setCaptureCallback(onCaptureData);
      router.push('/attendance/camera');
    });
  };

  const handleClockOut = async () => {
    if (isApiLoading || !user) return;
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const onCaptureData = async (
        photoUri: string,
        locationString: string,
        notes: string | null
      ) => {
        if (!user) return;
        setIsApiLoading(true);
        try {
          const response = await checkOut({
            photo_check_out: photoUri,
            location_check_out: locationString,
            notes,
          });

          if (response.success) {
            const record = await getAttendanceStatus(String(user.id));
            if (record) {
              const updatedRecord = {
                ...record,
                clockOutStatus: 'completed' as const,
                clockOutTime: new Date().toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              };
              await saveAttendanceStatus(String(user.id), updatedRecord);
              setAttendanceStatus('completed');
              setAttendanceTimes({
                ...attendanceTimes,
                clockOut: updatedRecord.clockOutTime,
              });
              Alert.alert('Sukses', response.message);
              // Refresh data dari backend agar UI update
              if (loadDataRef.current) await loadDataRef.current();
            }
          } else {
            Alert.alert('Gagal', response.message);
          }
        } catch (error: any) {
          Alert.alert('Error', error.message);
        } finally {
          setIsApiLoading(false);
          clearCaptureCallback();
        }
      };
      setCaptureCallback(onCaptureData);
      router.push('/attendance/camera');
    });
  };

  const getButtonProps = (): ButtonProps => {
    // Log setiap kali buttonProps di-render
    console.log('RENDER BUTTON:', {
      attendanceStatus,
      isApiLoading,
      isInitialLoading,
    });

    if (isApiLoading) {
      return {
        onPress: () => {},
        text: 'Memproses...',
        colors: ['#6B7280'],
        disabled: true,
      };
    }

    // Show loading if still initial loading or if status is loading
    if (isInitialLoading || attendanceStatus === 'loading') {
      return {
        onPress: () => {},
        text: 'Memuat...',
        colors: ['#0F172A'],
        disabled: true,
      };
    }

    switch (attendanceStatus) {
      case 'clock_in_pending':
        return {
          onPress: handleClockIn,
          text: 'Masuk',
          colors: ['#2563EB'],
          disabled: false,
        };
      case 'clock_out_pending':
        return {
          onPress: handleClockOut,
          text: 'Pulang',
          colors: ['#EF4444'],
          disabled: false,
        };
      case 'completed':
        return {
          onPress: () => {},
          text: 'Sudah Absen',
          colors: ['#10B981'],
          disabled: true,
        };
      default:
        return {
          onPress: () => {},
          text: 'Memuat...',
          colors: ['#0F172A'],
          disabled: true,
        };
    }
  };

  const buttonProps = getButtonProps();

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' translucent />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshAttendanceData}
          disabled={isApiLoading || isInitialLoading}
        >
          <Feather
            name='refresh-cw'
            size={20}
            color={isApiLoading || isInitialLoading ? '#9CA3AF' : '#000'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => router.push('/attendance/detail')}
        >
          <Feather name='calendar' size={24} color='#000' />
        </TouchableOpacity>
      </View>
      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Time and Date Section */}
        <View style={styles.timeSection}>
          {/* {user && <Text style={styles.greetingText}>Halo, {user.name}!</Text>} */}
          <Text style={styles.currentTimeText}>{currentTime}</Text>
          <Text style={styles.currentDateText}>{currentDate}</Text>
          {isInitialLoading && (
            <Text style={styles.loadingText}>Memuat data kehadiran...</Text>
          )}
        </View>
        {/* Attendance Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            onPress={buttonProps.onPress}
            disabled={buttonProps.disabled}
            style={styles.mainButtonContainer}
          >
            <Animated.View
              style={[
                styles.mainButtonBackground,
                {
                  backgroundColor: buttonProps.colors[0],
                  transform: [{ scale: animatedScale }],
                },
              ]}
            >
              <View
                style={[
                  styles.mainButtonWrapper,
                  { borderColor: buttonProps.colors[0] },
                ]}
              >
                <View style={styles.mainButtonInner}>
                  <Text style={styles.mainButtonText}>{buttonProps.text}</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>
        {/* Attendance Summary */}
        <View style={styles.summarySection}>
          <View style={styles.attendanceSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Masuk</Text>
              <Text style={styles.summaryTime}>{attendanceTimes.clockIn}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryTitle}>Pulang</Text>
              <Text style={styles.summaryTime}>{attendanceTimes.clockOut}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  refreshButton: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    padding: 12,
    borderRadius: 50,
    marginRight: 10,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  calendarButton: {
    borderColor: '#E5E7EB',
    borderWidth: 1,
    padding: 15,
    borderRadius: 50,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timeSection: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 80,
  },
  greetingText: {
    fontSize: 18,
    color: '#4B5563',
    marginBottom: 20,
    fontWeight: '500',
  },
  currentTimeText: {
    fontSize: 56,
    fontWeight: '300',
    color: '#000',
    letterSpacing: -2,
  },
  currentDateText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonSection: {
    alignItems: 'center',
    marginBottom: 80,
  },
  mainButtonContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  mainButtonBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  mainButtonWrapper: {
    width: '110%',
    height: '110%',
    borderWidth: 2,
    borderRadius: 1000,
    position: 'fixed',
    top: -10,
    left: -10,
  },
  mainButtonInner: {
    borderRadius: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  summarySection: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  attendanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: 40,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 18,
    color: '#718096',
  },
  summaryTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
  },
});
