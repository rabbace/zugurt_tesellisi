import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { discountPercent, formatTL } from '../format';

export function PriceBlock({
  price,
  originalPrice,
  large = false,
}: {
  price: number;
  originalPrice: number | null;
  large?: boolean;
}) {
  const discount = discountPercent(price, originalPrice);
  return (
    <View>
      {discount > 0 && (
        <View className="flex-row items-center gap-1">
          <Text className={`text-muted line-through ${large ? 'text-sm' : 'text-xs'}`}>
            {formatTL(originalPrice as number)}
          </Text>
          <Text className={`text-red-600 font-bold ${large ? 'text-sm' : 'text-xs'}`}>
            %{discount}
          </Text>
        </View>
      )}
      <Text className={`text-link font-extrabold ${large ? 'text-2xl' : 'text-base'}`}>
        {formatTL(price)}
      </Text>
    </View>
  );
}

export function Rating({ rating, count }: { rating: number; count: number }) {
  const full = Math.round(rating);
  return (
    <View className="flex-row items-center">
      <Text className="text-amber-500 text-xs">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</Text>
      <Text className="text-muted text-xs ml-1">
        {rating.toFixed(1)} ({count.toLocaleString('tr-TR')})
      </Text>
    </View>
  );
}

export function Stepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="flex-row items-center border border-line rounded-lg">
      <Pressable onPress={() => onChange(value - 1)} className="px-3 py-1 active:opacity-50">
        <Text className="text-link text-lg font-bold">−</Text>
      </Pressable>
      <Text className="text-ink text-base font-semibold min-w-[24px] text-center">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        className="px-3 py-1 active:opacity-50 disabled:opacity-30"
      >
        <Text className="text-link text-lg font-bold">+</Text>
      </Pressable>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'gold' | 'danger';
}) {
  const styles = {
    primary: 'bg-brand',
    outline: 'bg-card border border-brand',
    gold: 'bg-gold',
    danger: 'bg-card border border-red-500',
  }[variant];
  const text = {
    primary: 'text-white',
    outline: 'text-link',
    gold: 'text-white',
    danger: 'text-red-600',
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${styles} rounded-xl py-3 px-4 items-center active:opacity-70 disabled:opacity-40`}
    >
      <Text className={`${text} font-bold text-sm`}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <Text className="text-6xl mb-3">{emoji}</Text>
      <Text className="text-ink text-base font-bold text-lg text-center">{title}</Text>
      <Text className="text-muted text-sm text-center mt-1">{subtitle}</Text>
    </View>
  );
}
