import { Stack } from 'expo-router/stack';

import { nativeStackScreenOptions } from '@/constants/navigation';

export const unstable_settings = {
  anchor: 'index',
};

export default function RotaLayout() {
  return (
    <Stack screenOptions={nativeStackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Rota' }} />
    </Stack>
  );
}
