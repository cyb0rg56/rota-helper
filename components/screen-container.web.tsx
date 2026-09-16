import type { ReactNode } from 'react';
import { View } from 'react-native';

export function ScreenContainer({ children }: { children: ReactNode }) {
  return (
    <View style={{ flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
      {children}
    </View>
  );
}
