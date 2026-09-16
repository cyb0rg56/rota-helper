import { useFonts } from 'expo-font';

export function useWebIconFonts(): [boolean, Error | null] {
  return useFonts({
    MaterialDesignIcons: require('@react-native-vector-icons/material-design-icons/fonts/MaterialDesignIcons.ttf'),
  });
}
