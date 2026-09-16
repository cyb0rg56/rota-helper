import { createElement } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

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
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <ThemedText style={{ fontSize: 14, fontWeight: '600', opacity: 0.8 }}>{label}</ThemedText>
      {createElement('input', {
        type: 'time',
        step: 1800,
        value,
        'aria-label': label,
        onChange: (event: { target: { value: string } }) => {
          const next = event.target.value;
          if (next) {
            onChange(next.slice(0, 5));
          }
        },
        style: {
          padding: 16,
          borderRadius: 12,
          border: 'none',
          outline: 'none',
          fontSize: 16,
          fontVariantNumeric: 'tabular-nums',
          backgroundColor: isDark ? '#2d2d44' : '#f8f9fa',
          color: isDark ? '#fff' : '#000',
          colorScheme: isDark ? 'dark' : 'light',
          width: '100%',
          boxSizing: 'border-box',
        },
      })}
    </View>
  );
}
