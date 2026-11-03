import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../components/ui';
import { formatDateTime, formatTL } from '../format';
import { ThemeMode } from '../theme';
import { Catalog } from '../types';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: '☀️ Açık' },
  { value: 'dark', label: '🌙 Koyu' },
];

export function AccountScreen({
  credit,
  catalog,
  catalogSource,
  dopaminePoints,
  totalSpent,
  orderCount,
  adsWatched,
  adCooldownLeft,
  adLoading,
  isSimulatedAd,
  fastMode,
  theme,
  switchOffColor,
  address,
  lastFetchedAt,
  onWatchAd,
  onFastMode,
  onTheme,
  onAddress,
  onRefreshCatalog,
  onReset,
}: {
  credit: number;
  catalog: Catalog;
  catalogSource: 'bundled' | 'remote';
  dopaminePoints: number;
  totalSpent: number;
  orderCount: number;
  adsWatched: number;
  adCooldownLeft: number;
  adLoading: boolean;
  isSimulatedAd: boolean;
  fastMode: boolean;
  theme: ThemeMode;
  switchOffColor: string;
  address: string;
  lastFetchedAt: number | null;
  onWatchAd: () => void;
  onFastMode: (value: boolean) => void;
  onTheme: (value: ThemeMode) => void;
  onAddress: (value: string) => void;
  onRefreshCatalog: () => void;
  onReset: () => void;
}) {
  const [draftAddress, setDraftAddress] = useState(address);
  const [confirmReset, setConfirmReset] = useState(false);

  const adLabel = adLoading
    ? isSimulatedAd
      ? '🎬 Reklam oynatılıyor...'
      : '🎬 Reklam yükleniyor...'
    : adCooldownLeft > 0
      ? `Sonraki reklam ${adCooldownLeft} sn sonra`
      : `🎬 Reklam izle, +${formatTL(catalog.economy.adReward)} kazan`;

  return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View className="bg-brand rounded-2xl p-5">
        <Text className="text-brand-light text-xs">Sanal kredin</Text>
        <Text className="text-white text-3xl font-extrabold mt-1">{formatTL(credit)}</Text>
        <Text className="text-brand-light text-xs mt-1">Gerçek para değildir, hiçbir şey gerçekten satın alınmaz.</Text>
        <View className="mt-4">
          <PrimaryButton label={adLabel} variant="gold" onPress={onWatchAd} disabled={adLoading || adCooldownLeft > 0} />
        </View>
        {isSimulatedAd && (
          <Text className="text-brand-light text-2xs mt-2 text-center">
            Web önizlemede reklam simüle edilir. Android uygulamasında gerçek ödüllü reklam gösterilir.
          </Text>
        )}
      </View>

      <View className="flex-row flex-wrap -mx-1 mt-2">
        {[
          { label: 'Teselli puanı', value: `🧠 ${dopaminePoints}` },
          { label: 'Toplam harcama', value: formatTL(totalSpent) },
          { label: 'Sipariş', value: orderCount.toString() },
          { label: 'İzlenen reklam', value: adsWatched.toString() },
        ].map((s) => (
          <View key={s.label} className="w-1/2 p-1">
            <View className="bg-card rounded-2xl p-3">
              <Text className="text-muted text-xs">{s.label}</Text>
              <Text className="text-ink font-extrabold text-base mt-1" numberOfLines={1}>{s.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="bg-card rounded-2xl p-4 mt-2">
        <Text className="text-ink text-base font-bold">🌓 Görünüm</Text>
        <View className="flex-row bg-sunken rounded-xl p-1 mt-3">
          {THEME_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              onPress={() => onTheme(o.value)}
              className={`flex-1 items-center py-2 rounded-lg ${theme === o.value ? 'bg-brand' : ''}`}
            >
              <Text className={`text-sm font-semibold ${theme === o.value ? 'text-white' : 'text-soft'}`}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="bg-card rounded-2xl p-4 mt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-ink text-base font-bold">⏩ Hızlı kargo modu</Text>
            <Text className="text-muted text-xs mt-0.5">
              Açıkken 1 gün = 2 dakika. Kapalıyken kargo gerçek hayattaki gibi günler sürer. Yeni siparişleri etkiler.
            </Text>
          </View>
          <Switch value={fastMode} onValueChange={onFastMode} trackColor={{ true: '#6D28D9', false: switchOffColor }} thumbColor="#FFFFFF" />
        </View>
      </View>

      <View className="bg-card rounded-2xl p-4 mt-2">
        <Text className="text-ink text-base font-bold mb-2">📍 Teslimat adresi</Text>
        <TextInput
          value={draftAddress}
          onChangeText={setDraftAddress}
          multiline
          className="border border-line rounded-xl px-3 py-2 text-ink text-sm"
        />
        {draftAddress.trim() !== address && draftAddress.trim().length > 0 && (
          <View className="mt-2">
            <PrimaryButton label="Adresi kaydet" variant="outline" onPress={() => onAddress(draftAddress.trim())} />
          </View>
        )}
      </View>

      <View className="bg-card rounded-2xl p-4 mt-2">
        <Text className="text-ink text-base font-bold">🗂️ Ürün kataloğu</Text>
        <Text className="text-muted text-xs mt-1">
          {catalog.products.length} ürün · Fiyatlar {catalog.updatedAt} tarihli
          {catalogSource === 'remote' && lastFetchedAt ? ` · Son güncelleme ${formatDateTime(lastFetchedAt)}` : ' · Uygulama içi kopya'}
        </Text>
        <Pressable onPress={onRefreshCatalog} className="mt-2 active:opacity-50">
          <Text className="text-link font-bold text-sm">Fiyatları güncelle</Text>
        </Pressable>
      </View>

      <View className="mt-4">
        {confirmReset ? (
          <View className="gap-2">
            <Text className="text-red-600 text-xs text-center">Tüm siparişler, sepet ve kredi sıfırlanacak. Emin misin?</Text>
            <PrimaryButton label="Evet, sıfırla" variant="danger" onPress={() => { setConfirmReset(false); onReset(); }} />
            <PrimaryButton label="Vazgeç" variant="outline" onPress={() => setConfirmReset(false)} />
          </View>
        ) : (
          <PrimaryButton label="Hesabı sıfırla" variant="danger" onPress={() => setConfirmReset(true)} />
        )}
      </View>
    </ScrollView>
  );
}
