import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { discountPercent } from '../format';
import { Product } from '../types';
import { PriceBlock, Rating } from './ui';

export function ProductCard({
  product,
  onOpen,
  onAdd,
  compact = false,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
  compact?: boolean;
}) {
  const discount = discountPercent(product.price, product.originalPrice);
  return (
    <Pressable
      onPress={() => onOpen(product)}
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
        <Pressable
          onPress={() => onAdd(product)}
          accessibilityLabel="Sepete ekle"
          className="absolute bottom-2 right-2 bg-brand rounded-full w-10 h-10 items-center justify-center active:opacity-70"
        >
          <Text className="text-white text-xl font-bold">+</Text>
        </Pressable>
      </View>
      <Text className="text-ink text-sm" numberOfLines={2}>
        <Text className="font-bold">{product.brand} </Text>
        {product.title}
      </Text>
      <View className="mt-1">
        <Rating rating={product.rating} count={product.reviewCount} />
      </View>
      {product.freeShipping && (
        <Text className="text-emerald-600 text-xs font-semibold mt-1">🚚 Kargo Bedava</Text>
      )}
      {product.stock <= 10 && (
        <Text className="text-orange-600 text-xs font-semibold mt-0.5">Son {product.stock} ürün!</Text>
      )}
      <View className="mt-2">
        <PriceBlock price={product.price} originalPrice={product.originalPrice} />
      </View>
    </Pressable>
  );
}
