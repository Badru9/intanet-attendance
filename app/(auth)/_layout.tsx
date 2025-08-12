// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animationTypeForReplace: 'push',
      }}
    >
      <Stack.Screen
        name='login'
        options={{
          title: 'Login',
        }}
      />

      <Stack.Screen
        name='register'
        options={{
          title: 'Register',
        }}
      />
    </Stack>
  );
}
