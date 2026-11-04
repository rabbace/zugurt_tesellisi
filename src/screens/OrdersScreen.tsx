import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState, PrimaryButton, ScreenHeader } from '../components/ui';
import { formatDateTime, formatTL } from '../format';
import {
  canCancel,
  canReturn,
  currentStage,
  formatEstimate,
  reachedEvents,
  RETURN_REASONS,
  returnDeadline,
  returnStage,
  STAGE_COLORS,
  STAGE_LABELS,
} from '../orders/simulate';
import { Order, OrderStage } from '../types';

const FLOW: OrderStage[] = ['placed', 'preparing', 'shipped', 'transfer', 'out_for_delivery', 'delivered'];

const FLOW_INDEX: Record<OrderStage, number> = {
  placed: 0,
  preparing: 1,
  shipped: 2,
  transfer: 3,
  delayed: 3,
  delivery_failed: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: 5,
};

function StatusPill({ order, now }: { order: Order; now: number }) {
  if (order.returnInfo) {
    const r = returnStage(order.returnInfo, now);
    const done = r.stage === 'refunded';
    return (
      <View className={`${done ? 'bg-emerald-600' : 'bg-orange-500'} rounded-full px-2.5 py-1 self-start`}>
        <Text className="text-white text-xs font-bold">{done ? 'İade edildi' : 'İade sürecinde'}</Text>
      </View>
    );
  }
  const stage = currentStage(order, now);
  return (
    <View className={`${STAGE_COLORS[stage]} rounded-full px-2.5 py-1 self-start`}>
      <Text className="text-white text-xs font-bold">{STAGE_LABELS[stage]}</Text>
    </View>
  );
}

