import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import '../../global.css';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name='Home'
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather size={28} name='home' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='Attendance'
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Feather size={28} name='calendar' color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
