import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tipe data untuk navigasi
// type RootStackParamList = {
//   LeaveList: undefined;
//   CreateLeave: undefined;
//   LeaveDetail: { leaveId: string };
// };

type LeaveType = 'All' | 'Liburan' | 'Cuti' | 'Sakit';

type LeaveStatus = 'Sedang Diproses' | 'Disetujui' | 'Ditolak';

interface LeaveItem {
  id: string;
  type: Exclude<LeaveType, 'All'>; // Remove 'All' from individual items
  title: string;
  dateRange: string;
  status: LeaveStatus;
  month: string;
  year: string;
  reason?: string;
  submittedDate?: string;
}

const leaveData: LeaveItem[] = [
  {
    id: '1',
    type: 'Liburan',
    title: 'Liburan Keluarga',
    dateRange: 'Kamis 7 Agustus - Minggu 10 Agustus',
    status: 'Sedang Diproses',
    month: 'Agustus',
    year: '2025',
    reason: 'Berlibur bersama keluarga ke Bali',
    submittedDate: '2025-08-01',
  },
  {
    id: '2',
    type: 'Sakit',
    title: 'Sakit',
    dateRange: 'Senin 7 Juli - Kamis 10 Juli',
    status: 'Disetujui',
    month: 'Juli',
    year: '2025',
    reason: 'Demam tinggi dan perlu istirahat',
    submittedDate: '2025-07-06',
  },
  {
    id: '3',
    type: 'Liburan',
    title: 'Liburan Keluarga',
    dateRange: 'Kamis 7 Juni - Minggu 10 Juni',
    status: 'Ditolak',
    month: 'Juni',
    year: '2025',
    reason: 'Liburan akhir tahun',
    submittedDate: '2025-06-01',
  },
  {
    id: '4',
    type: 'Cuti',
    title: 'Cuti Tahunan',
    dateRange: 'Senin 5 Mei - Jumat 9 Mei',
    status: 'Disetujui',
    month: 'Mei',
    year: '2025',
    reason: 'Menggunakan cuti tahunan',
    submittedDate: '2025-04-25',
  },
  {
    id: '5',
    type: 'Liburan',
    title: 'Liburan Lebaran',
    dateRange: 'Selasa 1 April - Kamis 3 April',
    status: 'Disetujui',
    month: 'April',
    year: '2025',
    reason: 'Mudik lebaran ke kampung halaman',
    submittedDate: '2025-03-20',
  },
];

export default function LeaveListScreen() {
  const [selectedFilter, setSelectedFilter] = useState<LeaveType>('All');

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const router = useRouter();

  const filterButtons: LeaveType[] = ['All', 'Liburan', 'Cuti', 'Sakit'];

  const getStatusColor = (status: LeaveStatus): string => {
    switch (status) {
      case 'Sedang Diproses':
        return '#FF9500';
      case 'Disetujui':
        return '#34C759';
      case 'Ditolak':
        return '#FF3B30';
      default:
        return '#666666';
    }
  };

  const getStatusTextColor = (status: LeaveStatus): string => {
    return '#FFFFFF';
  };

  const getTypeColor = (type: Exclude<LeaveType, 'All'>): string => {
    switch (type) {
      case 'Liburan':
        return '#007AFF';
      case 'Cuti':
        return '#32D74B';
      case 'Sakit':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  const filteredData =
    selectedFilter === 'All'
      ? leaveData
      : leaveData.filter((item) => item.type === selectedFilter);

  const groupedData = filteredData.reduce(
    (acc, item) => {
      const key = `${item.month} ${item.year}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<string, LeaveItem[]>
  );

  const handleAddLeave = () => {
    try {
      // navigation.navigate('CreateLeave');
      router.push('/leave/create-leave');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Tidak dapat membuka halaman tambah cuti');
    }
  };

  const handleLeaveItemPress = (item: LeaveItem) => {
    try {
      // Navigate to detail screen or show more info
      // navigation.navigate('LeaveDetail', { leaveId: item.id });
      router.push(`/leave/${item.id}`);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback: show alert with details
      Alert.alert(
        item.title,
        `${item.dateRange}\nStatus: ${item.status}\nAlasan: ${item.reason || 'Tidak ada keterangan'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const getLeaveCount = (type: LeaveType): number => {
    if (type === 'All') return leaveData.length;
    return leaveData.filter((item) => item.type === type).length;
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior='automatic'
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pengajuan Cuti</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddLeave}
            activeOpacity={0.7}
          >
            <Feather name='plus' size={24} color='#FFFFFF' />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filterButtons.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive,
                  ]}
                >
                  {filter} ({getLeaveCount(filter)})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Leave Items */}
        <View style={styles.content}>
          {Object.keys(groupedData).length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name='calendar' size={48} color='#CCCCCC' />
              <Text style={styles.emptyStateTitle}>Tidak Ada Data Cuti</Text>
              <Text style={styles.emptyStateSubtitle}>
                {selectedFilter === 'All'
                  ? 'Belum ada pengajuan cuti yang dibuat'
                  : `Tidak ada cuti dengan tipe "${selectedFilter}"`}
              </Text>
            </View>
          ) : (
            Object.entries(groupedData)
              .sort(([a], [b]) => {
                // Sort by year and month (newest first)
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
                // Simple month comparison - could be improved with proper date parsing
                return monthB.localeCompare(monthA);
              })
              .map(([monthYear, items]) => (
                <View key={monthYear} style={styles.monthSection}>
                  <Text style={styles.monthTitle}>{monthYear}</Text>

                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.leaveCard}
                      onPress={() => handleLeaveItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardTitleContainer}>
                          <Text style={styles.cardTitle}>{item.title}</Text>
                          <Text style={styles.cardDate}>{item.dateRange}</Text>
                          {item.reason && (
                            <Text style={styles.cardReason} numberOfLines={2}>
                              {item.reason}
                            </Text>
                          )}
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusTextColor(item.status) },
                            ]}
                          >
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardFooter}>
                        <View
                          style={[
                            styles.typeButton,
                            { backgroundColor: getTypeColor(item.type) + '15' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeButtonText,
                              { color: getTypeColor(item.type) },
                            ]}
                          >
                            {item.type}
                          </Text>
                        </View>

                        {item.submittedDate && (
                          <Text style={styles.submittedDate}>
                            Diajukan:{' '}
                            {new Date(item.submittedDate).toLocaleDateString(
                              'id-ID'
                            )}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100, // Space for bottom tab bar
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 20,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  leaveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderColor: '#E5E5E5',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  cardReason: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 18,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  submittedDate: {
    fontSize: 12,
    color: '#999999',
  },
});
