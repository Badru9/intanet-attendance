import {
  getLeaveData,
  LeaveItem,
  LeaveStatus,
  LeaveType,
} from '@/utils/leaveStorage';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
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
  const [leaveData, setLeaveData] = useState<LeaveItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filterButtons: LeaveFilterType[] = ['All', 'Liburan', 'Cuti', 'Sakit'];

  const fetchLeaveData = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getLeaveData();
      setLeaveData(data);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
      Alert.alert('Error', 'Gagal memuat data cuti.');
    } finally {
      setRefreshing(false);
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

  const getTypeColor = (type: LeaveType): string => {
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

  const getLeaveCount = (type: LeaveFilterType): number => {
    if (type === 'All') return leaveData.length;
    return leaveData.filter((item) => item.type === type).length;
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
    router.push('/leave/create-leave');
  };

  const handleLeaveItemPress = (item: LeaveItem) => {
    router.push({
      pathname: '/leave/[id]',
      params: { id: item.id },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior='automatic'
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchLeaveData} />
        }
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
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
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
                            style={[styles.statusText, { color: '#FFFFFF' }]}
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
