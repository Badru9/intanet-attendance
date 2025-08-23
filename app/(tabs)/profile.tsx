// src/app/(main)/profile.tsx
import { useAuth } from '@/contexts/authContext';
import { UserType } from '@/types';
import { getUser } from '@/utils/user';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

enum ScreenNames {
  PersonalInformation = 'PersonalInformation',
  ChangePassword = 'ChangePassword',
  LogOut = 'LogOut',
}

export default function Profile() {
  const [user, setUser] = useState<UserType>();

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { logout: handleLogout, isLoading } = useAuth();

  // Fungsi spesifik untuk navigasi ke Personal Information
  const handlePersonalInformation = () => {
    console.log('Navigating to Personal Information screen');
    // Tambahkan navigasi ke Personal Information di sini
    // router.push('/personal-information');
  };

  // Fungsi spesifik untuk navigasi ke Change Password
  const handleChangePassword = () => {
    console.log('Navigating to Change Password screen');
    // Tambahkan navigasi ke Change Password di sini
    // router.push('/change-password');
  };

  // Fungsi spesifik untuk Logout
  const handleLogoutPress = async () => {
    console.log('Logging out...');
    try {
      await handleLogout();
      console.log('Logout successful, navigating to login.');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Tetap alihkan meskipun terjadi error, karena data lokal sudah dihapus
      router.replace('/(auth)/login');
    }
  };

  const fetchUser = useCallback(async () => {
    if (!isLoading) {
      try {
        const userData = await getUser();
        console.log('Fetched user data:', userData);

        if (userData) {
          setUser(userData.user);
        }
        // console.log('Fetched user data:', userData.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }
  }, [isLoading]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' color='#0000ff' />
        <Text style={{ color: '#666', fontSize: 16, marginTop: 10 }}>
          Memuat profil...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ ...styles.container, paddingTop: insets.top }}>
      <View style={styles.header}>
        {/* <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=50' }}
          style={styles.profileImage}
        /> */}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.position}>
          {user?.is_admin !== 0 ? 'Direktur' : 'Karyawan'}
        </Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handlePersonalInformation}
        >
          <Text style={styles.menuText}>Personal Information</Text>
          <Feather name='chevron-right' size={20} color='#666' />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleChangePassword}
        >
          <Text style={styles.menuText}>Change Password</Text>
          <Feather name='chevron-right' size={20} color='#666' />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ ...styles.menuItem, marginTop: 50 }}
          onPress={handleLogoutPress}
        >
          <Text style={styles.menuText}>Logout</Text>
          <Feather name='log-out' size={20} color='#666' />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    display: 'flex',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    marginBlock: 100,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  position: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 50,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#fff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});
