import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function SheetBodyTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ gap: 2, paddingHorizontal: 4 }}>
      <ThemedText type="title" style={{ fontSize: 28, lineHeight: 34 }}>
        {title}
      </ThemedText>
      {subtitle ? <ThemedText style={{ opacity: 0.65 }}>{subtitle}</ThemedText> : null}
    </View>
  );
}
