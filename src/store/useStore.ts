import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { buildOrder, buildReturn, canCancel, canReturn, FAST_DAY_MS } from '../orders/simulate';
import { computeTotals } from '../pricing';
import { ThemeMode } from '../theme';
import {
  Address,
  CartItem,
  ClaimedCoupon,
  Economy,
  Favorite,
  InboxItem,
  Order,
  Product,
  UserReview,
} from '../types';

export const WELCOME_COUPON = 'HOSGELDIN';

const DEFAULT_ADDRESS: Address = {
  id: 'ev',
  title: 'Ev',
  fullName: 'Züğürt Kullanıcı',
  phone: '05551234567',
  city: 'İstanbul',
  district: 'Kadıköy',
  line: 'Teselli Mah. Hayal Sok. No: 7 D: 3',
};

export function formatAddress(a: Address): string {
  return `${a.line}, ${a.district} / ${a.city}`;
}

export function resolveCart<T extends Product>(cart: CartItem[], products: T[]): CartItem[] {
  return cart.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.product.id) ?? item.product,
  }));
}

function dopamineFor(total: number): number {
  return Math.round(Math.log10(total + 10) * 10);
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
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
  theme: ThemeMode;
  addresses: Address[];
  selectedAddressId: string;
  favorites: Favorite[];
  reviews: UserReview[];
  helpfulVotes: string[];
  coupons: ClaimedCoupon[];
  inbox: InboxItem[];
  announcedCampaigns: string[];
  campaignNotificationIds: string[];
  recentlyViewed: string[];
  recentSearches: string[];

  initialize: (startingCredit: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  placeOrder: (items: CartItem[], economy: Economy, couponCode: string | null, couponDiscount: number) => PlaceOrderResult;
  attachNotifications: (orderId: string, ids: string[]) => void;
  cancelOrder: (orderId: string) => Order | null;
  requestReturn: (orderId: string, reason: string, returnDays: number) => Order | null;
  completeRefund: (orderId: string) => void;
  setNotifiedEventCount: (orderId: string, count: number) => void;
  rewardAd: (amount: number) => void;
  setFastMode: (value: boolean) => void;
  setTheme: (value: ThemeMode) => void;
  saveAddress: (address: Address) => void;
  removeAddress: (id: string) => void;
  selectAddress: (id: string) => void;
  toggleFavorite: (product: Product) => boolean;
  markFavoriteNotified: (productId: string, price: number) => void;
  addReview: (productId: string, rating: number, text: string) => void;
  toggleHelpful: (reviewId: string) => void;
  claimCoupon: (code: string) => boolean;
  pushInbox: (item: Omit<InboxItem, 'id' | 'read' | 'at'> & { at?: number }) => void;
  markInboxRead: () => void;
  markCampaignAnnounced: (id: string) => void;
  setCampaignNotificationIds: (ids: string[]) => void;
  viewProduct: (productId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
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
  theme: 'system' as ThemeMode,
  addresses: [DEFAULT_ADDRESS] as Address[],
  selectedAddressId: DEFAULT_ADDRESS.id,
  favorites: [] as Favorite[],
  reviews: [] as UserReview[],
  helpfulVotes: [] as string[],
  coupons: [] as ClaimedCoupon[],
  inbox: [] as InboxItem[],
  announcedCampaigns: [] as string[],
  campaignNotificationIds: [] as string[],
  recentlyViewed: [] as string[],
  recentSearches: [] as string[],
};

type PersistedV3 = Partial<typeof initialData> & { address?: string; orders?: Partial<Order>[] };

function migrateFromV3(old: PersistedV3): typeof initialData {
  const address: Address = old.address
    ? { ...DEFAULT_ADDRESS, line: old.address, district: '', city: '' }
    : DEFAULT_ADDRESS;
  const orders = (old.orders ?? []).map((o) =>
    Object.assign(
      { discount: 0, couponCode: null, dayMs: FAST_DAY_MS, addressTitle: 'Ev', returnInfo: null },
      o,
      { notifiedEventCount: o.events?.length ?? 0 }
    )
  ) as Order[];
  return {
    ...initialData,
    ...old,
    orders,
    addresses: [address],
    selectedAddressId: address.id,
    coupons: [{ code: WELCOME_COUPON, claimedAt: Date.now(), usedAt: null }],
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialData,

      initialize: (startingCredit) => {
        if (get().initialized) return;
        const now = Date.now();
        set({
          initialized: true,
          credit: startingCredit,
          coupons: [{ code: WELCOME_COUPON, claimedAt: now, usedAt: null }],
          inbox: [
            {
              id: uid('in'),
              kind: 'coupon',
              title: 'Hoş geldin',
              body: 'İlk siparişin için HOSGELDIN kuponunu cebine koydum. 2.500 TL üstüne 500 TL indirim.',
              at: now,
              read: false,
            },
          ],
        });
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
                  i.product.id === productId ? { ...i, quantity: Math.min(quantity, i.product.stock) } : i
                ),
        })),

      removeFromCart: (productId) =>
        set((state) => ({ cart: state.cart.filter((i) => i.product.id !== productId) })),

      placeOrder: (items, economy, couponCode, couponDiscount) => {
        if (items.length === 0) return { ok: false, reason: 'Sepetin boş.' };
        const { credit, fastMode, addresses, selectedAddressId } = get();
        const address = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
        if (!address) return { ok: false, reason: 'Önce bir teslimat adresi ekle.' };
        const totals = computeTotals(items, economy, couponDiscount);
        if (totals.total > credit) {
          return { ok: false, reason: 'Sanal kredin yetersiz. Reklam izleyerek kredi kazanabilirsin.' };
        }
        const order = buildOrder({
          items,
          subtotal: totals.subtotal,
          shippingFee: totals.shippingFee,
          discount: totals.discount,
          couponCode: totals.discount > 0 ? couponCode : null,
          address: `${address.fullName} · ${formatAddress(address)}`,
          addressTitle: address.title,
          fastMode,
        });
        set((state) => ({
          credit: Math.round((state.credit - order.total) * 100) / 100,
          totalSpent: state.totalSpent + order.total,
          dopaminePoints: state.dopaminePoints + dopamineFor(order.total),
          orders: [order, ...state.orders],
          cart: state.cart.filter((c) => !items.some((i) => i.product.id === c.product.id)),
          coupons: order.couponCode
            ? state.coupons.map((c) => (c.code === order.couponCode ? { ...c, usedAt: order.createdAt } : c))
            : state.coupons,
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
          credit: Math.round((state.credit + order.total) * 100) / 100,
          totalSpent: state.totalSpent - order.total,
          orders: state.orders.map((o) => (o.id === orderId ? cancelled : o)),
          coupons: order.couponCode
            ? state.coupons.map((c) => (c.code === order.couponCode ? { ...c, usedAt: null } : c))
            : state.coupons,
        }));
        return cancelled;
      },

      requestReturn: (orderId, reason, returnDays) => {
        const order = get().orders.find((o) => o.id === orderId);
        const now = Date.now();
        if (!order || !canReturn(order, now, returnDays)) return null;
        const updated: Order = { ...order, returnInfo: buildReturn(order, reason, now) };
        set((state) => ({ orders: state.orders.map((o) => (o.id === orderId ? updated : o)) }));
        return updated;
      },

      completeRefund: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order?.returnInfo || order.returnInfo.refundedAt !== null) return;
        const now = Date.now();
        set((state) => ({
          credit: Math.round((state.credit + order.total) * 100) / 100,
          totalSpent: state.totalSpent - order.total,
          orders: state.orders.map((o) =>
            o.id === orderId && o.returnInfo ? { ...o, returnInfo: { ...o.returnInfo, refundedAt: now } } : o
          ),
        }));
      },

      setNotifiedEventCount: (orderId, count) =>
        set((state) => ({
          orders: state.orders.map((o) => (o.id === orderId ? { ...o, notifiedEventCount: count } : o)),
        })),

      rewardAd: (amount) =>
        set((state) => ({ credit: state.credit + amount, adsWatched: state.adsWatched + 1, lastAdAt: Date.now() })),

      setFastMode: (value) => set({ fastMode: value }),

      setTheme: (value) => set({ theme: value }),

      saveAddress: (address) =>
        set((state) => {
          const exists = state.addresses.some((a) => a.id === address.id);
          return {
            addresses: exists
              ? state.addresses.map((a) => (a.id === address.id ? address : a))
              : [...state.addresses, address],
            selectedAddressId: state.addresses.length === 0 ? address.id : state.selectedAddressId,
          };
        }),

      removeAddress: (id) =>
        set((state) => {
          const addresses = state.addresses.filter((a) => a.id !== id);
          return {
            addresses,
            selectedAddressId:
              state.selectedAddressId === id ? (addresses[0]?.id ?? '') : state.selectedAddressId,
          };
        }),

      selectAddress: (id) => set({ selectedAddressId: id }),

      toggleFavorite: (product) => {
        const exists = get().favorites.some((f) => f.productId === product.id);
        set((state) => ({
          favorites: exists
            ? state.favorites.filter((f) => f.productId !== product.id)
            : [
                { productId: product.id, addedAt: Date.now(), priceAtAdd: product.price, lastNotifiedPrice: product.price },
                ...state.favorites,
              ],
        }));
        return !exists;
      },

      markFavoriteNotified: (productId, price) =>
        set((state) => ({
          favorites: state.favorites.map((f) => (f.productId === productId ? { ...f, lastNotifiedPrice: price } : f)),
        })),

      addReview: (productId, rating, text) =>
        set((state) => ({
          reviews: [
            { id: uid('rv'), productId, rating, text, createdAt: Date.now() },
            ...state.reviews.filter((r) => r.productId !== productId),
          ],
          dopaminePoints: state.dopaminePoints + 5,
        })),

      toggleHelpful: (reviewId) =>
        set((state) => ({
          helpfulVotes: state.helpfulVotes.includes(reviewId)
            ? state.helpfulVotes.filter((id) => id !== reviewId)
            : [...state.helpfulVotes, reviewId],
        })),

      claimCoupon: (code) => {
        if (get().coupons.some((c) => c.code === code)) return false;
        set((state) => ({ coupons: [...state.coupons, { code, claimedAt: Date.now(), usedAt: null }] }));
        return true;
      },

      pushInbox: (item) =>
        set((state) => ({
          inbox: [{ ...item, id: uid('in'), at: item.at ?? Date.now(), read: false }, ...state.inbox].slice(0, 100),
        })),

      markInboxRead: () => set((state) => ({ inbox: state.inbox.map((i) => ({ ...i, read: true })) })),

      markCampaignAnnounced: (id) =>
        set((state) => ({ announcedCampaigns: [...state.announcedCampaigns, id] })),

      setCampaignNotificationIds: (ids) => set({ campaignNotificationIds: ids }),

      viewProduct: (productId) =>
        set((state) => ({
          recentlyViewed: [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 12),
        })),

      addRecentSearch: (query) =>
        set((state) => {
          const q = query.trim();
          if (q.length < 2) return {};
          return { recentSearches: [q, ...state.recentSearches.filter((s) => s !== q)].slice(0, 8) };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),

      resetAll: (startingCredit) =>
        set((state) => ({
          ...initialData,
          theme: state.theme,
          initialized: true,
          credit: startingCredit,
          coupons: [{ code: WELCOME_COUPON, claimedAt: Date.now(), usedAt: null }],
        })),
    }),
    {
      name: 'zugurt-tesellisi-storage',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted, version) => {
        if (version === 3 || version === 2) return migrateFromV3(persisted as PersistedV3) as unknown as StoreState;
        return { ...initialData } as unknown as StoreState;
      },
      partialize: (state) => {
        const { initialize: _i, ...rest } = state;
        return Object.fromEntries(
          Object.entries(rest).filter(([, v]) => typeof v !== 'function')
        ) as Partial<StoreState>;
      },
    }
  )
);
