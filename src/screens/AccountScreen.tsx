import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '../components/ui';
import { formatDateTime, formatTL } from '../format';
import { Catalog } from '../types';

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
  address,
  lastFetchedAt,
  onWatchAd,
  onFastMode,
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
  address: string;
  lastFetchedAt: number | null;
  onWatchAd: () => void;
  onFastMode: (value: boolean) => void;
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
        <Text className="text-brand-light text-[11px] mt-1">Gerçek para değildir, hiçbir şey gerçekten satın alınmaz.</Text>
        <View className="mt-4">
          <PrimaryButton label={adLabel} variant="gold" onPress={onWatchAd} disabled={adLoading || adCooldownLeft > 0} />
        </View>
        {isSimulatedAd && (
          <Text className="text-brand-light text-[10px] mt-2 text-center">
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
            <View className="bg-white rounded-2xl p-3">
              <Text className="text-slate-500 text-[11px]">{s.label}</Text>
              <Text className="text-slate-900 font-extrabold text-base mt-1" numberOfLines={1}>{s.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="bg-white rounded-2xl p-4 mt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-slate-900 font-bold">⏩ Hızlı kargo modu</Text>
            <Text className="text-slate-500 text-xs mt-0.5">
              Açıkken 1 gün = 2 dakika. Kapalıyken kargo gerçek hayattaki gibi günler sürer. Yeni siparişleri etkiler.
            </Text>
          </View>
          <Switch value={fastMode} onValueChange={onFastMode} trackColor={{ true: '#6D28D9', false: '#CBD5E1' }} thumbColor="#FFFFFF" />
        </View>
      </View>

      <View className="bg-white rounded-2xl p-4 mt-2">
        <Text className="text-slate-900 font-bold mb-2">📍 Teslimat adresi</Text>
        <TextInput
          value={draftAddress}
          onChangeText={setDraftAddress}
          multiline
          className="border border-slate-200 rounded-xl px-3 py-2 text-slate-900 text-sm"
        />
        {draftAddress.trim() !== address && draftAddress.trim().length > 0 && (
          <View className="mt-2">
            <PrimaryButton label="Adresi kaydet" variant="outline" onPress={() => onAddress(draftAddress.trim())} />
          </View>
        )}
      </View>

      <View className="bg-white rounded-2xl p-4 mt-2">
        <Text className="text-slate-900 font-bold">🗂️ Ürün kataloğu</Text>
        <Text className="text-slate-500 text-xs mt-1">
          {catalog.products.length} ürün · Fiyatlar {catalog.updatedAt} tarihli
          {catalogSource === 'remote' && lastFetchedAt ? ` · Son güncelleme ${formatDateTime(lastFetchedAt)}` : ' · Uygulama içi kopya'}
        </Text>
        <Pressable onPress={onRefreshCatalog} className="mt-2 active:opacity-50">
          <Text className="text-brand font-bold text-sm">Fiyatları güncelle</Text>
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
