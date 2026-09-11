import { Stack } from 'expo-router/stack';

import { nativeStackScreenOptions } from '@/constants/navigation';

export const unstable_settings = {
  anchor: 'settings',
};

export default function SettingsLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
