import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { PriceBlock, PrimaryButton, Rating, Stepper } from '../components/ui';
import { formatDay, formatTL } from '../format';
import { REAL_DAY_MS } from '../orders/simulate';
import { Category, Economy, Product } from '../types';

export function ProductDetail({
  product,
  category,
  economy,
  onClose,
  onAdd,
  onBuyNow,
}: {
  product: Product | null;
  category: Category | undefined;
  economy: Economy;
  onClose: () => void;
  onAdd: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => setQuantity(1), [product?.id]);

  if (!product) return null;
  const now = Date.now();
  const earliest = formatDay(now + product.deliveryDays[0] * REAL_DAY_MS);
  const latest = formatDay(now + product.deliveryDays[1] * REAL_DAY_MS);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-page">
        <View className="flex-row items-center px-3 pt-10 pb-3 bg-card border-b border-line">
          <Pressable onPress={onClose} className="px-2 py-1 active:opacity-50">
            <Text className="text-link text-base font-bold">‹ Geri</Text>
          </Pressable>
          <Text className="text-muted text-xs ml-2">
            {category ? `${category.emoji} ${category.name}` : ''}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="bg-card items-center justify-center h-64">
            <Text style={{ fontSize: 120 }}>{product.emoji}</Text>
          </View>

          <View className="bg-card px-4 pb-4">
            <Text className="text-ink text-lg">
              <Text className="font-extrabold">{product.brand} </Text>
              {product.title}
            </Text>
            <View className="mt-1">
              <Rating rating={product.rating} count={product.reviewCount} />
            </View>
            <View className="mt-3">
              <PriceBlock price={product.price} originalPrice={product.originalPrice} large />
            </View>
          </View>

          <View className="bg-card mt-2 px-4 py-3 gap-2">
            <Text className="text-soft text-sm">
              🚚 Tahmini teslimat: <Text className="font-bold">{earliest}</Text>
              {earliest !== latest ? ` – ${latest}` : ''}
            </Text>
            <Text className="text-soft text-sm">
              {product.freeShipping
                ? '✅ Kargo bedava'
                : `📦 ${formatTL(economy.freeShippingThreshold)} üzeri kargo bedava, altı ${formatTL(economy.shippingFee)}`}
            </Text>
            <Text className="text-soft text-sm">
              🏪 Satıcı: <Text className="font-bold">{product.seller}</Text>
            </Text>
            <Text className={`text-sm ${product.stock <= 10 ? 'text-orange-600 font-bold' : 'text-soft'}`}>
              {product.stock <= 10 ? `⏳ Tükenmek üzere! Son ${product.stock} ürün` : '📦 Stokta var'}
            </Text>
          </View>

          <View className="bg-card mt-2 px-4 py-3">
            <Text className="text-ink text-base font-bold mb-1">Ürün açıklaması</Text>
            <Text className="text-soft text-sm leading-5">{product.description}</Text>
          </View>
        </ScrollView>

        <View className="bg-card border-t border-line px-4 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-soft text-sm">Adet</Text>
            <Stepper value={quantity} max={product.stock} onChange={(v) => setQuantity(Math.max(1, v))} />
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <PrimaryButton label="Sepete Ekle" variant="outline" onPress={() => onAdd(product, quantity)} />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Hemen Al" onPress={() => onBuyNow(product, quantity)} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
