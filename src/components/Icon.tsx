import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

cssInterop(Ionicons, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const ThemedIonicons = Ionicons as unknown as React.ComponentType<{ name: IconName; size: number; className?: string }>;

export function Icon({ name, size = 20, className = 'text-ink' }: { name: IconName; size?: number; className?: string }) {
  return <ThemedIonicons name={name} size={size} className={className} />;
}
