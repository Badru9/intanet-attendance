// app/(tabs)/leave/[id].tsx
import CustomConfirmationModal from '@/components/ConfirmationDialog';
import {
  deleteLeaveRequest,
  formatDateRange,
  getLeaveRequests,
  LeaveRequestData,
  LeaveStatus,
  mapLeaveStatusToDisplay,
  mapLeaveTypeToDisplay,
} from '@/services/leave';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LeaveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [leaveDetail, setLeaveDetail] = useState<LeaveRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);

  const fetchLeaveDetail = useCallback(async () => {
    if (!id) {
      setLeaveDetail(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      console.log('Fetching leave detail for ID:', id);

      // For now, we'll fetch the list and find the specific item
      // In a real app, you'd have a getLeaveRequestById API endpoint
      const response = await getLeaveRequests(1, 100); // Get more items to find the one we need

      if (response.success && response.data) {
        const foundLeave = response.data.data.find(
          (item) => item.id.toString() === id
        );

        if (foundLeave) {
          console.log('Leave detail found:', foundLeave);
          setLeaveDetail(foundLeave);
        } else {
          console.warn('Leave detail not found for ID:', id);
          setLeaveDetail(null);
        }
      } else {
        console.warn('Invalid response format:', response);
        setLeaveDetail(null);
      }
    } catch (error) {
      console.error('Error fetching leave detail:', error);

      // Show user-friendly error messages
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
        }
      }

      setLeaveDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchLeaveDetail();
    }, [fetchLeaveDetail])
  );

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

  const handleCancelLeave = () => {
    setModalVisible(true); // Tampilkan modal
  };

  const handleConfirmCancel = async () => {
    setModalVisible(false); // Tutup modal saat user menekan 'Yakin'

    try {
      if (id) {
        console.log('Attempting to delete leave request with ID:', id);

        const response = await deleteLeaveRequest(id);

        if (response.success) {
          Alert.alert(
            'Sukses',
            response.message || 'Pengajuan cuti berhasil dibatalkan.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
        } else {
          Alert.alert(
            'Error',
            response.message || 'Gagal membatalkan pengajuan cuti.'
          );
        }
      }
    } catch (error) {
      console.error('Failed to delete leave item:', error);

      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          Alert.alert(
            'Error',
            'Anda tidak memiliki izin untuk membatalkan pengajuan ini.'
          );
        } else if (error.message.includes('tidak dapat dihapus')) {
          Alert.alert(
            'Error',
            'Pengajuan cuti yang sudah diproses tidak dapat dibatalkan.'
          );
        } else if (error.message.includes('tidak ditemukan')) {
          Alert.alert('Error', 'Pengajuan cuti tidak ditemukan.');
        } else {
          Alert.alert(
            'Error',
            `Gagal membatalkan pengajuan cuti: ${error.message}`
          );
        }
      } else {
        Alert.alert(
          'Error',
          'Gagal membatalkan pengajuan cuti. Silakan coba lagi.'
        );
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={{ marginTop: 10 }}>Memuat detail cuti...</Text>
      </View>
    );
  }

  if (!leaveDetail) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <AntDesign name='arrowleft' size={24} color='#000' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Cuti</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centeredContainer}>
          <Text style={styles.notFoundText}>Data cuti tidak ditemukan.</Text>
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
        <Text style={styles.headerTitle}>Detail Cuti</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>
                {mapLeaveTypeToDisplay(leaveDetail.leave_type)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(leaveDetail.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {mapLeaveStatusToDisplay(leaveDetail.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.dateRange}>
              {formatDateRange(leaveDetail.start_date, leaveDetail.end_date)}
            </Text>
            <Text style={styles.totalDays}>
              {leaveDetail.total_days} hari kerja
            </Text>
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            <DetailRow
              icon='calendar'
              title='Tanggal Pengajuan'
              value={new Date(leaveDetail.created_at).toLocaleDateString(
                'id-ID'
              )}
            />
            <DetailRow
              icon='tag'
              title='Tipe Cuti'
              value={mapLeaveTypeToDisplay(leaveDetail.leave_type)}
            />
            {leaveDetail.approved_at && (
              <DetailRow
                icon='check-circle'
                title='Tanggal Diproses'
                value={new Date(leaveDetail.approved_at).toLocaleDateString(
                  'id-ID'
                )}
              />
            )}
            {leaveDetail.approver && (
              <DetailRow
                icon='user-check'
                title='Diproses oleh'
                value={leaveDetail.approver.name}
              />
            )}
          </View>

          {/* Reason */}
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>Alasan</Text>
            <Text style={styles.reasonText}>{leaveDetail.reason}</Text>
          </View>

          {/* Rejection Reason if exists */}
          {leaveDetail.status === 'rejected' &&
            leaveDetail.rejection_reason && (
              <View style={styles.reasonCard}>
                <Text style={styles.reasonTitle}>Alasan Penolakan</Text>
                <Text style={[styles.reasonText, { color: '#FF3B30' }]}>
                  {leaveDetail.rejection_reason}
                </Text>
              </View>
            )}

          {/* Actions (if status is pending) */}
          {leaveDetail.status === 'pending' && (
            <View style={styles.actionCard}>
              <Text style={styles.actionTitle}>Aksi</Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelLeave}
                activeOpacity={0.7}
              >
                <Feather name='x-circle' size={20} color='#FF3B30' />
                <Text style={styles.cancelButtonText}>Batalkan Pengajuan</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal konfirmasi kustom */}
      <CustomConfirmationModal
        isVisible={isModalVisible}
        title='Apakah Anda yakin ingin membatalkan pengajuan cuti ini?'
        onConfirm={handleConfirmCancel}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// Helper component for detail rows
const DetailRow: React.FC<{
  icon: string;
  title: string;
  value: string;
}> = ({ icon, title, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLeft}>
      <Feather name={icon as any} size={20} color='#666' />
      <Text style={styles.detailTitle}>{title}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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
  notFoundText: {
    fontSize: 16,
    color: '#999',
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
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dateRange: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  totalDays: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  detailTitle: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  reasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  reasonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FF3B3015',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
