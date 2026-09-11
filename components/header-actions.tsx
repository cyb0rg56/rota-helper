import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Stack } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';

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
 * Header toolbar actions that work on both platforms.
 *
 * `Stack.Toolbar.Button` only renders on Android when given an
 * `ImageSourcePropType` icon, so text labels and SF Symbols silently disappear
 * there. On Android we render the actions ourselves through `asChild` instead.
 */
export function HeaderActions({
  placement,
  actions,
}: {
  placement: 'left' | 'right';
  actions: HeaderAction[];
}) {
  if (process.env.EXPO_OS === 'ios') {
    return (
      <Stack.Toolbar placement={placement}>
        {actions.map((action) => (
          <Stack.Toolbar.Button
            key={action.key}
            icon={action.sf}
            onPress={action.onPress}
            disabled={action.disabled}
            tintColor={action.destructive ? DESTRUCTIVE_COLOR : undefined}
            variant={action.prominent ? 'done' : 'plain'}
          >
            {action.sf ? undefined : action.label}
          </Stack.Toolbar.Button>
        ))}
      </Stack.Toolbar>
    );
  }

  return (
    <Stack.Toolbar placement={placement} asChild>
      <View collapsable={false} style={{ flexDirection: 'row', alignItems: 'center' }}>
        {actions.map(({ key, ...action }) => (
          <AndroidHeaderAction key={key} {...action} />
        ))}
      </View>
    </Stack.Toolbar>
  );
}

/**
 * Form-sheet chrome. iOS keeps Cancel/Save in the native header. Android
 * Material bottom sheets do not paint custom header items, so the same
 * actions are rendered as an in-sheet footer instead.
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
  if (process.env.EXPO_OS === 'ios') {
    return (
      <>
        {children}
        {left.length > 0 ? <HeaderActions placement="left" actions={left} /> : null}
        <HeaderActions placement="right" actions={right} />
      </>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {children}
      <AndroidSheetFooter actions={[...left, ...right]} />
    </View>
  );
}

function AndroidSheetFooter({ actions }: { actions: HeaderAction[] }) {
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
        <AndroidHeaderAction key={key} footer {...action} />
      ))}
    </View>
  );
}

function AndroidHeaderAction({
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

  if (footer && prominent) {
    return (
      <Pressable
        onPress={onPress}
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
      onPress={onPress}
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
        <MaterialDesignIcons name={md} size={24} color={color} />
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
