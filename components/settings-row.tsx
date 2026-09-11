import { Pressable, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ComponentProps } from 'react';

type IconProps = ComponentProps<typeof Icon>;

export function SettingsRow({
  sf,
  md,
  iconColor,
  label,
  value,
  onPress,
  showArrow = true,
  destructive = false,
}: {
  sf: IconProps['sf'];
  md: IconProps['md'];
  iconColor?: string;
  label: string;
  value?: string;
  onPress: () => void;
  showArrow?: boolean;
  destructive?: boolean;
}) {
  const isDark = useColorScheme() === 'dark';
  const color = iconColor ?? (isDark ? '#fff' : '#333');

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        <Icon sf={sf} md={md} size={22} color={color} />
        <ThemedText
          selectable
          style={[{ fontSize: 16 }, destructive ? { color: '#FF6B6B' } : null]}
        >
          {label}
        </ThemedText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? (
          <ThemedText selectable style={{ fontSize: 14, opacity: 0.6 }}>
            {value}
          </ThemedText>
        ) : null}
        {showArrow ? (
          <Icon sf="chevron.right" md="chevron-right" size={20} color={isDark ? '#666' : '#999'} />
        ) : null}
      </View>
    </Pressable>
  );
}
