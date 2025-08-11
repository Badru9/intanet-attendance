// app/_layout.tsx
import { TabBar } from '@/components/TabBar';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import { AuthProvider } from '../../contexts/authContext';
import { ThemeProvider } from '../../contexts/themeContext';
import { useSetupApp } from '../../hooks/useSetupApp';
import '../global.css';

export default function RootLayout() {
  const { isLoading, error } = useSetupApp();
  const windowWidth = Dimensions.get('window').width;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#000',
        }}
      >
        <Text style={{ color: '#FFF' }}>Memuat aplikasi...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FF0000',
        }}
      >
        <Text style={{ color: '#FFF' }}>
          Terjadi kesalahan saat memuat aplikasi.
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style='light' />
        <Tabs tabBar={(props) => <TabBar {...props} />}>
          <Tabs.Screen
            name='home'
            options={{
              tabBarIcon: ({ color }) => (
                <Feather size={28} name='home' color={color} />
              ),
              headerShown: false,
              title: 'home',
            }}
          />
          <Tabs.Screen
            name='leave'
            options={{
              tabBarIcon: ({ color }) => (
                <Feather size={28} name='calendar' color={color} />
              ),
              headerShown: false,
              title: 'calendar',
            }}
          />
          <Tabs.Screen
            name='profile'
            options={{
              tabBarIcon: ({ color }) => (
                <Feather size={28} name='user' color={color} />
              ),
              headerShown: false,
              title: 'user',
            }}
          />
        </Tabs>
      </AuthProvider>
    </ThemeProvider>
  );
}
