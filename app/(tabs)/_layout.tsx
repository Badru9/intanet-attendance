// app/(tabs)/_layout.tsx
import { TabBar } from '@/components/TabBar';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='home'
        options={{
          tabBarIcon: ({ color }) => (
            <Feather size={28} name='home' color={color} />
          ),
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name='leave'
        options={{
          tabBarIcon: ({ color }) => (
            <Feather size={28} name='calendar' color={color} />
          ),
          title: 'Cuti',
        }}
      />

      <Tabs.Screen
        name='profile'
        options={{
          tabBarIcon: ({ color }) => (
            <Feather size={28} name='user' color={color} />
          ),
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
