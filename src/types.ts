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

export interface Economy {
  startingCredit: number;
  adReward: number;
  adCooldownSeconds: number;
  freeShippingThreshold: number;
  shippingFee: number;
}

export interface Catalog {
  version: number;
  updatedAt: string;
  economy: Economy;
  categories: Category[];
  products: Product[];
}

export interface CartItem {
  product: Product;
  quantity: number;
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

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: number;
  address: string;
  cargoCompany: string;
  trackingNumber: string;
  events: OrderEvent[];
  initialEstimate: number;
  cancelledAt: number | null;
  notificationIds: string[];
}
