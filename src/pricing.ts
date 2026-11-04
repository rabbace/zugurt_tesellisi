import { Campaign, CartItem, Coupon, Economy, PricedProduct, Product } from './types';

export function isActive(item: { startsAt?: string; endsAt?: string; validFrom?: string; validUntil?: string }, now: number): boolean {
  const start = Date.parse(item.startsAt ?? item.validFrom ?? '');
  const end = Date.parse(item.endsAt ?? item.validUntil ?? '');
  return now >= start && now < end;
}

export function activeCampaigns(campaigns: Campaign[], now: number): Campaign[] {
  return campaigns.filter((c) => isActive(c, now));
}

export function upcomingCampaigns(campaigns: Campaign[], now: number): Campaign[] {
  return campaigns
    .filter((c) => Date.parse(c.startsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

export function campaignAppliesTo(campaign: Campaign, product: Product): boolean {
  return !campaign.categoryIds || campaign.categoryIds.includes(product.categoryId);
}

function roundPrice(value: number): number {
  return value >= 100 ? Math.round(value) : Math.round(value * 100) / 100;
}

export function priceProduct(product: Product, campaigns: Campaign[], now: number): PricedProduct {
  const best = activeCampaigns(campaigns, now)
    .filter((c) => campaignAppliesTo(c, product))
    .sort((a, b) => b.discountPercent - a.discountPercent)[0];
  if (!best) return { ...product, campaign: null };
  return {
    ...product,
    price: roundPrice(product.price * (1 - best.discountPercent / 100)),
    originalPrice: product.originalPrice ?? product.price,
    campaign: best,
  };
}

export function priceCatalog(products: Product[], campaigns: Campaign[], now: number): PricedProduct[] {
  return products.map((p) => priceProduct(p, campaigns, now));
}

export interface CouponCheck {
  ok: boolean;
  discount: number;
  reason: string;
}

export function evaluateCoupon(coupon: Coupon, items: CartItem[], now: number): CouponCheck {
  if (now < Date.parse(coupon.validFrom)) return { ok: false, discount: 0, reason: 'Henüz başlamadı' };
  if (now >= Date.parse(coupon.validUntil)) return { ok: false, discount: 0, reason: 'Süresi doldu' };
  const eligible = items
    .filter((i) => !coupon.categoryIds || coupon.categoryIds.includes(i.product.categoryId))
    .reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  if (eligible === 0) return { ok: false, discount: 0, reason: 'Sepette uygun ürün yok' };
  if (eligible < coupon.minAmount) {
    return { ok: false, discount: 0, reason: `${Math.ceil(coupon.minAmount - eligible).toLocaleString('tr-TR')} TL daha ekle` };
  }
  let discount = coupon.amount ?? 0;
  if (coupon.percent) discount = (eligible * coupon.percent) / 100;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(Math.round(discount * 100) / 100, eligible);
  return { ok: true, discount, reason: '' };
}

export interface CartTotals {
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  remainingForFreeShipping: number;
}

export function computeTotals(items: CartItem[], economy: Economy, couponDiscount = 0): CartTotals {
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const allFree = items.length > 0 && items.every((i) => i.product.freeShipping);
  const qualifies = allFree || subtotal >= economy.freeShippingThreshold;
  const shippingFee = items.length === 0 || qualifies ? 0 : economy.shippingFee;
  const discount = Math.min(couponDiscount, subtotal);
  return {
    subtotal,
    shippingFee,
    discount,
    total: Math.round((subtotal + shippingFee - discount) * 100) / 100,
    remainingForFreeShipping: qualifies ? 0 : economy.freeShippingThreshold - subtotal,
  };
}

export function installments(price: number): { months: number; monthly: number; total: number; note: string }[] {
  if (price < 1000) return [];
  return [
    { months: 3, rate: 0 },
    { months: 6, rate: 0.045 },
    { months: 9, rate: 0.09 },
    { months: 12, rate: 0.14 },
  ].map(({ months, rate }) => {
    const total = Math.round(price * (1 + rate) * 100) / 100;
    return {
      months,
      monthly: Math.round((total / months) * 100) / 100,
      total,
      note: rate === 0 ? 'Peşin fiyatına' : `%${(rate * 100).toFixed(1).replace('.0', '')} vade farkı`,
    };
  });
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days} gün ${hours} saat`;
  if (hours > 0) return `${hours} saat ${minutes} dk`;
  return `${minutes} dk`;
}
