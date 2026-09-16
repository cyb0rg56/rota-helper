import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/icon';

export const unstable_settings = {
  anchor: '(rota)',
};

function TabBarGlyph({
  sf,
  md,
  color,
  size,
}: {
  sf: Parameters<typeof Icon>[0]['sf'];
  md: Parameters<typeof Icon>[0]['md'];
  color: string;
  size: number;
}) {
  return (
    <View aria-hidden>
      <Icon sf={sf} md={md} size={size} color={color} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4ECDC4',
      }}
    >
      <Tabs.Screen
        name="(rota)"
        options={{
          title: 'Rota',
          tabBarAccessibilityLabel: 'Rota',
          tabBarIcon: ({ color, size }) => (
            <TabBarGlyph sf="calendar" md="calendar-month" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="(staff)"
        options={{
          title: 'Staff',
          tabBarAccessibilityLabel: 'Staff',
          tabBarIcon: ({ color, size }) => (
            <TabBarGlyph sf="person.2" md="account-group" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="(settings)"
        options={{
          title: 'Settings',
          tabBarAccessibilityLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabBarGlyph sf="gearshape" md="cog" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
