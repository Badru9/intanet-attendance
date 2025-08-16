import { Feather } from '@expo/vector-icons';
import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ColorValue,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ATTENDANCE_STATUS } from '../../constants/constants';
import { UserType } from '../../types';
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
  const [user, setUser] = useState<UserType | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>('loading');
  const [attendanceTimes, setAttendanceTimes] = useState({
    clockIn: '--:--',
    clockOut: '--:--',
  });
  const { getItem } = useAsyncStorage('user');

  const animatedScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate loading
        const userJson = await getItem();
        if (userJson) {
          const userData: UserType = JSON.parse(userJson);
          setUser(userData);
        }

        const record = await getAttendanceStatus();
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
            // New day, reset status
            setAttendanceStatus('clock_in_pending');
            setAttendanceTimes({ clockIn: '--:--', clockOut: '--:--' });
          }
        } else {
          setAttendanceStatus('clock_in_pending');
        }
      } catch (e) {
        console.error('Failed to load data from storage', e);
        setAttendanceStatus('clock_in_pending');
      }
    };

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

    loadData();
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleClockIn = async () => {
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
        console.log('Clock-in successful with data:', {
          photoUri,
          locationString,
          notes,
        });

        const newRecord = {
          date: new Date().toISOString().slice(0, 10),
          clockInStatus: 'completed' as 'completed',
          clockInTime: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          clockOutStatus: 'pending' as 'pending',
          clockOutTime: '--:--',
        };
        await saveAttendanceStatus(newRecord);
        setAttendanceStatus('clock_out_pending');
        setAttendanceTimes({
          ...attendanceTimes,
          clockIn: newRecord.clockInTime,
        });
        Alert.alert('Sukses', 'Absensi masuk Anda telah tercatat.');
        clearCaptureCallback();
      };
      setCaptureCallback(onCaptureData);
      router.push('/attendance/camera');
    });
  };

  const handleClockOut = async () => {
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
        console.log('Clock-out successful with data:', {
          photoUri,
          locationString,
          notes,
        });

        const record = await getAttendanceStatus();
        if (record) {
          const updatedRecord = {
            ...record,
            clockOutStatus: 'completed' as 'completed',
            clockOutTime: new Date().toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          await saveAttendanceStatus(updatedRecord);
          setAttendanceStatus('completed');
          setAttendanceTimes({
            ...attendanceTimes,
            clockOut: updatedRecord.clockOutTime,
          });
          Alert.alert('Sukses', 'Absensi keluar Anda telah tercatat.');
        }
        clearCaptureCallback();
      };
      setCaptureCallback(onCaptureData);
      router.push('/attendance/camera');
    });
  };

  const getButtonProps = (): ButtonProps => {
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
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=50' }}
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.calendarButton}>
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
              <View style={styles.mainButtonInner}>
                <Text style={styles.mainButtonText}>{buttonProps.text}</Text>
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
  mainButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
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
