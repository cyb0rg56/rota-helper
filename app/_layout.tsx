import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import {
  compactSheetDetents,
  formSheetScreenOptions,
  smallSheetDetents,
} from '@/constants/navigation';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useWebIconFonts } from '@/hooks/use-web-icon-fonts';
import { loadPersistedPeriod } from '@/store/slices/periodSlice';
import { setShifts } from '@/store/slices/shiftSlice';
import { setStaff } from '@/store/slices/staffSlice';
import { loadPersistedState, schedulePersist, store, useAppDispatch } from '@/store';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);
  const [fontsLoaded, fontError] = useWebIconFonts();
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    const loadState = async () => {
      const persisted = await loadPersistedState();
      if (persisted) {
        dispatch(setStaff(persisted.staff));
        dispatch(setShifts(persisted.shifts));
        dispatch(loadPersistedPeriod(persisted.period));
      }
      setIsReady(true);
    };
    void loadState();
  }, [dispatch]);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (process.env.EXPO_OS === 'web' && !fontsReady) {
      return;
    }

    void SplashScreen.hideAsync();
    const unsubscribe = store.subscribe(() => {
      schedulePersist();
    });
    return () => unsubscribe();
  }, [isReady, fontsReady]);

  if (!isReady) {
    return null;
  }
  if (process.env.EXPO_OS === 'web' && !fontsReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-staff"
          options={{
            ...formSheetScreenOptions,
            title: 'Add Staff Member',
            sheetAllowedDetents: compactSheetDetents,
          }}
        />
        <Stack.Screen
          name="edit-staff"
          options={{
            ...formSheetScreenOptions,
            title: 'Edit Staff Member',
            sheetAllowedDetents: compactSheetDetents,
          }}
        />
        <Stack.Screen
          name="add-shifts"
          options={{
            ...formSheetScreenOptions,
            title: 'Add Shifts',
            sheetAllowedDetents: [1],
          }}
        />
        <Stack.Screen
          name="edit-shift"
          options={{
            ...formSheetScreenOptions,
            title: 'Edit Shift',
            sheetAllowedDetents: [1],
          }}
        />
        <Stack.Screen
          name="calendar-name"
          options={{
            ...formSheetScreenOptions,
            title: 'Calendar Name',
            sheetAllowedDetents: smallSheetDetents,
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