export function OrdersScreen({ orders, now, onOpen }: { orders: Order[]; now: number; onOpen: (order: Order) => void }) {
  if (orders.length === 0) {
    return <EmptyState emoji="📦" title="Henüz siparişin yok" subtitle="İlk siparişini ver, kargonu adım adım takip et." />;
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
      {orders.map((order) => {
        const stage = currentStage(order, now);
        const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
        return (
          <Pressable key={order.id} onPress={() => onOpen(order)} className="bg-card rounded-2xl p-3 mb-2 active:opacity-80">
            <View className="flex-row justify-between items-center">
              <Text className="text-muted text-xs flex-1 mr-2" numberOfLines={1}>
                #{order.id} · {formatDateTime(order.createdAt)}
              </Text>
              <StatusPill order={order} now={now} />
            </View>
            <View className="flex-row mt-2">
              {order.items.slice(0, 4).map((i) => (
                <View key={i.product.id} className="bg-sunken rounded-lg w-12 h-12 items-center justify-center mr-2">
                  <Text className="text-2xl">{i.product.emoji}</Text>
                </View>
              ))}
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-soft text-sm">
                {itemCount} ürün · {formatTL(order.total)}
              </Text>
              {stage !== 'delivered' && stage !== 'cancelled' && (
                <Text className="text-soft text-sm">
                  Tahmini: <Text className="font-bold">{formatEstimate(order, now)}</Text>
                </Text>
              )}
              {stage === 'delivered' && !order.returnInfo && <Text className="text-link text-sm font-bold">✍️ Değerlendir</Text>}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function OrderDetail({
  order,
  now,
  returnDays,
  reviewedProductIds,
  onClose,
  onCancel,
  onReturn,
  onOpenProduct,
}: {
  order: Order | null;
  now: number;
  returnDays: number;
  reviewedProductIds: string[];
  onClose: () => void;
  onCancel: (order: Order) => void;
  onReturn: (order: Order, reason: string) => void;
  onOpenProduct: (productId: string) => void;
}) {
  const [returning, setReturning] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  if (!order) return null;
  const stage = currentStage(order, now);
  const reached = reachedEvents(order, now);
  const upcoming = stage === 'cancelled' ? [] : FLOW.slice(FLOW_INDEX[stage] + 1).map((s) => STAGE_LABELS[s]);
  const timeline = [...reached].reverse();
  const deadline = returnDeadline(order, returnDays);
  const returnable = canReturn(order, now, returnDays);
  const returnTimeline = order.returnInfo ? order.returnInfo.events.filter((e) => e.at <= now).reverse() : [];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-page">
        <ScreenHeader title={`Sipariş #${order.id}`} onBack={onClose} />

        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
          <View className="bg-card rounded-2xl p-4">
            <StatusPill order={order} now={now} />
            {stage === 'delivered' ? (
              <Text className="text-ink text-base font-bold mt-2">
                {formatDateTime(order.events[order.events.length - 1].at)} tarihinde teslim edildi
              </Text>
            ) : stage === 'cancelled' ? (
              <Text className="text-ink text-base font-bold mt-2">Sipariş iptal edildi, {formatTL(order.total)} kredine iade edildi.</Text>
            ) : (
              <Text className="text-ink text-base font-bold mt-2">Tahmini teslimat: {formatEstimate(order, now)}</Text>
            )}
            <Text className="text-muted text-sm mt-1">
              {order.cargoCompany} · Takip no: {order.trackingNumber}
            </Text>
          </View>

          {order.returnInfo && (
            <View className="bg-card rounded-2xl p-4 mt-2">
              <Text className="text-ink text-base font-bold mb-3">↩️ İade takibi</Text>
              {returnTimeline.map((e, idx) => (
                <TimelineRow
                  key={e.stage}
                  title={e.title}
                  detail={e.detail}
                  at={e.at}
                  color={idx === 0 ? (e.stage === 'refunded' ? 'bg-emerald-600' : 'bg-orange-500') : 'bg-slate-300'}
                />
              ))}
            </View>
          )}

          <View className="bg-card rounded-2xl p-4 mt-2">
            <Text className="text-ink text-base font-bold mb-3">🚚 Kargo takibi</Text>
            {stage === 'cancelled' && (
              <TimelineRow title="Sipariş iptal edildi" detail="Tutar sanal kredine iade edildi." at={order.cancelledAt ?? now} color="bg-slate-400" />
            )}
            {timeline.map((e, idx) => (
              <TimelineRow
                key={`${e.stage}-${e.at}`}
                title={e.title}
                detail={e.detail}
                at={e.at}
                color={idx === 0 && stage !== 'cancelled' ? STAGE_COLORS[e.stage] : 'bg-slate-300'}
              />
            ))}
            {upcoming.length > 0 && (
              <View className="mt-1 pt-2 border-t border-line">
                {upcoming.map((label) => (
                  <Text key={label} className="text-muted text-sm py-1">
                    ○ {label}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <View className="bg-card rounded-2xl p-4 mt-2">
            <Text className="text-ink text-base font-bold mb-2">Ürünler</Text>
            {order.items.map((i) => {
              const reviewed = reviewedProductIds.includes(i.product.id);
              return (
                <View key={i.product.id} className="py-2 border-b border-line">
                  <View className="flex-row items-center">
                    <Text className="text-2xl mr-3">{i.product.emoji}</Text>
                    <View className="flex-1">
                      <Text className="text-ink text-sm" numberOfLines={2}>
                        <Text className="font-bold">{i.product.brand} </Text>
                        {i.product.title}
                      </Text>
                      <Text className="text-muted text-xs">
                        {i.quantity} adet · {i.product.seller}
                      </Text>
                    </View>
                    <Text className="text-ink text-sm font-bold">{formatTL(i.product.price * i.quantity)}</Text>
                  </View>
                  {stage === 'delivered' && (
                    <Pressable onPress={() => onOpenProduct(i.product.id)} className="self-end mt-1 active:opacity-60" hitSlop={6}>
                      <Text className="text-link text-sm font-bold">{reviewed ? '✅ Değerlendirdin' : '✍️ Ürünü değerlendir'}</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
            <View className="flex-row justify-between mt-3">
              <Text className="text-muted text-sm">Ürünler</Text>
              <Text className="text-soft text-sm">{formatTL(order.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-muted text-sm">Kargo</Text>
              <Text className="text-soft text-sm">{order.shippingFee === 0 ? 'Bedava' : formatTL(order.shippingFee)}</Text>
            </View>
            {order.discount > 0 && (
              <View className="flex-row justify-between mt-1">
                <Text className="text-muted text-sm">Kupon ({order.couponCode})</Text>
                <Text className="text-emerald-600 text-sm font-bold">-{formatTL(order.discount)}</Text>
              </View>
            )}
            <View className="flex-row justify-between mt-1">
              <Text className="text-ink text-base font-bold">Toplam</Text>
              <Text className="text-link text-base font-extrabold">{formatTL(order.total)}</Text>
            </View>
          </View>

          <View className="bg-card rounded-2xl p-4 mt-2">
            <Text className="text-ink text-base font-bold mb-1">📍 Teslimat adresi · {order.addressTitle}</Text>
            <Text className="text-soft text-sm">{order.address}</Text>
          </View>

          {canCancel(order, now) && (
            <View className="mt-4">
              <PrimaryButton label="Siparişi İptal Et" variant="danger" onPress={() => onCancel(order)} />
              <Text className="text-muted text-xs text-center mt-2">Sipariş kargoya verilmeden iptal edilebilir.</Text>
            </View>
          )}

          {returnable && !returning && (
            <View className="mt-4">
              <PrimaryButton label="↩️ İade talebi oluştur" variant="outline" onPress={() => setReturning(true)} />
              {deadline && (
                <Text className="text-muted text-xs text-center mt-2">
                  Ücretsiz iade için son tarih: {formatDateTime(deadline)}
                </Text>
              )}
            </View>
          )}

          {returnable && returning && (
            <View className="bg-card rounded-2xl p-4 mt-4">
              <Text className="text-ink text-base font-bold mb-2">İade sebebi</Text>
              {RETURN_REASONS.map((r) => (
                <Pressable key={r} onPress={() => setReason(r)} className="flex-row items-center py-2 active:opacity-60">
                  <Text className="text-base mr-2">{reason === r ? '🔘' : '⚪'}</Text>
                  <Text className="text-ink text-base">{r}</Text>
                </Pressable>
              ))}
              <View className="flex-row gap-2 mt-3">
                <View className="flex-1">
                  <PrimaryButton label="Vazgeç" variant="outline" onPress={() => setReturning(false)} />
                </View>
                <View className="flex-1">
                  <PrimaryButton
                    label="İadeyi başlat"
                    disabled={!reason}
                    onPress={() => {
                      if (reason) onReturn(order, reason);
                      setReturning(false);
                    }}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function TimelineRow({ title, detail, at, color }: { title: string; detail: string; at: number; color: string }) {
  return (
    <View className="flex-row mb-3">
      <View className={`${color} w-3 h-3 rounded-full mt-1.5 mr-3`} />
      <View className="flex-1">
        <Text className="text-ink text-base font-semibold">{title}</Text>
        <Text className="text-soft text-sm mt-0.5">{detail}</Text>
        <Text className="text-muted text-xs mt-0.5">{formatDateTime(at)}</Text>
      </View>
    </View>
  );
}
