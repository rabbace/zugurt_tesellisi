import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, PrimaryButton, Stepper } from '../components/ui';
import { formatTL } from '../format';
import { CartTotals } from '../pricing';
import { formatAddress } from '../store/useStore';
import { Address, CartItem, Economy } from '../types';

export function CartScreen({
  items,
  totals,
  economy,
  credit,
  address,
  couponCode,
  usableCouponCount,
  onQuantity,
  onRemove,
  onCheckout,
  onEarnCredit,
  onChangeAddress,
  onChooseCoupon,
}: {
  items: CartItem[];
  totals: CartTotals;
  economy: Economy;
  credit: number;
  address: Address | undefined;
  couponCode: string | null;
  usableCouponCount: number;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onEarnCredit: () => void;
  onChangeAddress: () => void;
  onChooseCoupon: () => void;
}) {
  if (items.length === 0) {
    return <EmptyState emoji="🛒" title="Sepetin boş" subtitle="Hayallerindeki ürünleri sepete ekle, sanal kredinle al." />;
  }

  const insufficient = totals.total > credit;
  const progress = Math.min(1, totals.subtotal / economy.freeShippingThreshold);

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
        {totals.remainingForFreeShipping > 0 && (
          <View className="bg-card rounded-2xl p-3 mb-3">
            <Text className="text-soft text-sm">
              <Text className="font-bold text-link">{formatTL(totals.remainingForFreeShipping)}</Text> daha ekle, kargo bedava olsun!
            </Text>
            <View className="h-2 bg-sunken rounded-full mt-2 overflow-hidden">
              <View className="h-2 bg-emerald-500 rounded-full" style={{ width: `${progress * 100}%` }} />
            </View>
          </View>
        )}

        {items.map((item) => (
          <View key={item.product.id} className="bg-card rounded-2xl p-3 mb-2 flex-row">
            <View className="bg-sunken rounded-xl w-20 h-20 items-center justify-center">
              <Text className="text-4xl">{item.product.emoji}</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-ink text-sm" numberOfLines={2}>
                <Text className="font-bold">{item.product.brand} </Text>
                {item.product.title}
              </Text>
              <Text className="text-muted text-xs mt-0.5">Satıcı: {item.product.seller}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <Stepper value={item.quantity} max={item.product.stock} onChange={(v) => onQuantity(item.product.id, v)} />
                <Text className="text-link text-base font-extrabold">{formatTL(item.product.price * item.quantity)}</Text>
              </View>
            </View>
            <Pressable onPress={() => onRemove(item.product.id)} className="pl-2 active:opacity-50" hitSlop={8}>
              <Text className="text-muted text-lg">✕</Text>
            </Pressable>
          </View>
        ))}

        <Pressable onPress={onChooseCoupon} className="bg-card rounded-2xl p-4 mt-1 flex-row items-center active:opacity-70">
          <Text className="text-2xl mr-3">🎟️</Text>
          <View className="flex-1">
            <Text className="text-ink text-base font-bold">
              {couponCode ? `${couponCode} uygulandı` : 'Kupon kullan'}
            </Text>
            <Text className={`text-sm ${couponCode ? 'text-emerald-600 font-bold' : 'text-muted'}`}>
              {couponCode ? `-${formatTL(totals.discount)} indirim` : `${usableCouponCount} kullanılabilir kuponun var`}
            </Text>
          </View>
          <Text className="text-muted text-lg">›</Text>
        </Pressable>

        <Pressable onPress={onChangeAddress} className="bg-card rounded-2xl p-4 mt-2 active:opacity-70">
          <View className="flex-row items-center justify-between">
            <Text className="text-ink text-base font-bold">📍 Teslimat adresi{address ? ` · ${address.title}` : ''}</Text>
            <Text className="text-link text-sm font-bold">Değiştir</Text>
          </View>
          {address ? (
            <Text className="text-soft text-sm mt-1">
              {address.fullName} · {formatAddress(address)}
            </Text>
          ) : (
            <Text className="text-red-600 text-sm mt-1">Adres eklemen gerekiyor.</Text>
          )}
          <Text className="text-ink text-base font-bold mt-3">💳 Ödeme yöntemi</Text>
          <Text className="text-soft text-sm mt-0.5">Sanal Kredi · Bakiye: {formatTL(credit)}</Text>
        </Pressable>
      </ScrollView>

      <View className="bg-card border-t border-line px-4 pt-3 pb-4">
        <View className="flex-row justify-between">
          <Text className="text-muted text-sm">Ürünler</Text>
          <Text className="text-soft text-sm">{formatTL(totals.subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-muted text-sm">Kargo</Text>
          <Text className={`text-sm ${totals.shippingFee === 0 ? 'text-emerald-600 font-bold' : 'text-soft'}`}>
            {totals.shippingFee === 0 ? 'Bedava' : formatTL(totals.shippingFee)}
          </Text>
        </View>
        {totals.discount > 0 && (
          <View className="flex-row justify-between mt-1">
            <Text className="text-muted text-sm">Kupon indirimi</Text>
            <Text className="text-emerald-600 text-sm font-bold">-{formatTL(totals.discount)}</Text>
          </View>
        )}
        <View className="flex-row justify-between mt-2 mb-3">
          <Text className="text-ink text-base font-bold">Toplam</Text>
          <Text className="text-link font-extrabold text-lg">{formatTL(totals.total)}</Text>
        </View>
        {insufficient ? (
          <View className="gap-2">
            <Text className="text-red-600 text-sm text-center">Kredin yetersiz: {formatTL(totals.total - credit)} eksik.</Text>
            <PrimaryButton label="🎬 Reklam izle, kredi kazan" variant="gold" onPress={onEarnCredit} />
          </View>
        ) : (
          <PrimaryButton label="Siparişi Onayla" disabled={!address} onPress={onCheckout} />
        )}
      </View>
    </View>
  );
}
