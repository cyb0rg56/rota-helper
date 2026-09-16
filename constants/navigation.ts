const isIOS = process.env.EXPO_OS === 'ios';
export const isWeb = process.env.EXPO_OS === 'web';

/**
 * Large transparent headers rely on iOS `contentInsetAdjustmentBehavior`.
 * Android ignores that inset, so the same options draw content under the
 * app bar and steal taps from header actions.
 */
export const nativeStackScreenOptions = {
  headerShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal' as const,
  headerTransparent: isIOS,
  headerLargeTitle: isIOS,
  ...(isIOS
    ? {
        headerLargeTitleShadowVisible: false,
        headerLargeStyle: { backgroundColor: 'transparent' as const },
        headerBlurEffect: 'none' as const,
      }
    : {}),
};

export const formSheetScreenOptions = {
  presentation: 'formSheet' as const,
  headerBackVisible: false,
  headerTransparent: isIOS,
  ...(isIOS
    ? {
        sheetGrabberVisible: true,
        contentStyle: { backgroundColor: 'transparent' as const },
      }
    : {}),
  ...(isWeb ? { headerShown: false } : {}),
};

/** Compact sheets keep a half-height first detent on iOS (Save is in the header). */
export const compactSheetDetents = isIOS ? [0.55, 1] : [1];

/** Single-field sheets. Android footers need enough height to stay on screen. */
export const smallSheetDetents = isIOS ? [0.35] : [0.55];
