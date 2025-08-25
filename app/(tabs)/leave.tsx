import {
  formatDateRange,
  getLeaveRequests,
  LeaveRequestData,
  LeaveStatus,
  LeaveType,
  mapLeaveStatusToDisplay,
  mapLeaveTypeToDisplay,
} from '@/services/leave';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tipe data untuk filter, termasuk 'All'
type LeaveFilterType = 'All' | LeaveType;

export default function LeaveListScreen() {
  const [selectedFilter, setSelectedFilter] = useState<LeaveFilterType>('All');
  const [leaveData, setLeaveData] = useState<LeaveRequestData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filterButtons: { label: string; value: LeaveFilterType }[] = [
    { label: 'Semua', value: 'All' },
    { label: 'Cuti Tahunan', value: 'annual' },
    { label: 'Sakit', value: 'sick' },
    { label: 'Cuti Melahirkan', value: 'maternity' },
    { label: 'Cuti Ayah', value: 'paternity' },
    { label: 'Cuti Darurat', value: 'emergency' },
    { label: 'Cuti Tanpa Gaji', value: 'unpaid' },
  ];

  const fetchLeaveData = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('Starting to fetch leave data...');

      const response = await getLeaveRequests(1, 50); // Get more items for filtering

      if (response.success && response.data) {
        console.log(
          'Leave data fetched successfully:',
          response.data.data.length,
          'items'
        );
        setLeaveData(response.data.data);
      } else {
        console.warn('Invalid response format:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to fetch leave data:', error);

      // More specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Network')) {
          Alert.alert(
            'Kesalahan Jaringan',
            'Periksa koneksi internet Anda dan coba lagi.'
          );
        } else if (error.message.includes('timeout')) {
          Alert.alert(
            'Koneksi Lambat',
            'Permintaan memakan waktu terlalu lama. Silakan coba lagi.'
          );
        } else if (error.message.includes('authentication')) {
          Alert.alert('Sesi Berakhir', 'Silakan login ulang.');
        } else {
          Alert.alert('Error', `Gagal memuat data cuti: ${error.message}`);
        }
      } else {
        Alert.alert('Error', 'Gagal memuat data cuti. Silakan coba lagi.');
      }
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Gunakan useFocusEffect untuk memuat data setiap kali halaman fokus
  useFocusEffect(
    useCallback(() => {
      fetchLeaveData();
    }, [fetchLeaveData])
  );

  const getStatusColor = (status: LeaveStatus): string => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#666666';
    }
  };

  const getTypeColor = (type: LeaveType): string => {
    switch (type) {
      case 'annual':
        return '#2196F3';
      case 'sick':
        return '#9C27B0';
      case 'maternity':
        return '#E91E63';
      case 'paternity':
        return '#3F51B5';
      case 'emergency':
        return '#FF5722';
      case 'unpaid':
        return '#795548';
      default:
        return '#607D8B';
    }
  };

  const getLeaveCount = (type: LeaveFilterType): number => {
    if (type === 'All') return leaveData.length;
    return leaveData.filter((item) => item.leave_type === type).length;
  };

  const filteredData =
    selectedFilter === 'All'
      ? leaveData
      : leaveData.filter((item) => item.leave_type === selectedFilter);

  const handleAddLeave = () => {
    router.push('/leave/create-leave');
  };

  const handleLeaveItemPress = (item: LeaveRequestData) => {
    router.push({
      pathname: '/leave/[id]',
      params: { id: item.id.toString() },
    });
  };

  const renderLeaveItem = ({ item }: { item: LeaveRequestData }) => (
    <TouchableOpacity
      style={styles.leaveCard}
      onPress={() => handleLeaveItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>
            {mapLeaveTypeToDisplay(item.leave_type)}
          </Text>
          <Text style={styles.cardDate}>
            {formatDateRange(item.start_date, item.end_date)}
          </Text>
          <Text style={styles.cardDays}>{item.total_days} hari kerja</Text>
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
          <Text style={[styles.statusText, { color: '#FFFFFF' }]}>
            {mapLeaveStatusToDisplay(item.status)}
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View
          style={[
            styles.typeButton,
            { backgroundColor: getTypeColor(item.leave_type) + '15' },
          ]}
        >
          <Text
            style={[
              styles.typeButtonText,
              { color: getTypeColor(item.leave_type) },
            ]}
          >
            {mapLeaveTypeToDisplay(item.leave_type)}
          </Text>
        </View>
        <Text style={styles.submittedDate}>
          Diajukan: {new Date(item.created_at).toLocaleDateString('id-ID')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
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
        <View style={styles.centeredContainer}>
          <ActivityIndicator size='large' color='#007AFF' />
          <Text style={styles.loadingText}>Memuat data cuti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
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
              key={filter.value}
              style={[
                styles.filterButton,
                selectedFilter === filter.value && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.value &&
                    styles.filterButtonTextActive,
                ]}
              >
                {filter.label} ({getLeaveCount(filter.value)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Leave Items */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderLeaveItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchLeaveData} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name='calendar' size={48} color='#CCCCCC' />
            <Text style={styles.emptyStateTitle}>Tidak Ada Data Cuti</Text>
            <Text style={styles.emptyStateSubtitle}>
              {selectedFilter === 'All'
                ? 'Belum ada pengajuan cuti yang dibuat'
                : `Tidak ada cuti dengan tipe "${filterButtons.find((f) => f.value === selectedFilter)?.label}"`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
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
  listContent: {
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
    marginBottom: 2,
  },
  cardDays: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
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
