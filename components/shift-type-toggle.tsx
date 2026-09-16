import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ShiftType } from '@/types';

export function ShiftTypeToggle({
  value,
  onChange,
  isDark,
  accessibilityLabel = 'Shift type',
}: {
  value: ShiftType;
  onChange: (type: ShiftType) => void;
  isDark: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        borderCurve: 'continuous',
        backgroundColor: isDark ? '#303047' : '#e8eaed',
      }}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {(['primary', 'secondary'] as ShiftType[]).map((type) => {
        const selected = value === type;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            accessibilityRole="radio"
            accessibilityLabel={`${type === 'primary' ? 'Primary' : 'Secondary'} shift mode`}
            accessibilityState={{ selected, checked: selected }}
            android_ripple={{ color: 'rgba(78,205,196,0.24)' }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 9,
              backgroundColor: selected ? '#4ECDC4' : 'transparent',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <ThemedText
              style={{
                fontSize: 14,
                fontWeight: selected ? '700' : '500',
                color: selected ? '#073b3a' : isDark ? '#f0f2f5' : '#1a1a2e',
              }}
            >
              {type === 'primary' ? 'Primary' : 'Secondary'}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}
