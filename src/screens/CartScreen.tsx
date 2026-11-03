import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, PrimaryButton, Stepper } from '../components/ui';
import { formatTL } from '../format';
import { CartTotals } from '../store/useStore';
import { CartItem, Economy } from '../types';

export function CartScreen({
  items,
  totals,
  economy,
  credit,
  address,
  onQuantity,
  onRemove,
  onCheckout,
  onEarnCredit,
}: {
  items: CartItem[];
  totals: CartTotals;
  economy: Economy;
  credit: number;
  address: string;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
  onEarnCredit: () => void;
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
          <View className="bg-white rounded-2xl p-3 mb-3">
            <Text className="text-slate-700 text-xs">
              <Text className="font-bold text-brand">{formatTL(totals.remainingForFreeShipping)}</Text> daha ekle, kargo bedava olsun!
            </Text>
            <View className="h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <View className="h-2 bg-emerald-500 rounded-full" style={{ width: `${progress * 100}%` }} />
            </View>
          </View>
        )}

        {items.map((item) => (
          <View key={item.product.id} className="bg-white rounded-2xl p-3 mb-2 flex-row">
            <View className="bg-slate-50 rounded-xl w-20 h-20 items-center justify-center">
              <Text className="text-4xl">{item.product.emoji}</Text>
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-slate-900 text-xs" numberOfLines={2}>
                <Text className="font-bold">{item.product.brand} </Text>
                {item.product.title}
              </Text>
              <Text className="text-slate-400 text-[11px] mt-0.5">Satıcı: {item.product.seller}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <Stepper
                  value={item.quantity}
                  max={item.product.stock}
                  onChange={(v) => onQuantity(item.product.id, v)}
                />
                <Text className="text-brand font-extrabold">{formatTL(item.product.price * item.quantity)}</Text>
              </View>
            </View>
            <Pressable onPress={() => onRemove(item.product.id)} className="pl-2 active:opacity-50">
              <Text className="text-slate-400 text-lg">✕</Text>
            </Pressable>
          </View>
        ))}

        <View className="bg-white rounded-2xl p-3 mt-1">
          <Text className="text-slate-900 font-bold mb-1">📍 Teslimat adresi</Text>
          <Text className="text-slate-600 text-xs">{address}</Text>
          <Text className="text-slate-900 font-bold mt-3 mb-1">💳 Ödeme yöntemi</Text>
          <Text className="text-slate-600 text-xs">Sanal Kredi · Bakiye: {formatTL(credit)}</Text>
        </View>
      </ScrollView>

      <View className="bg-white border-t border-slate-100 px-4 pt-3 pb-4">
        <View className="flex-row justify-between">
          <Text className="text-slate-500 text-xs">Ürünler</Text>
          <Text className="text-slate-700 text-xs">{formatTL(totals.subtotal)}</Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text className="text-slate-500 text-xs">Kargo</Text>
          <Text className={`text-xs ${totals.shippingFee === 0 ? 'text-emerald-600 font-bold' : 'text-slate-700'}`}>
            {totals.shippingFee === 0 ? 'Bedava' : formatTL(totals.shippingFee)}
          </Text>
        </View>
        <View className="flex-row justify-between mt-2 mb-3">
          <Text className="text-slate-900 font-bold">Toplam</Text>
          <Text className="text-brand font-extrabold text-lg">{formatTL(totals.total)}</Text>
        </View>
        {insufficient ? (
          <View className="gap-2">
            <Text className="text-red-600 text-xs text-center">
              Kredin yetersiz: {formatTL(totals.total - credit)} eksik.
            </Text>
            <PrimaryButton label="🎬 Reklam izle, kredi kazan" variant="gold" onPress={onEarnCredit} />
          </View>
        ) : (
          <PrimaryButton label="Siparişi Onayla" onPress={onCheckout} />
        )}
      </View>
    </View>
  );
}
