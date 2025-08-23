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
  const { user } = useAuth(); // Menggunakan user dari AuthContext
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>('loading');
  const [attendanceTimes, setAttendanceTimes] = useState({
    clockIn: '--:--',
    clockOut: '--:--',
  });

  const animatedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          setAttendanceStatus('loading');

          // Pertama, cek status dari backend
          try {
            const backendResponse = await getAttendanceStatusFromBackend();

            console.log('Backend response:', backendResponse);

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
              } else {
                // Hari yang berbeda, reset status
                setAttendanceStatus('clock_in_pending');
                setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
              }
            } else {
              // Tidak ada data dari backend, fallback ke local storage
              throw new Error('No backend data available');
            }
          } catch (backendError) {
            console.log(
              'Backend check failed, falling back to local storage:',
              backendError
            );

            // Fallback ke local storage jika backend gagal
            const record = await getAttendanceStatus(String(user.id));
            if (record) {
              const today = new Date().toISOString().slice(0, 10);
              if (record.date === today) {
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
              } else {
                setAttendanceStatus('clock_in_pending');
                setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
              }
            } else {
              setAttendanceStatus('clock_in_pending');
            }
          }
        } catch (e) {
          console.error('Failed to load attendance data:', e);
          setAttendanceStatus('clock_in_pending'); // Fallback
        }
      } else {
        // Jika tidak ada user, reset ke state awal
        setAttendanceStatus('loading');
        setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
      }
    };

    loadData();

    const updateDateTime = () => {
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
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, [user]); // Re-run effect ketika user berubah

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
    if (isApiLoading) {
      return {
        onPress: () => {},
        text: 'Memproses...',
        colors: ['#6B7280'],
        disabled: true,
      };
    }

    switch (attendanceStatus) {
      case 'clock_in_pending':
        return {
          onPress: handleClockIn,
          text: 'Masuk',
          colors: ['#2563EB'], // Pass as an array
          disabled: false,
        };
      case 'clock_out_pending':
        return {
          onPress: handleClockOut,
          text: 'Pulang',
          colors: ['#EF4444'], // Pass as an array
          disabled: false,
        };
      case 'completed':
        return {
          onPress: () => {},
          text: 'Sudah Absen',
          colors: ['#10B981'], // Pass as an array
          disabled: true,
        };
      case 'loading':
      default:
        return {
          onPress: () => {},
          text: 'Memuat...',
          colors: ['#0F172A'], // Pass as an array
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
        {/* <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=50' }}
          style={styles.profileImage}
        /> */}
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
          <Text style={styles.currentTimeText}>{currentTime}</Text>
          <Text style={styles.currentDateText}>{currentDate}</Text>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
