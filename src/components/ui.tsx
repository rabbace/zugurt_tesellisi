import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { discountPercent, formatTL } from '../format';
import { Icon, IconName } from './Icon';

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
          <Text className={`font-body text-muted line-through ${large ? 'text-sm' : 'text-xs'}`}>
            {formatTL(originalPrice as number)}
          </Text>
          <Text className={`text-sale font-strong ${large ? 'text-sm' : 'text-xs'}`}>%{discount}</Text>
        </View>
      )}
      <Text className={`text-ink font-heavy ${large ? 'text-2xl' : 'text-base'}`}>{formatTL(price)}</Text>
    </View>
  );
}

export function Rating({ rating, count }: { rating: number; count: number }) {
  const full = Math.round(rating);
  return (
    <View className="flex-row items-center">
      <Text className="font-body text-star text-xs">
        {'★'.repeat(full)}
        {'☆'.repeat(5 - full)}
      </Text>
      <Text className="font-body text-muted text-xs ml-1">
        {rating.toFixed(1)} ({count.toLocaleString('tr-TR')})
      </Text>
    </View>
  );
}

export function Stepper({ value, max, onChange }: { value: number; max: number; onChange: (value: number) => void }) {
  return (
    <View className="flex-row items-center border border-line rounded-full">
      <Pressable onPress={() => onChange(value - 1)} className="px-3 py-1.5 active:opacity-50" accessibilityLabel="Azalt">
        <Icon name="remove" size={18} className="text-link" />
      </Pressable>
      <Text className="text-ink text-base font-semi min-w-[24px] text-center">{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(value + 1, max))}
        disabled={value >= max}
        className="px-3 py-1.5 active:opacity-50 disabled:opacity-30"
        accessibilityLabel="Artır"
      >
        <Icon name="add" size={18} className="text-link" />
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
    gold: 'bg-honey',
    danger: 'bg-card border border-sale',
  }[variant];
  const text = {
    primary: 'text-paper',
    outline: 'text-link',
    gold: 'text-dusk',
    danger: 'text-sale',
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`${styles} rounded-xl py-3.5 px-4 items-center active:opacity-70 disabled:opacity-40`}
    >
      <Text className={`${text} font-strong text-sm`}>{label}</Text>
    </Pressable>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="bg-chip rounded-full w-20 h-20 items-center justify-center mb-4">
        <Icon name={icon} size={34} className="text-link" />
      </View>
      <Text className="font-display text-ink text-xl text-center">{title}</Text>
      <Text className="font-body text-muted text-sm text-center mt-2">{subtitle}</Text>
    </View>
  );
}

export function HeartButton({ active, onPress, size = 'md' }: { active: boolean; onPress: () => void; size?: 'md' | 'lg' }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      hitSlop={8}
      className={`bg-card rounded-full items-center justify-center border border-line active:opacity-60 ${
        size === 'lg' ? 'w-11 h-11' : 'w-9 h-9'
      }`}
    >
      <Icon name={active ? 'heart' : 'heart-outline'} size={size === 'lg' ? 22 : 18} className={active ? 'text-sale' : 'text-soft'} />
    </Pressable>
  );
}

export function Badge({ label, className = 'bg-chip', textClassName = 'text-link' }: { label: string; className?: string; textClassName?: string }) {
  return (
    <View className={`${className} rounded-full px-2 py-0.5 self-start`}>
      <Text className={`${textClassName} text-2xs font-strong`}>{label}</Text>
    </View>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={6} className="active:opacity-60" accessibilityLabel={`${n} yıldız`}>
          <Text className={`font-body text-4xl ${n <= value ? 'text-star' : 'text-line'}`}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View className="flex-row items-center px-3 pt-10 pb-3 bg-card border-b border-line">
      <Pressable onPress={onBack} className="flex-row items-center px-1 py-1 active:opacity-50" hitSlop={8} accessibilityLabel="Geri">
        <Icon name="chevron-back" size={22} className="text-link" />
        <Text className="text-link text-base font-strong">Geri</Text>
      </Pressable>
      <Text className="font-display text-ink text-lg ml-3 flex-1" numberOfLines={1}>
        {title}
      </Text>
      {right}
    </View>
  );
}

export function MenuRow({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3.5 border-b border-line active:opacity-60">
      <View className="w-9">
        <Icon name={icon} size={20} className="text-link" />
      </View>
      <Text className="font-body text-ink text-base flex-1">{label}</Text>
      {detail ? <Text className="font-body text-muted text-sm mr-2">{detail}</Text> : null}
      <Icon name="chevron-forward" size={18} className="text-muted" />
    </Pressable>
  );
}

export function Radio({ selected }: { selected: boolean }) {
  return (
    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selected ? 'border-brand' : 'border-line'}`}>
      {selected && <View className="w-2.5 h-2.5 rounded-full bg-brand" />}
    </View>
  );
}
