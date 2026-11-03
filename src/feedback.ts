import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const SUCCESS_SOUND_URI = 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';

let sound: Audio.Sound | null = null;

export async function playSuccess(): Promise<void> {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }
  try {
    if (sound) await sound.unloadAsync();
    sound = (await Audio.Sound.createAsync({ uri: SUCCESS_SOUND_URI })).sound;
    await sound.playAsync();
  } catch {
    // Ses yüklenemezse (çevrimdışı vb.) titreşim ve bildirim yeterli.
  }
}

export function tap(): void {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}
