import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons';
import type { ComponentProps } from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

type MdName = ComponentProps<typeof MaterialDesignIcons>['name'];

export function Icon({
  md,
  size = 24,
  color,
}: {
  sf: SFSymbol;
  md: MdName;
  size?: number;
  color: string;
}) {
  return (
    <MaterialDesignIcons
      name={md}
      size={size}
      color={color}
      accessible={false}
    />
  );
}
