import { Alert, type AlertButton, type AlertOptions } from 'react-native';

/**
 * Drop-in for `Alert.alert`.
 * Web uses `window.confirm` / `window.alert`. Native passes through unchanged.
 */
export function confirmAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions
) {
  if (process.env.EXPO_OS === 'web') {
    confirmOnWeb(title, message, buttons);
    return;
  }

  Alert.alert(title, message, buttons, options);
}

function confirmOnWeb(title: string, message?: string, buttons?: AlertButton[]) {
  const text = message ? `${title}\n\n${message}` : title;
  const buttonList = buttons ?? [];

  if (buttonList.length <= 1) {
    window.alert(text);
    buttonList[0]?.onPress?.();
    return;
  }

  const cancelButton = buttonList.find((button) => button.style === 'cancel');
  const actionButton =
    buttonList.find((button) => button.style === 'destructive') ??
    buttonList.find((button) => button !== cancelButton);

  if (window.confirm(text)) {
    actionButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
