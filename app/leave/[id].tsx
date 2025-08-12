// app/(tabs)/leave/[id].tsx
import CustomConfirmationModal from '@/components/ConfirmationDialog';
import {
  deleteLeaveItem,
  getLeaveItemById,
  LeaveItem,
  LeaveStatus,
} from '@/utils/leaveStorage';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
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

  const [leaveDetail, setLeaveDetail] = useState<LeaveItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);

  const fetchLeaveDetail = async () => {
    if (!id) {
      setLeaveDetail(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await getLeaveItemById(id);
    setLeaveDetail(data || null);
    setIsLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLeaveDetail();
    }, [id])
  );

  const getStatusColor = (status: LeaveStatus) => {
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

  const handleCancelLeave = () => {
    setModalVisible(true); // Tampilkan modal
  };

  const handleConfirmCancel = async () => {
    setModalVisible(false); // Tutup modal saat user menekan 'Yakin'
    try {
      if (id) {
        await deleteLeaveItem(id);
        Alert.alert('Sukses', 'Pengajuan cuti berhasil dibatalkan.');
        router.back();
      }
    } catch (error) {
      console.error('Failed to delete leave item:', error);
      Alert.alert('Error', 'Gagal membatalkan pengajuan cuti.');
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
              <Text style={styles.statusTitle}>{leaveDetail.title}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(leaveDetail.status) },
                ]}
              >
                <Text style={styles.statusText}>{leaveDetail.status}</Text>
              </View>
            </View>
            <Text style={styles.dateRange}>{leaveDetail.dateRange}</Text>
            {/* Tampilkan total hari hanya jika data ada */}
            {/* <Text style={styles.totalDays}>{leaveDetail.totalDays} hari kerja</Text> */}
          </View>

          {/* Details */}
          <View style={styles.detailCard}>
            <DetailRow
              icon='calendar'
              title='Tanggal Pengajuan'
              value={new Date(leaveDetail.submittedDate).toLocaleDateString(
                'id-ID'
              )}
            />
            {/* ... DetailRows lainnya bisa ditambahkan sesuai kebutuhan */}
            <DetailRow icon='tag' title='Tipe Cuti' value={leaveDetail.type} />
          </View>

          {/* Reason */}
          <View style={styles.reasonCard}>
            <Text style={styles.reasonTitle}>Alasan</Text>
            <Text style={styles.reasonText}>{leaveDetail.reason}</Text>
          </View>

          {/* Actions (if status is pending) */}
          {leaveDetail.status === 'Sedang Diproses' && (
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
