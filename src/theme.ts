// Karakter: mahalle çarşısında tezgâhı derli toplu, şakacı ama özenli bir esnaf.
// Sıcak, toprak tonlu, acele ettirmeyen; indirimi bağırmadan gösterir.

import * as SystemUI from 'expo-system-ui';
import { colorScheme, useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Appearance, Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

// global.css'teki CSS değişkenleriyle aynı değerler; JS tarafında (ikon, StatusBar, Switch) kullanılır.
export const THEME_COLORS: Record<
  Scheme,
  { page: string; card: string; ink: string; soft: string; muted: string; line: string; link: string; brand: string; paper: string }
> = {
  light: {
    page: '#F4EFE8',
    card: '#FBF8F3',
    ink: '#3B342E',
    soft: '#5E554C',
    muted: '#7A7066',
    line: '#E4DBCF',
    link: '#9A5A3A',
    brand: '#A8623F',
    paper: '#FBF8F3',
  },
  dark: {
    page: '#1F1B18',
    card: '#29241F',
    ink: '#EDE6DC',
    soft: '#D2C8BC',
    muted: '#A39A8F',
    line: '#3D362F',
    link: '#E2A884',
    brand: '#A8623F',
    paper: '#FBF8F3',
  },
};

export const MOTION = {
  fast: 200,
  base: 260,
};

export const FONT_FILES = {
  Manrope_500Medium: require('@expo-google-fonts/manrope/Manrope_500Medium.ttf'),
  Manrope_600SemiBold: require('@expo-google-fonts/manrope/Manrope_600SemiBold.ttf'),
  Manrope_700Bold: require('@expo-google-fonts/manrope/Manrope_700Bold.ttf'),
  Manrope_800ExtraBold: require('@expo-google-fonts/manrope/Manrope_800ExtraBold.ttf'),
  Fraunces_700Bold: require('@expo-google-fonts/fraunces/Fraunces_700Bold.ttf'),
};

export function greeting(now: number): string {
  const d = new Date(now);
  const h = d.getHours();
  const part =
    h < 6 ? 'Gece kuşu musun' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : h < 22 ? 'İyi akşamlar' : 'Geç oldu ama';
  if (d.getMonth() === 10 && d.getDate() >= 23 && d.getDate() <= 30) return `${part}. Kara Cuma haftası, sepeti yavaş doldur.`;
  if (d.getMonth() === 10) return `${part}. Kasım indirimleri sürüyor, acele yok.`;
  return `${part}. Bugün kendine ne alıyoruz?`;
}

export function useApplyTheme(mode: ThemeMode): Scheme {
  useEffect(() => {
    // Native: 'system' NativeWind'e bırakılır; web'de sınıf tabanlı olduğu için sistemi biz çözümleriz.
    if (Platform.OS !== 'web') {
      colorScheme.set(mode);
      return;
    }
    const apply = () => colorScheme.set(mode === 'system' ? (Appearance.getColorScheme() ?? 'light') : mode);
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
