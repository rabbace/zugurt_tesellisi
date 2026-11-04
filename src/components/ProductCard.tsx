import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { discountPercent } from '../format';
import { PricedProduct } from '../types';
import { Badge, HeartButton, PriceBlock, Rating } from './ui';

export interface CardActions {
  onOpen: (product: PricedProduct) => void;
  onAdd: (product: PricedProduct) => void;
  isFavorite: (productId: string) => boolean;
  onToggleFavorite: (product: PricedProduct) => void;
}

export function ProductCard({
  product,
  actions,
  compact = false,
  note,
}: {
  product: PricedProduct;
  actions: CardActions;
  compact?: boolean;
  note?: string;
}) {
  const discount = discountPercent(product.price, product.originalPrice);
  const bestSeller = product.reviewCount >= 10000;
  const fast = product.deliveryDays[0] === 1;
  return (
    <Pressable
      onPress={() => actions.onOpen(product)}
      className={`bg-card rounded-2xl p-3 m-1.5 border border-line active:opacity-80 ${
        compact ? 'w-[180px]' : 'flex-1'
      }`}
    >
      <View className="bg-sunken rounded-xl h-32 items-center justify-center mb-2">
        <Text className="text-5xl">{product.emoji}</Text>
        {discount > 0 && (
          <View className="absolute top-2 left-2 bg-red-600 rounded-md px-1.5 py-0.5">
            <Text className="text-white text-2xs font-bold">%{discount}</Text>
          </View>
        )}
        <View className="absolute top-2 right-2">
          <HeartButton active={actions.isFavorite(product.id)} onPress={() => actions.onToggleFavorite(product)} />
        </View>
        <Pressable
          onPress={() => actions.onAdd(product)}
          accessibilityLabel="Sepete ekle"
          className="absolute bottom-2 right-2 bg-brand rounded-full w-10 h-10 items-center justify-center active:opacity-70"
        >
          <Text className="text-white text-xl font-bold">+</Text>
        </Pressable>
      </View>
      {product.campaign && (
        <View className="rounded-md px-1.5 py-0.5 self-start mb-1" style={{ backgroundColor: product.campaign.color }}>
          <Text className="text-white text-2xs font-bold">
            {product.campaign.emoji} {product.campaign.title}
          </Text>
        </View>
      )}
      <Text className="text-ink text-sm" numberOfLines={2}>
        <Text className="font-bold">{product.brand} </Text>
        {product.title}
      </Text>
      <View className="mt-1">
        <Rating rating={product.rating} count={product.reviewCount} />
      </View>
      <View className="flex-row flex-wrap gap-1 mt-1">
        {fast && <Badge label="🚀 Yarın kapında" className="bg-emerald-100" textClassName="text-emerald-800" />}
        {bestSeller && <Badge label="🔥 Çok satan" className="bg-orange-100" textClassName="text-orange-800" />}
      </View>
      {product.stock <= 10 && (
        <Text className="text-orange-600 text-xs font-semibold mt-0.5">Son {product.stock} ürün!</Text>
      )}
      <View className="mt-2">
        <PriceBlock price={product.price} originalPrice={product.originalPrice} />
      </View>
      {note ? <Text className="text-emerald-600 text-xs font-bold mt-1">{note}</Text> : null}
    </Pressable>
  );
}
