// app/index.tsx
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
// Import your auth context if available
// import { useAuth } from '../contexts/authContext';

export default function IndexPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // If you have auth context, use it instead:
  // const { isAuthenticated, isLoading } = useAuth();

  console.log('Checking authentication status...', isAuthenticated);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is authenticated
        // This could be checking AsyncStorage, SecureStore, etc.
        // Example:
        // const token = await AsyncStorage.getItem('authToken');
        // const isValid = await validateToken(token);
        // setIsAuthenticated(isValid);

        // For now, simulate auth check
        setTimeout(() => {
          // Change this based on your actual auth logic
          setIsAuthenticated(true); // or false for testing login flow
        }, 1000);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Show loading while checking auth
  if (isAuthenticated === null) {
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
  if (isAuthenticated) {
    return <Redirect href='/home' />;
  } else {
    return <Redirect href='/login' />;
  }
}
