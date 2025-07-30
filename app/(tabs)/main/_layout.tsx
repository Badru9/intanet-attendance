import { Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: 'blue' }}>
      <Tabs.Screen
        name='index'
        options={{
          headerShown: false,
          // tabBarIcon: ({ color }) => (
          //   <FontAwesome size={28} name='house' color={color} />
          // ),
        }}
      />
      <Tabs.Screen
        name='settings'
        options={{
          headerShown: false,
          // tabBarIcon: ({ color }) => (
          //   <FontAwesome size={28} name='facebook' color={color} />
          // ),
        }}
      />
    </Tabs>
  );
}
