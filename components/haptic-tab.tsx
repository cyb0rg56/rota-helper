import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

import type { BottomTabBarButtonProps } from 'expo-router/js-tabs';

export function HapticTab({ ref: _ref, onPressIn, ...props }: BottomTabBarButtonProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    />
  );
}
