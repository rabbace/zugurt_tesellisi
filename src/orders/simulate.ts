import { formatDateTime, formatDay } from '../format';
import { CartItem, Order, OrderEvent, OrderStage, ReturnEvent, ReturnInfo, ReturnStage } from '../types';

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
  discount: number;
  couponCode: string | null;
  address: string;
  addressTitle: string;
  fastMode: boolean;
  now?: number;
}): Order {
  const { items, subtotal, shippingFee, discount, couponCode, address, addressTitle, fastMode } = params;
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
    discount,
    couponCode,
    total: Math.round((subtotal + shippingFee - discount) * 100) / 100,
    createdAt: t0,
    dayMs: day,
    address,
    addressTitle,
    cargoCompany,
    trackingNumber: tracking,
    events,
    initialEstimate,
    cancelledAt: null,
    notificationIds: [],
    notifiedEventCount: 1,
    returnInfo: null,
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

export const RETURN_REASONS = [
  'Vazgeçtim',
  'Beklediğim gibi değil',
  'Ürün hasarlı geldi',
  'Yanlış ürün gönderildi',
  'Daha uygun fiyat buldum',
];

export function deliveredAt(order: Order): number | null {
  const last = order.events[order.events.length - 1];
  return last?.stage === 'delivered' ? last.at : null;
}

export function returnDeadline(order: Order, returnDays: number): number | null {
  const at = deliveredAt(order);
  return at === null ? null : at + returnDays * (order.dayMs || FAST_DAY_MS);
}

export function canReturn(order: Order, now: number, returnDays: number): boolean {
  const deadline = returnDeadline(order, returnDays);
  return (
    order.returnInfo === null &&
    order.cancelledAt === null &&
    currentStage(order, now) === 'delivered' &&
    deadline !== null &&
    now < deadline
  );
}

export function buildReturn(order: Order, reason: string, now: number): ReturnInfo {
  const day = order.dayMs || FAST_DAY_MS;
  const hour = day / 24;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const events: ReturnEvent[] = [];
  const add = (stage: ReturnStage, at: number, title: string, detail: string) =>
    events.push({ stage, at: Math.round(at), title, detail });
  add('requested', now, 'İade talebin alındı', `Sebep: ${reason}`);
  add('code_created', now + randomBetween(0.2, 0.6) * hour, 'İade kargo kodu oluşturuldu', `${order.cargoCompany} iade kodu: ${code}. Kargo ücreti satıcıya ait.`);
  const pickedAt = now + randomBetween(4, 10) * hour;
  add('picked_up', pickedAt, 'Ürün kargoya verildi', 'Kurye iade paketini teslim aldı.');
  const receivedAt = pickedAt + randomBetween(1, 2) * day;
  add('received', receivedAt, 'Ürün satıcıya ulaştı', 'Satıcı ürünü inceliyor.');
  add('refunded', receivedAt + randomBetween(3, 8) * hour, 'İade onaylandı', `${order.total.toLocaleString('tr-TR')} TL sanal kredine iade edildi.`);
  return { requestedAt: now, reason, events, refundedAt: null };
}

export function returnStage(info: ReturnInfo, now: number): ReturnEvent {
  const reached = info.events.filter((e) => e.at <= now);
  return reached[reached.length - 1] ?? info.events[0];
}

export const NOTIFY_STAGES: OrderStage[] = ['shipped', 'delayed', 'out_for_delivery', 'delivery_failed', 'delivered'];
