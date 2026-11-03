import { formatDateTime, formatDay } from '../format';
import { CartItem, Order, OrderEvent, OrderStage } from '../types';

export const REAL_DAY_MS = 24 * 60 * 60 * 1000;
export const FAST_DAY_MS = 2 * 60 * 1000;

const CARGO_COMPANIES = ['Teselli Kargo', 'Hayal Express', 'Şimşek Lojistik'];

const TRANSFER_CENTERS = [
  'İstanbul Hadımköy Transfer Merkezi',
  'Ankara Sincan Transfer Merkezi',
  'İzmir Kemalpaşa Transfer Merkezi',
  'Kocaeli Gebze Transfer Merkezi',
];

const DELAY_REASONS = [
  'Transfer merkezindeki yoğunluk nedeniyle gönderin gecikiyor.',
  'Olumsuz hava koşulları nedeniyle teslimat ertelendi.',
  'Araç arızası nedeniyle gönderin bir sonraki sefere aktarıldı.',
  'Kampanya dönemi yoğunluğu nedeniyle teslimat süresi uzadı.',
];

const ACTIVE_STAGES: OrderStage[] = ['placed', 'preparing'];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}

function trackingNumber(): string {
  let digits = '';
  for (let i = 0; i < 10; i++) digits += Math.floor(Math.random() * 10).toString();
  return `TS${digits}`;
}

export function buildOrder(params: {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  address: string;
  fastMode: boolean;
  now?: number;
}): Order {
  const { items, subtotal, shippingFee, address, fastMode } = params;
  const t0 = params.now ?? Date.now();
  const day = fastMode ? FAST_DAY_MS : REAL_DAY_MS;
  const hour = day / 24;

  const minDays = Math.max(...items.map((i) => i.product.deliveryDays[0]));
  const maxDays = Math.max(...items.map((i) => i.product.deliveryDays[1]));
  const deliveryDays = randomInt(minDays, Math.max(minDays, maxDays));

  const cargoCompany = pick(CARGO_COMPANIES);
  const tracking = trackingNumber();
  const sellers = Array.from(new Set(items.map((i) => i.product.seller))).join(', ');
  const center = pick(TRANSFER_CENTERS);

  const events: OrderEvent[] = [];
  const add = (stage: OrderStage, at: number, title: string, detail: string) =>
    events.push({ stage, at: Math.round(at), title, detail });

  add('placed', t0, 'Siparişin alındı', 'Ödemen sanal kredinden onaylandı.');
  add('preparing', t0 + randomBetween(0.5, 1.5) * hour, 'Siparişin hazırlanıyor', `${sellers} siparişini paketliyor.`);

  const shippedAt = t0 + randomBetween(4, 10) * hour;
  add('shipped', shippedAt, 'Kargoya verildi', `${cargoCompany} · Takip no: ${tracking}`);

  const deliveryBase = t0 + deliveryDays * day;
  const initialEstimate = deliveryBase;
  const transferAt = shippedAt + Math.max(2 * hour, (deliveryBase - shippedAt) * 0.45);
  add('transfer', transferAt, 'Transfer merkezinde', center);

  let deliverAt = deliveryBase;
  const roll = Math.random();

  if (roll < 0.2) {
    const extraDays = randomInt(1, 2);
    add('delayed', transferAt + randomBetween(2, 5) * hour, 'Teslimat gecikiyor', `${pick(DELAY_REASONS)} Yeni tahmini teslimat ${extraDays} gün sonra.`);
    deliverAt += extraDays * day;
  }

  const outAt = Math.max(deliverAt - randomBetween(3, 6) * hour, events[events.length - 1].at + hour);
  add('out_for_delivery', outAt, 'Dağıtıma çıktı', 'Kurye gönderini bugün teslim edecek.');

  if (roll >= 0.2 && roll < 0.3) {
    const failedAt = outAt + randomBetween(2, 4) * hour;
    add('delivery_failed', failedAt, 'Teslim edilemedi', 'Adreste kimse bulunamadı. Yarın tekrar denenecek.');
    const retryAt = failedAt + day - randomBetween(3, 6) * hour;
    add('out_for_delivery', retryAt, 'Tekrar dağıtıma çıktı', 'Kurye ikinci teslimat denemesi için yolda.');
    deliverAt = retryAt + randomBetween(2, 4) * hour;
  } else {
    deliverAt = Math.max(deliverAt, outAt + hour);
  }

  add('delivered', deliverAt, 'Teslim edildi', 'Gönderin teslim edildi. Keyifli kullanımlar! (Sanal 😅)');

  return {
    id: `${t0.toString(36).toUpperCase()}${randomInt(100, 999)}`,
    items,
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    createdAt: t0,
    address,
    cargoCompany,
    trackingNumber: tracking,
    events,
    initialEstimate,
    cancelledAt: null,
    notificationIds: [],
  };
}

export function reachedEvents(order: Order, now: number): OrderEvent[] {
  const limit = order.cancelledAt ?? now;
  return order.events.filter((e) => e.at <= limit);
}

export function currentStage(order: Order, now: number): OrderStage {
  if (order.cancelledAt !== null) return 'cancelled';
  const reached = reachedEvents(order, now);
  return reached.length ? reached[reached.length - 1].stage : 'placed';
}

export function canCancel(order: Order, now: number): boolean {
  return order.cancelledAt === null && ACTIVE_STAGES.includes(currentStage(order, now));
}

export function estimatedDelivery(order: Order, now: number): number {
  const delayKnown = reachedEvents(order, now).some(
    (e) => e.stage === 'delayed' || e.stage === 'delivery_failed'
  );
  const delivered = order.events[order.events.length - 1];
  return delayKnown ? delivered.at : order.initialEstimate;
}

export function formatEstimate(order: Order, now: number): string {
  const ts = estimatedDelivery(order, now);
  return ts - order.createdAt < REAL_DAY_MS ? formatDateTime(ts) : formatDay(ts);
}

export const STAGE_LABELS: Record<OrderStage, string> = {
  placed: 'Sipariş alındı',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  transfer: 'Transfer merkezinde',
  delayed: 'Gecikmeli',
  out_for_delivery: 'Dağıtımda',
  delivery_failed: 'Teslim edilemedi',
  delivered: 'Teslim edildi',
  cancelled: 'İptal edildi',
};

export const STAGE_COLORS: Record<OrderStage, string> = {
  placed: 'bg-slate-500',
  preparing: 'bg-amber-500',
  shipped: 'bg-sky-500',
  transfer: 'bg-sky-500',
  delayed: 'bg-red-500',
  out_for_delivery: 'bg-violet-600',
  delivery_failed: 'bg-red-500',
  delivered: 'bg-emerald-600',
  cancelled: 'bg-slate-400',
};
