import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Profile() {
  const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  const handlePress = (screenName: string) => {
    // Anda bisa menavigasi ke layar lain di sini jika dibutuhkan
    // navigation.navigate(screenName as never);
    console.log(`Navigating to ${screenName}`);
  };

  return (
    <SafeAreaView style={{ ...styles.container, paddingTop: insets.top }}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?img=50' }}
          style={styles.profileImage}
        />
        <Text style={styles.name}>Kaylynn Torff</Text>
        <Text style={styles.position}>UI / UX Designer</Text>
      </View>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handlePress('PersonalInformation')}
        >
          <Text style={styles.menuText}>Personal Information</Text>
          <Feather name='chevron-right' size={20} color='#666' />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handlePress('ChangePassword')}
        >
          <Text style={styles.menuText}>Change Password</Text>
          <Feather name='chevron-right' size={20} color='#666' />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ ...styles.menuItem, marginTop: 50 }}
          onPress={() => handlePress('LogOut')}
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
