import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildOrder, canCancel } from '../orders/simulate';
import { CartItem, Economy, Order, Product } from '../types';

export const DEFAULT_ADDRESS = 'Teselli Mah. Hayal Sok. No: 7 D: 3, Kadıköy / İstanbul';

export interface CartTotals {
  subtotal: number;
  shippingFee: number;
  total: number;
  remainingForFreeShipping: number;
}

export function computeTotals(items: CartItem[], economy: Economy): CartTotals {
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const allFree = items.length > 0 && items.every((i) => i.product.freeShipping);
  const qualifies = allFree || subtotal >= economy.freeShippingThreshold;
  const shippingFee = items.length === 0 || qualifies ? 0 : economy.shippingFee;
  return {
    subtotal,
    shippingFee,
    total: subtotal + shippingFee,
    remainingForFreeShipping: qualifies ? 0 : economy.freeShippingThreshold - subtotal,
  };
}

export function resolveCart(cart: CartItem[], products: Product[]): CartItem[] {
  return cart.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.product.id) ?? item.product,
  }));
}

function dopamineFor(total: number): number {
  return Math.round(Math.log10(total + 10) * 10);
}

export type PlaceOrderResult = { ok: true; order: Order } | { ok: false; reason: string };

interface StoreState {
  initialized: boolean;
  credit: number;
  cart: CartItem[];
  orders: Order[];
  dopaminePoints: number;
  totalSpent: number;
  adsWatched: number;
  lastAdAt: number | null;
  fastMode: boolean;
  address: string;

  initialize: (startingCredit: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  placeOrder: (items: CartItem[], economy: Economy) => PlaceOrderResult;
  attachNotifications: (orderId: string, ids: string[]) => void;
  cancelOrder: (orderId: string) => Order | null;
  rewardAd: (amount: number) => void;
  setFastMode: (value: boolean) => void;
  setAddress: (value: string) => void;
  resetAll: (startingCredit: number) => void;
}

const initialData = {
  initialized: false,
  credit: 0,
  cart: [] as CartItem[],
  orders: [] as Order[],
  dopaminePoints: 0,
  totalSpent: 0,
  adsWatched: 0,
  lastAdAt: null as number | null,
  fastMode: true,
  address: DEFAULT_ADDRESS,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialData,

      initialize: (startingCredit) => {
        if (get().initialized) return;
        set({ initialized: true, credit: startingCredit });
      },

      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((i) =>
                i.product.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                  : i
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity: Math.min(quantity, product.stock) }] };
        }),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((i) => i.product.id !== productId)
              : state.cart.map((i) =>
                  i.product.id === productId
                    ? { ...i, quantity: Math.min(quantity, i.product.stock) }
                    : i
                ),
        })),

      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((i) => i.product.id !== productId) })),

      placeOrder: (items, economy) => {
        if (items.length === 0) return { ok: false, reason: 'Sepetin boş.' };
        const totals = computeTotals(items, economy);
        const { credit, address, fastMode } = get();
        if (totals.total > credit) {
          return { ok: false, reason: 'Sanal kredin yetersiz. Reklam izleyerek kredi kazanabilirsin.' };
        }
        const order = buildOrder({
          items,
          subtotal: totals.subtotal,
          shippingFee: totals.shippingFee,
          address,
          fastMode,
        });
        set((state) => ({
          credit: state.credit - order.total,
          totalSpent: state.totalSpent + order.total,
          dopaminePoints: state.dopaminePoints + dopamineFor(order.total),
          orders: [order, ...state.orders],
          cart: state.cart.filter((c) => !items.some((i) => i.product.id === c.product.id)),
        }));
        return { ok: true, order };
      },

      attachNotifications: (orderId, ids) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, notificationIds: ids } : o)),
        })),

      cancelOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        const now = Date.now();
        if (!order || !canCancel(order, now)) return null;
        const cancelled: Order = { ...order, cancelledAt: now };
        set((state) => ({
          credit: state.credit + order.total,
          totalSpent: state.totalSpent - order.total,
          orders: state.orders.map((o) => (o.id === orderId ? cancelled : o)),
        }));
        return cancelled;
      },

      rewardAd: (amount) =>
        set((state) => ({
          credit: state.credit + amount,
          adsWatched: state.adsWatched + 1,
          lastAdAt: Date.now(),
        })),

      setFastMode: (value) => set({ fastMode: value }),

      setAddress: (value) => set({ address: value }),

      resetAll: (startingCredit) =>
        set({ ...initialData, initialized: true, credit: startingCredit }),
    }),
    {
      name: 'zugurt-tesellisi-storage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: () => ({ ...initialData }) as unknown as StoreState,
      partialize: (state) => ({
        initialized: state.initialized,
        credit: state.credit,
        cart: state.cart,
        orders: state.orders,
        dopaminePoints: state.dopaminePoints,
        totalSpent: state.totalSpent,
        adsWatched: state.adsWatched,
        lastAdAt: state.lastAdAt,
        fastMode: state.fastMode,
        address: state.address,
      }),
    }
  )
);
