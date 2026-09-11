import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

type MdName = ComponentProps<typeof MaterialDesignIcons>['name'];

export function Icon({
  sf,
  md,
  size = 24,
  color,
}: {
  sf: SFSymbol;
  md: MdName;
  size?: number;
  color: string;
}) {
  if (process.env.EXPO_OS === 'ios') {
    return (
      <Image
        source={`sf:${sf}`}
        style={{ width: size, height: size }}
        tintColor={color}
        contentFit="contain"
      />
    );
  }

  return <MaterialDesignIcons name={md} size={size} color={color} />;
}
