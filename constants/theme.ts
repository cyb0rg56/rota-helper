/**
 * Rota Helper Theme Configuration
 * A distinctive color palette for staff scheduling
 */

import { Platform } from 'react-native';

// Primary accent colors
const primaryTeal = '#4ECDC4';
const primaryCoral = '#FF6B6B';

export const Colors = {
  light: {
    text: '#1a1a2e',
    background: '#fafbfc',
    tint: primaryTeal,
    icon: '#5a6270',
    tabIconDefault: '#8a929e',
    tabIconSelected: primaryTeal,
    card: '#ffffff',
    border: '#e8eaed',
    accent: primaryTeal,
    danger: primaryCoral,
  },
  dark: {
    text: '#f0f2f5',
    background: '#0f0f1a',
    tint: primaryTeal,
    icon: '#9ba1a8',
    tabIconDefault: '#6b7280',
    tabIconSelected: primaryTeal,
    card: '#1a1a2e',
    border: '#2d2d44',
    accent: primaryTeal,
    danger: primaryCoral,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
