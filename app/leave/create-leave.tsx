// app/(tabs)/leave/create.tsx
// Copy the updated CreateLeaveScreen code here

import { AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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

// Tipe data untuk tipe cuti yang tersedia
type LeaveType = 'Liburan' | 'Cuti' | 'Sakit';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  multiline?: boolean;
  style?: TextStyle;
  containerStyle?: ViewStyle;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  ...props
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[styles.textInput, props.multiline && styles.reasonInput]}
      {...props}
    />
  </View>
);

export default function CreateLeaveScreen() {
  const router = useRouter();
  const [selectedLeaveType, setSelectedLeaveType] =
    useState<LeaveType>('Liburan');
  const [reason, setReason] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState({});

  const insets = useSafeAreaInsets();

  // Fix: DateData is the correct type for react-native-calendars
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
    console.log('Tipe Cuti:', selectedLeaveType);
    console.log('Alasan:', reason);
    console.log('Tanggal Terpilih:', selectedDatesArray);

    // Validasi data sebelum submit
    if (!reason.trim()) {
      alert('Mohon isi alasan cuti');
      return;
    }

    if (selectedDatesArray.length === 0) {
      alert('Mohon pilih tanggal cuti');
      return;
    }

    // TODO: Implement API call untuk submit data
    // Setelah berhasil submit, kembali ke halaman list
    router.back();
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
                <Picker.Item label='Tipe Cuti' value='' color='#999' />
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
              // Tambahan props untuk customization
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
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333333',
    minHeight: 56,
  },
  reasonInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
