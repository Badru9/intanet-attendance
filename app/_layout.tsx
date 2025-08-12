// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/authContext';
import { ThemeProvider } from '../contexts/themeContext';
import { useSetupApp } from '../hooks/useSetupApp';
import './global.css';

export default function RootLayout() {
  const { isLoading, error } = useSetupApp();

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000',
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 16 }}>
            Memuat aplikasi...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (error) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#FF0000',
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              color: '#FFF',
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 24,
            }}
          >
            Terjadi kesalahan saat memuat aplikasi.
          </Text>
          <Text
            style={{
              color: '#FFF',
              fontSize: 14,
              textAlign: 'center',
              marginTop: 8,
              opacity: 0.8,
            }}
          >
            {error instanceof Error ? error.message : String(error)}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style='light' />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
            initialRouteName='(tabs)'
          >
            {/* Main App with Tabs */}
            {/* Auth Group */}
            <Stack.Screen
              name='(auth)'
              options={{
                headerShown: false,
                // presentation: 'modal',
              }}
            />
            <Stack.Screen name='(tabs)' options={{ headerShown: false }} />

            {/* Other Screens */}
            {/* <Stack.Screen name='attendance' options={{ headerShown: false }} /> */}

            {/* System Routes */}
            <Stack.Screen name='index' options={{ headerShown: false }} />
            <Stack.Screen name='+not-found' options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
