export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  categoryId: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviewCount: number;
  emoji: string;
  seller: string;
  freeShipping: boolean;
  deliveryDays: [number, number];
  stock: number;
  description: string;
}

export interface Campaign {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  startsAt: string;
  endsAt: string;
  discountPercent: number;
  categoryIds: string[] | null;
}

export interface PricedProduct extends Product {
  campaign: Campaign | null;
}

export interface Coupon {
  code: string;
  title: string;
  minAmount: number;
  amount: number | null;
  percent: number | null;
  maxDiscount: number | null;
  categoryIds: string[] | null;
  validFrom: string;
  validUntil: string;
}

export interface Economy {
  startingCredit: number;
  adReward: number;
  adCooldownSeconds: number;
  freeShippingThreshold: number;
  shippingFee: number;
  returnDays: number;
}

export interface Catalog {
  version: number;
  updatedAt: string;
  economy: Economy;
  categories: Category[];
  campaigns: Campaign[];
  coupons: Coupon[];
  products: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Address {
  id: string;
  title: string;
  fullName: string;
  phone: string;
  city: string;
  district: string;
  line: string;
}

export interface Favorite {
  productId: string;
  addedAt: number;
  priceAtAdd: number;
  lastNotifiedPrice: number;
}

export interface UserReview {
  id: string;
  productId: string;
  rating: number;
  text: string;
  createdAt: number;
}

export interface ClaimedCoupon {
  code: string;
  claimedAt: number;
  usedAt: number | null;
}

export type InboxKind = 'campaign' | 'order' | 'price' | 'return' | 'coupon';

export interface InboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  body: string;
  at: number;
  read: boolean;
}

export type OrderStage =
  | 'placed'
  | 'preparing'
  | 'shipped'
  | 'transfer'
  | 'delayed'
  | 'out_for_delivery'
  | 'delivery_failed'
  | 'delivered'
  | 'cancelled';

export interface OrderEvent {
  stage: OrderStage;
  at: number;
  title: string;
  detail: string;
}

export type ReturnStage = 'requested' | 'code_created' | 'picked_up' | 'received' | 'refunded';

export interface ReturnEvent {
  stage: ReturnStage;
  at: number;
  title: string;
  detail: string;
}

export interface ReturnInfo {
  requestedAt: number;
  reason: string;
  events: ReturnEvent[];
  refundedAt: number | null;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  couponCode: string | null;
  total: number;
  createdAt: number;
  dayMs: number;
  address: string;
  addressTitle: string;
  cargoCompany: string;
  trackingNumber: string;
  events: OrderEvent[];
  initialEstimate: number;
  cancelledAt: number | null;
  notificationIds: string[];
  notifiedEventCount: number;
  returnInfo: ReturnInfo | null;
}
