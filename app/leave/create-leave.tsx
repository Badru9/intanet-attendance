import CustomConfirmationModal from '@/components/ConfirmationDialog';
import { addLeaveItem, LeaveItem, LeaveType } from '@/utils/leaveStorage';
import { AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tipe data untuk props CustomTextInput
interface CustomTextInputProps extends TextInputProps {
  label: string;
  multiline?: boolean;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

// Helper function untuk format tanggal ke bahasa Indonesia
const formatDatesToRange = (dates: string[]): string => {
  const sortedDates = dates.sort();
  if (sortedDates.length === 0) return '';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    };
    return date.toLocaleDateString('id-ID', options);
  };

  if (sortedDates.length === 1) {
    return formatDate(sortedDates[0]);
  }

  const firstDate = sortedDates[0];
  const lastDate = sortedDates[sortedDates.length - 1];
  return `${formatDate(firstDate)} - ${formatDate(lastDate)}`;
};

export default function CreateLeaveScreen() {
  const router = useRouter();
  const [selectedLeaveType, setSelectedLeaveType] =
    useState<LeaveType>('Liburan');
  const [reason, setReason] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState({});

  const [isModalVisible, setModalVisible] = useState(false);

  const insets = useSafeAreaInsets();

  const handleDayPress = (day: DateData) => {
    const newSelectedDates: any = { ...selectedDates };
    if (newSelectedDates[day.dateString]) {
      delete newSelectedDates[day.dateString];
    } else {
      newSelectedDates[day.dateString] = {
        selected: true,
        selectedColor: '#007AFF',
        selectedTextColor: '#FFFFFF',
      };
    }
    setSelectedDates(newSelectedDates);
  };

  const handleAjukanCuti = () => {
    const selectedDatesArray = Object.keys(selectedDates);

    // Validasi data
    if (!reason.trim()) {
      Alert.alert('Peringatan', 'Mohon isi alasan cuti.');
      return;
    }

    if (selectedDatesArray.length === 0) {
      Alert.alert('Peringatan', 'Mohon pilih tanggal cuti.');
      return;
    }

    // Tampilkan modal, jangan langsung proses
    setModalVisible(true);
  };

  const handleConfirm = async () => {
    setModalVisible(false); // Tutup modal
    try {
      // Logika penyimpanan data
      const selectedDatesArray = Object.keys(selectedDates);
      const dateRange = formatDatesToRange(selectedDatesArray);
      const firstDate = new Date(selectedDatesArray.sort()[0]);
      const month = firstDate.toLocaleString('id-ID', { month: 'long' });
      const year = firstDate.getFullYear().toString();

      const newLeaveData: Omit<LeaveItem, 'id' | 'submittedDate' | 'status'> = {
        type: selectedLeaveType,
        title: 'Pengajuan Cuti',
        dateRange: dateRange,
        month: month,
        year: year,
        reason: reason,
      };

      await addLeaveItem(newLeaveData);

      Alert.alert('Sukses', 'Pengajuan cuti berhasil diajukan.');
      router.back();
    } catch (error) {
      console.error('Error saat mengajukan cuti:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat mengajukan cuti.');
    }
  };

  return (
    <SafeAreaView style={{ ...styles.container, paddingTop: insets.top }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <AntDesign name='arrowleft' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Pengajuan Cuti</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {/* Tipe Cuti Picker */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipe Cuti</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedLeaveType}
                onValueChange={(itemValue) =>
                  setSelectedLeaveType(itemValue as LeaveType)
                }
                style={styles.picker}
                mode='dropdown'
              >
                <Picker.Item label='Pilih Tipe Cuti' value='' color='#999' />
                <Picker.Item label='Liburan' value='Liburan' />
                <Picker.Item label='Cuti' value='Cuti' />
                <Picker.Item label='Sakit' value='Sakit' />
              </Picker>
              <AntDesign
                name='down'
                size={16}
                color='#666'
                style={styles.pickerIcon}
              />
            </View>
          </View>

          {/* Alasan Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Alasan</Text>
            <TextInput
              style={[styles.textInput, styles.reasonInput]}
              multiline
              value={reason}
              onChangeText={setReason}
              placeholder='Alasan'
              placeholderTextColor='#999'
              textAlignVertical='top'
            />
          </View>

          {/* Calendar */}
          <View style={styles.calendarContainer}>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={selectedDates}
              markingType='multi-dot'
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#007AFF',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#007AFF',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#007AFF',
                disabledArrowColor: '#d9e1e8',
                monthTextColor: '#2d4150',
                indicatorColor: '#007AFF',
                textDayFontFamily: 'System',
                textMonthFontFamily: 'System',
                textDayHeaderFontFamily: 'System',
                textDayFontWeight: '400',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '600',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13,
              }}
              style={styles.calendar}
              hideExtraDays={true}
              firstDay={1}
              enableSwipeMonths={true}
            />
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAjukanCuti}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>Ajukan Cuti</Text>
        </TouchableOpacity>
      </View>
      <CustomConfirmationModal
        isVisible={isModalVisible}
        onConfirm={handleConfirm}
        onCancel={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  picker: {
    height: 56,
    width: '100%',
    color: '#333',
  },
  pickerIcon: {
    position: 'absolute',
    right: 16,
    pointerEvents: 'none',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    fontSize: 16,
    color: '#6B7280',
    minHeight: 56,
  },
  reasonInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 16,
  },
  calendarContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  calendar: {
    borderRadius: 12,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 24,
    marginBottom: 30,
    borderRadius: 50,
    alignItems: 'center',
    width: 'auto',
    alignSelf: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
