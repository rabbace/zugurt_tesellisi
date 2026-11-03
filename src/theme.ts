import * as SystemUI from 'expo-system-ui';
import { colorScheme, useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Appearance, Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

export const THEME_COLORS: Record<Scheme, { page: string; card: string; muted: string; line: string; brand: string }> = {
  light: { page: '#F4F4F6', card: '#FFFFFF', muted: '#64748B', line: '#E2E8F0', brand: '#6D28D9' },
  dark: { page: '#0A0A10', card: '#1A1A24', muted: '#9CA3B4', line: '#343446', brand: '#8B5CF6' },
};

export function useApplyTheme(mode: ThemeMode): Scheme {
  useEffect(() => {
    // Native: 'system' NativeWind'e bırakılır; web'de sınıf tabanlı olduğu için sistemi biz çözümleriz.
    if (Platform.OS !== 'web') {
      colorScheme.set(mode);
      return;
    }
    const apply = () =>
      colorScheme.set(mode === 'system' ? (Appearance.getColorScheme() ?? 'light') : mode);
    apply();
    if (mode !== 'system') return;
    const sub = Appearance.addChangeListener(apply);
    return () => sub.remove();
  }, [mode]);

  const scheme: Scheme = useColorScheme().colorScheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(THEME_COLORS[scheme].page).catch(() => undefined);
  }, [scheme]);

  return scheme;
}
