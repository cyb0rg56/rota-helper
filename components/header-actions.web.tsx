import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import { Stack } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';

import { blurActiveElement } from '@/utils/focus';

type MdName = ComponentProps<typeof MaterialDesignIcons>['name'];

export type HeaderAction = {
  key: string;
  /** Text shown when no icon is provided for the platform. */
  label: string;
  sf?: SFSymbol;
  md?: MdName;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /** Renders as the confirming action (bold / `done` variant). */
  prominent?: boolean;
};

const TINT_COLOR = '#4ECDC4';
const DESTRUCTIVE_COLOR = '#FF3B30';
const DISABLED_COLOR = '#9aa0a6';

/**
 * Web header actions. Native iOS/Android continue to use `header-actions.tsx`.
 * Stack.Toolbar `asChild` maps these into `headerRight` / `headerLeft`.
 */
export function HeaderActions({
  placement,
  actions,
}: {
  placement: 'left' | 'right';
  actions: HeaderAction[];
}) {
  return (
    <Stack.Toolbar placement={placement} asChild>
      <View collapsable={false} style={{ flexDirection: 'row', alignItems: 'center' }}>
        {actions.map(({ key, ...action }) => (
          <WebHeaderAction key={key} {...action} />
        ))}
      </View>
    </Stack.Toolbar>
  );
}

/**
 * Form-sheet chrome on web: Cancel/Save as an in-sheet footer, matching Android.
 */
export function SheetScreen({
  children,
  left = [],
  right,
}: {
  children: ReactNode;
  left?: HeaderAction[];
  right: HeaderAction[];
}) {
  return (
    <View style={{ flex: 1 }}>
      {children}
      <WebSheetFooter actions={[...left, ...right]} />
    </View>
  );
}

function WebSheetFooter({ actions }: { actions: HeaderAction[] }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {actions.map(({ key, ...action }) => (
        <WebHeaderAction key={key} footer {...action} />
      ))}
    </View>
  );
}

function WebHeaderAction({
  label,
  md,
  onPress,
  disabled,
  destructive,
  prominent,
  footer,
}: Omit<HeaderAction, 'key'> & { footer?: boolean }) {
  const color = disabled
    ? DISABLED_COLOR
    : destructive
      ? DESTRUCTIVE_COLOR
      : TINT_COLOR;
  const handlePress = () => {
    blurActiveElement();
    onPress();
  };

  if (footer && prominent) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 48,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: disabled ? DISABLED_COLOR : TINT_COLOR,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        minWidth: 48,
        minHeight: 48,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {md ? (
        <MaterialDesignIcons
          name={md}
          size={24}
          color={color}
          accessible={false}
        />
      ) : (
        <Text
          style={{
            color,
            fontSize: 16,
            fontWeight: prominent ? '700' : '500',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
