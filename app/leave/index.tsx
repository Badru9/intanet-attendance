// app/leave/index.tsx
import { AntDesign, Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  formatDateRange,
  getLeaveRequests,
  LeaveRequestData,
  LeaveStatus,
  mapLeaveStatusToDisplay,
  mapLeaveTypeToDisplay,
} from '@/services/leave';

export default function LeaveListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchLeaveRequests = async (
    page: number = 1,
    refresh: boolean = false
  ) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setCurrentPage(1);
      } else if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await getLeaveRequests(page, 15);

      if (response.success && response.data) {
        const newLeaveRequests = response.data.data;

        if (refresh || page === 1) {
          setLeaveRequests(newLeaveRequests);
        } else {
          setLeaveRequests((prev) => [...prev, ...newLeaveRequests]);
        }

        setCurrentPage(page);
        setHasMorePages(page < response.data.last_page);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat memuat data cuti.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLeaveRequests(1, true);
    }, [])
  );

  const handleRefresh = () => {
    fetchLeaveRequests(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMorePages) {
      fetchLeaveRequests(currentPage + 1);
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
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

  const renderLeaveItem = ({ item }: { item: LeaveRequestData }) => (
    <TouchableOpacity
      style={styles.leaveItem}
      onPress={() => router.push(`/leave/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.leaveHeader}>
        <Text style={styles.leaveType}>
          {mapLeaveTypeToDisplay(item.leave_type)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {mapLeaveStatusToDisplay(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.leaveDateContainer}>
        <Feather name='calendar' size={16} color='#666' />
        <Text style={styles.leaveDate}>
          {formatDateRange(item.start_date, item.end_date)}
        </Text>
      </View>

      <View style={styles.leaveDaysContainer}>
        <Feather name='clock' size={16} color='#666' />
        <Text style={styles.leaveDays}>{item.total_days} hari kerja</Text>
      </View>

      <Text style={styles.leaveReason} numberOfLines={2}>
        {item.reason}
      </Text>

      <View style={styles.leaveFooter}>
        <Text style={styles.submittedDate}>
          Diajukan: {new Date(item.created_at).toLocaleDateString('id-ID')}
        </Text>
        <Feather name='chevron-right' size={20} color='#666' />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Feather name='calendar' size={64} color='#CCC' />
      <Text style={styles.emptyTitle}>Belum Ada Pengajuan Cuti</Text>
      <Text style={styles.emptySubtitle}>
        Anda belum memiliki pengajuan cuti. Tap tombol + untuk membuat pengajuan
        baru.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size='small' color='#2563EB' />
        <Text style={styles.footerText}>Memuat data...</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign name='arrowleft' size={24} color='#000' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daftar Cuti</Text>
          <TouchableOpacity
            onPress={() => router.push('/leave/create-leave')}
            style={styles.addButton}
          >
            <AntDesign name='plus' size={24} color='#2563EB' />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#2563EB' />
          <Text style={styles.loadingText}>Memuat data cuti...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AntDesign name='arrowleft' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daftar Cuti</Text>
        <TouchableOpacity
          onPress={() => router.push('/leave/create-leave')}
          style={styles.addButton}
        >
          <AntDesign name='plus' size={24} color='#2563EB' />
        </TouchableOpacity>
      </View>

      {/* Leave List */}
      <FlatList
        data={leaveRequests}
        renderItem={renderLeaveItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          leaveRequests.length === 0 && styles.emptyListContainer,
        ]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  addButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
  },
  leaveItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  leaveDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveDate: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  leaveDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveDays: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
    marginLeft: 8,
  },
  leaveReason: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 12,
  },
  leaveFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submittedDate: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
});
