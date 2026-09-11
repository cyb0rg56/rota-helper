import { Stack } from 'expo-router/stack';

import { nativeStackScreenOptions } from '@/constants/navigation';

export const unstable_settings = {
  anchor: 'staff',
};

export default function StaffLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen name="staff" options={{ title: 'Staff' }} />
    </Stack>
  );
}
