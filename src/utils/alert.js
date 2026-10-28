import { Alert, Platform } from 'react-native';

export const showCustomAlert = (title, message, buttons) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      // Confirmation dialog
      const confirmed = window.confirm(`${title}\n\n${message || ''}`);
      if (confirmed) {
        const okBtn = buttons.find((b) => b.style !== 'cancel' && b.onPress);
        if (okBtn && okBtn.onPress) okBtn.onPress();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel' && b.onPress);
        if (cancelBtn && cancelBtn.onPress) cancelBtn.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message || ''}`);
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress();
      }
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};
