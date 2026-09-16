import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';

import { SheetScreen } from '@/components/header-actions';
import { SheetBodyTitle } from '@/components/sheet-body-title';
import { ThemedText } from '@/components/themed-text';
import { CALENDAR_NAME_KEY, DEFAULT_CALENDAR_NAME } from '@/constants/storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { confirmAlert } from '@/utils/confirm';

export default function CalendarNameScreen() {
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState(DEFAULT_CALENDAR_NAME);

  useEffect(() => {
    void AsyncStorage.getItem(CALENDAR_NAME_KEY).then((saved) => {
      if (saved) {
        setName(saved);
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    try {
      await AsyncStorage.setItem(CALENDAR_NAME_KEY, trimmed);
      router.back();
    } catch (error) {
      console.error('Failed to save calendar name:', error);
      confirmAlert('Error', 'Failed to save calendar name');
    }
  };

  return (
    <SheetScreen
      left={[{ key: 'cancel', label: 'Cancel', onPress: () => router.back() }]}
      right={[
        {
          key: 'save',
          label: 'Save',
          prominent: true,
          disabled: !name.trim(),
          onPress: handleSave,
        },
      ]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 20, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <SheetBodyTitle title="Calendar Name" />
        <ThemedText selectable style={{ fontSize: 14, opacity: 0.7 }}>
          Events will be created in this calendar
        </ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Enter calendar name"
          placeholderTextColor={isDark ? '#666' : '#999'}
          autoFocus
          style={{
            padding: 16,
            borderRadius: 12,
            borderCurve: 'continuous',
            fontSize: 16,
            backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
            color: isDark ? '#fff' : '#000',
          }}
        />
      </ScrollView>
    </SheetScreen>
  );
}
