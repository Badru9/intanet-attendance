import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../contexts/authContext';
import { getAttendanceHistory } from '../../services/attendance';

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'sick';

type AttendanceData = {
  date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
};

type CalendarDay = {
  date: number;
  fullDate: string;
  status?: AttendanceStatus;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export default function AttendanceDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(false);

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Generate calendar days using useMemo - akan re-compute ketika currentDate berubah
  const baseCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();

      days.push({
        date: date.getDate(),
        fullDate: date.toISOString().slice(0, 10),
        isCurrentMonth,
        isToday,
      });
    }

    return days;
  }, [currentDate]);

  // Merge calendar days dengan attendance data menggunakan useMemo
  const calendarDays = useMemo(() => {
    console.log('Merging calendar with attendance data...');
    console.log('Attendance data length:', attendanceData.length);
    console.log(
      'Sample attendance data:',
      JSON.stringify(attendanceData.slice(0, 2), null, 2)
    );
    console.log(
      'Sample calendar days:',
      JSON.stringify(baseCalendarDays.slice(0, 5), null, 2)
    );

    const mergedDays = baseCalendarDays.map((day) => {
      const attendance = attendanceData.find(
        (data) => data.date === day.fullDate
      );

      if (attendance) {
        console.log(
          `✓ Found attendance for ${day.fullDate}: ${attendance.status}`
        );
      }

      return {
        ...day,
        status: attendance?.status,
      };
    });

    const daysWithStatus = mergedDays.filter((d) => d.status);
    console.log('Days with status:', daysWithStatus.length);
    console.log(
      'Days with status details:',
      JSON.stringify(daysWithStatus, null, 2)
    );

    return mergedDays;
  }, [baseCalendarDays, attendanceData]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user) {
        console.log('No user found');
        setAttendanceData([]);
        return;
      }

      setLoading(true);
      try {
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const year = currentDate.getFullYear().toString();

        console.log(`Fetching attendance for month: ${month}, year: ${year}`);

        try {
          const response = await getAttendanceHistory(month, year);
          console.log(
            'Full backend response:',
            JSON.stringify(response, null, 2)
          );

          if (response.success && response.data) {
            const attendancesData =
              response.data.attendances?.data ||
              response.data.attendances ||
              [];

            console.log(
              'Raw attendances data:',
              JSON.stringify(attendancesData, null, 2)
            );
            console.log('Attendances data length:', attendancesData.length);

            const transformedData: AttendanceData[] = attendancesData.map(
              (item: any, index: number) => {
                console.log(
                  `Processing item ${index}:`,
                  JSON.stringify(item, null, 2)
                );

                let status: AttendanceStatus = 'absent';
                if (item.status === 'PRESENT' || item.status === 'LATE') {
                  status = 'present';
                } else if (item.status === 'ABSENT') {
                  status = 'absent';
                } else if (item.status === 'LEAVE') {
                  status = 'leave';
                } else if (item.status === 'SICK') {
                  status = 'sick';
                }

                const transformedItem = {
                  date: item.date,
                  status: status,
                  check_in_time: item.check_in_time
                    ? new Date(item.check_in_time).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : undefined,
                  check_out_time: item.check_out_time
                    ? new Date(item.check_out_time).toLocaleTimeString(
                        'id-ID',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )
                    : undefined,
                  notes: item.notes,
                };

                console.log(
                  `Transformed item ${index}:`,
                  JSON.stringify(transformedItem, null, 2)
                );
                return transformedItem;
              }
            );

            console.log(
              'Setting transformed API data:',
              transformedData.length,
              'records'
            );
            console.log(
              'Final transformed data:',
              JSON.stringify(transformedData, null, 2)
            );
            setAttendanceData(transformedData);
          } else {
            throw new Error('No attendance data available');
          }
        } catch (apiError) {
          console.log('API failed:', apiError);
          setAttendanceData([]);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [currentDate, user]);

  const getStatusColor = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return '#10B981'; // Green
      case 'leave':
        return '#F59E0B'; // Yellow
      case 'sick':
        return '#F97316'; // Orange
      case 'absent':
        return '#EF4444'; // Red
      default:
        return 'transparent';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getAttendanceDetail = (date: string) => {
    return attendanceData.find((data) => data.date === date);
  };

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const backgroundColor = getStatusColor(day.status);
    const isWeekend = index % 7 === 0 || index % 7 === 6;

    return (
      <TouchableOpacity
        key={day.fullDate}
        style={[
          styles.calendarDay,
          {
            backgroundColor,
            opacity: day.isCurrentMonth ? 1 : 0.3,
          },
          day.isToday && styles.todayDay,
        ]}
        onPress={() => {
          if (day.status) {
            const detail = getAttendanceDetail(day.fullDate);
            console.log('Attendance detail:', detail);
          }
        }}
      >
        <Text
          style={[
            styles.calendarDayText,
            {
              color: day.status ? '#FFFFFF' : isWeekend ? '#EF4444' : '#374151',
              fontWeight: day.isToday ? 'bold' : 'normal',
            },
          ]}
        >
          {day.date}
        </Text>
      </TouchableOpacity>
    );
  };

  const calculateStats = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyData = attendanceData.filter((data) => {
      const date = new Date(data.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    const present = monthlyData.filter(
      (data) => data.status === 'present'
    ).length;
    const leave = monthlyData.filter((data) => data.status === 'leave').length;
    const sick = monthlyData.filter((data) => data.status === 'sick').length;
    const absent = monthlyData.filter(
      (data) => data.status === 'absent'
    ).length;
    const total = monthlyData.length;

    return { present, leave, sick, absent, total };
  };

  const stats = calculateStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor='#FFFFFF' />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name='chevron-left' size={24} color='#374151' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Kehadiran</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Header */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateMonth('prev')}>
            <Feather name='chevron-left' size={24} color='#374151' />
          </TouchableOpacity>
          <Text style={styles.monthYear}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => navigateMonth('next')}>
            <Feather name='chevron-right' size={24} color='#374151' />
          </TouchableOpacity>
        </View>

        {/* Day Names */}
        <View style={styles.dayNamesContainer}>
          {dayNames.map((dayName) => (
            <View key={dayName} style={styles.dayNameItem}>
              <Text style={styles.dayNameText}>{dayName}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color='#2563EB' />
            </View>
          ) : (
            calendarDays.map((day, index) => renderCalendarDay(day, index))
          )}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Keterangan:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: '#10B981' }]}
              />
              <Text style={styles.legendText}>Hadir</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: '#F59E0B' }]}
              />
              <Text style={styles.legendText}>Cuti</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: '#F97316' }]}
              />
              <Text style={styles.legendText}>Sakit</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: '#EF4444' }]}
              />
              <Text style={styles.legendText}>Tidak Hadir</Text>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistik Bulan Ini</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.present}</Text>
              <Text style={styles.statLabel}>Hadir</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.leave}</Text>
              <Text style={styles.statLabel}>Cuti</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.sick}</Text>
              <Text style={styles.statLabel}>Sakit</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Tidak Hadir</Text>
            </View>
          </View>
          {stats.total > 0 && (
            <View style={styles.attendanceRate}>
              <Text style={styles.attendanceRateText}>
                Tingkat Kehadiran:{' '}
                {((stats.present / stats.total) * 100).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        {/* Debug Info - Remove this in production */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>
            Attendance Data: {attendanceData.length} records
          </Text>
          <Text style={styles.debugText}>
            Calendar Days with Status:{' '}
            {calendarDays.filter((d) => d.status).length}
          </Text>
          <Text style={styles.debugText}>
            Loading: {loading ? 'Yes' : 'No'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dayNameItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    borderRadius: 8,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
  },
  statsContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  attendanceRate: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  attendanceRateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  debugContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 4,
  },
});
