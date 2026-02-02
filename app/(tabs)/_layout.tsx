import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff',
          borderTopColor: colorScheme === 'dark' ? '#2d2d44' : '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rota',
          headerTitle: 'Weekly Rota',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          headerTitle: 'Staff Members',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings & Export',
          tabBarIcon: ({ color }) => <Ionicons size={28} name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
