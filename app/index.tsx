// app/index.tsx
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../contexts/authContext';

export default function IndexPage() {
  const { user, token, isLoading } = useAuth();

  console.log('Checking authentication status...', {
    user: !!user,
    token: !!token,
    isLoading,
  });

  // Show loading while checking auth
  if (isLoading) {
    console.log('Loading authentication status...');

    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
        }}
      >
        <ActivityIndicator size='large' color='#007AFF' />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: '#666666',
          }}
        >
          Memeriksa status login...
        </Text>
      </View>
    );
  }

  // Redirect based on auth status
  if (user && token) {
    console.log('User authenticated, redirecting to home');
    return <Redirect href='/home' />;
  } else {
    console.log('User not authenticated, redirecting to login');
    return <Redirect href='/login' />;
  }
}
