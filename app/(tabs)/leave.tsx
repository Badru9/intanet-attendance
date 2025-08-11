import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LeaveType = 'All' | 'Liburan' | 'Cuti' | 'Sakit';

type LeaveStatus = 'Sedang Diproses' | 'Disetujui' | 'Ditolak';

interface LeaveItem {
  id: string;
  type: LeaveType;
  title: string;
  dateRange: string;
  status: LeaveStatus;
  month: string;
  year: string;
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
  },
  {
    id: '2',
    type: 'Sakit',
    title: 'Sakit',
    dateRange: 'Senin 7 Juli - Kamis 10 Juli',
    status: 'Disetujui',
    month: 'Juli',
    year: '2025',
  },
  {
    id: '3',
    type: 'Liburan',
    title: 'Liburan Keluarga',
    dateRange: 'Kamis 7 Agustus - Minggu 10 Agustus',
    status: 'Ditolak',
    month: 'Juli',
    year: '2025',
  },
];

export default function LeaveScreen() {
  const [selectedFilter, setSelectedFilter] = useState<LeaveType>('All');

  const filterButtons: LeaveType[] = ['All', 'Liburan', 'Cuti', 'Sakit'];

  const insets = useSafeAreaInsets();

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'Sedang Diproses':
        return '#FF9500';
      case 'Disetujui':
        return '#34C759';
      case 'Ditolak':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusTextColor = (status: LeaveStatus) => {
    return '#FFFFFF';
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

  return (
    <SafeAreaView style={{ ...styles.container, paddingTop: insets.top }}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pengajuan Cuti</Text>
          <TouchableOpacity style={styles.addButton}>
            <Feather name='plus' size={24} color='#FFFFFF' />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Leave Items */}
        <View style={styles.content}>
          {Object.entries(groupedData).map(([monthYear, items]) => (
            <View key={monthYear} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{monthYear}</Text>

              {items.map((item) => (
                <View key={item.id} style={styles.leaveCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleContainer}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDate}>{item.dateRange}</Text>
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

                  <View style={styles.typeButton}>
                    <Text style={styles.typeButtonText}>{item.type}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  typeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
