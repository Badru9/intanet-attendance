// app/change-password.tsx
import { changePassword, ChangePasswordPayload } from '@/services/auth';
import { AntDesign, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate old password
    if (!formData.oldPassword.trim()) {
      newErrors.oldPassword = 'Password lama harus diisi';
    }

    // Validate new password
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'Password baru harus diisi';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password baru minimal 8 karakter';
    }

    // Validate confirm password
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Konfirmasi password harus diisi';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak sesuai';
    }

    // Check if new password is different from old password
    if (
      formData.oldPassword === formData.newPassword &&
      formData.newPassword.trim()
    ) {
      newErrors.newPassword =
        'Password baru harus berbeda dengan password lama';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const payload: ChangePasswordPayload = {
        old_password: formData.oldPassword,
        new_password: formData.newPassword,
      };

      console.log('Submitting password change...');
      const response = await changePassword(payload);

      if (response.success) {
        Alert.alert(
          'Berhasil',
          response.message || 'Password berhasil diubah',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Gagal mengubah password');
      }
    } catch (error) {
      console.error('Change password error:', error);

      if (error instanceof Error) {
        if (error.message.includes('Password lama tidak sesuai')) {
          setErrors({ oldPassword: 'Password lama tidak sesuai' });
        } else if (error.message.includes('Network')) {
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
          Alert.alert('Error', `Gagal mengubah password: ${error.message}`);
        }
      } else {
        Alert.alert('Error', 'Gagal mengubah password. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

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
        <Text style={styles.headerTitle}>Ubah Password</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.content}>
          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Feather name='info' size={20} color='#007AFF' />
              <Text style={styles.infoTitle}>Keamanan Password</Text>
            </View>
            <Text style={styles.infoText}>
              Pastikan password baru Anda aman dengan menggunakan kombinasi
              huruf besar, huruf kecil, angka, dan karakter khusus.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {/* Old Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password Lama</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.oldPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder='Masukkan password lama'
                  placeholderTextColor='#999'
                  value={formData.oldPassword}
                  onChangeText={(value) => updateFormData('oldPassword', value)}
                  secureTextEntry={!showOldPassword}
                  autoCapitalize='none'
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowOldPassword(!showOldPassword)}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showOldPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color='#666'
                  />
                </TouchableOpacity>
              </View>
              {errors.oldPassword && (
                <Text style={styles.errorText}>{errors.oldPassword}</Text>
              )}
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password Baru</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.newPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder='Masukkan password baru (min. 8 karakter)'
                  placeholderTextColor='#999'
                  value={formData.newPassword}
                  onChangeText={(value) => updateFormData('newPassword', value)}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize='none'
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color='#666'
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.textInput}
                  placeholder='Ulangi password baru'
                  placeholderTextColor='#999'
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    updateFormData('confirmPassword', value)
                  }
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize='none'
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color='#666'
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            {isLoading ? (
              <ActivityIndicator size='small' color='#FFFFFF' />
            ) : (
              <>
                <Feather name='check' size={20} color='#FFFFFF' />
                <Text style={styles.submitButtonText}>Ubah Password</Text>
              </>
            )}
          </TouchableOpacity>
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
    gap: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333333',
  },
  eyeButton: {
    padding: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
