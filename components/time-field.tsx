import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { dateToTime, timeToDate } from '@/utils/time';

export function TimeField({
  label,
  value,
  onChange,
  isDark,
}: {
  label: string;
  value: string;
  onChange: (time: string) => void;
  isDark: boolean;
}) {
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const handleValueChange = (_event: DateTimePickerChangeEvent, selectedDate: Date) => {
    if (process.env.EXPO_OS === 'android') {
      setShowAndroidPicker(false);
    }
    onChange(dateToTime(selectedDate));
  };

  const handleDismiss = () => {
    if (process.env.EXPO_OS === 'android') {
      setShowAndroidPicker(false);
    }
  };

  if (process.env.EXPO_OS === 'ios') {
    return (
      <View
        style={{
          flex: 1,
          gap: 8,
        }}
      >
        <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
          {label}
        </ThemedText>
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          display="compact"
          minuteInterval={30}
          themeVariant={isDark ? 'dark' : 'light'}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, gap: 8 }}>
      <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setShowAndroidPicker(true)}
        style={{
          padding: 16,
          borderRadius: 12,
          borderCurve: 'continuous',
          backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
        }}
      >
        <ThemedText style={{ fontSize: 16, fontVariant: ['tabular-nums'] }} selectable>
          {value}
        </ThemedText>
      </Pressable>
      {showAndroidPicker ? (
        <DateTimePicker
          value={timeToDate(value)}
          mode="time"
          display="default"
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
        />
      ) : null}
    </View>
  );
}
