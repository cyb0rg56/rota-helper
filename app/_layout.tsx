import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { store, loadPersistedState, persistState, useAppDispatch } from '@/store';
import { setStaff } from '@/store/slices/staffSlice';
import { setShifts } from '@/store/slices/shiftSlice';
import { loadPersistedPeriod } from '@/store/slices/periodSlice';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Load persisted state on app start
    const loadState = async () => {
      const persisted = await loadPersistedState();
      if (persisted) {
        dispatch(setStaff(persisted.staff));
        dispatch(setShifts(persisted.shifts));
        dispatch(loadPersistedPeriod(persisted.period));
      }
      setIsReady(true);
    };
    loadState();
  }, [dispatch]);

  useEffect(() => {
    // Subscribe to store changes and persist
    if (isReady) {
      const unsubscribe = store.subscribe(() => {
        persistState();
      });
      return () => unsubscribe();
    }
  }, [isReady]);

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="add-staff" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Staff Member',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff' },
          }} 
        />
        <Stack.Screen 
          name="edit-staff" 
          options={{ 
            presentation: 'modal', 
            title: 'Edit Staff Member',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff' },
          }} 
        />
        <Stack.Screen 
          name="add-shifts" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Shifts',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff' },
          }} 
        />
        <Stack.Screen 
          name="edit-shift" 
          options={{ 
            presentation: 'modal', 
            title: 'Edit Shift',
            headerStyle: { backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#fff' },
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
