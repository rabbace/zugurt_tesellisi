import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { discountPercent } from '../format';
import { Icon } from './Icon';
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
        <Text className="font-body text-5xl">{product.emoji}</Text>
        {discount > 0 && (
          <View className="absolute top-2 left-2 bg-brick rounded-md px-1.5 py-0.5">
            <Text className="text-paper text-2xs font-strong">%{discount}</Text>
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
          <Icon name="add" size={22} className="text-paper" />
        </Pressable>
      </View>
      {product.campaign && (
        <View className="rounded-md px-1.5 py-0.5 self-start mb-1" style={{ backgroundColor: product.campaign.color }}>
          <Text className="text-paper text-2xs font-strong">
            {product.campaign.title}
          </Text>
        </View>
      )}
      <Text className="font-body text-ink text-sm" numberOfLines={2}>
        <Text className="font-strong">{product.brand} </Text>
        {product.title}
      </Text>
      <View className="mt-1">
        <Rating rating={product.rating} count={product.reviewCount} />
      </View>
      <View className="flex-row flex-wrap gap-1 mt-1">
        {fast && <Badge label="Yarın kapında" className="bg-fresh-soft" textClassName="text-fresh" />}
        {bestSeller && <Badge label="Çok satan" className="bg-chip" textClassName="text-link" />}
      </View>
      {product.stock <= 10 && (
        <Text className="text-warm text-xs font-semi mt-0.5">Son {product.stock} ürün</Text>
      )}
      <View className="mt-2">
        <PriceBlock price={product.price} originalPrice={product.originalPrice} />
      </View>
      {note ? <Text className="text-fresh text-xs font-strong mt-1">{note}</Text> : null}
    </Pressable>
  );
}
