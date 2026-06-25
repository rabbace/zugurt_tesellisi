import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../utils/products';

export const INITIAL_BALANCE = 9_999_999_999;

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PurchaseRecord {
  id: string;
  productId: string;
  productName: string;
  emoji: string;
  price: number;
  quantity: number;
  dopamineGained: number;
  timestamp: number;
}

interface StoreState {
  balance: number;
  cart: CartItem[];
  dopaminePoints: number;
  purchaseHistory: PurchaseRecord[];

  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;

  checkout: () => PurchaseRecord[];
  buyNow: (product: Product) => PurchaseRecord;

  resetBalance: () => void;
}

function calculateDopamine(price: number, multiplier: number, quantity: number): number {
  const baseDopamine = Math.log10(price + 10) * 10;
  return Math.round(baseDopamine * multiplier * quantity);
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      balance: INITIAL_BALANCE,
      cart: [],
      dopaminePoints: 0,
      purchaseHistory: [],

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existing = state.cart.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { product, quantity }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
      },

      updateCartQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () => {
        return get().cart.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
      },

      checkout: () => {
        const { cart } = get();
        const records: PurchaseRecord[] = cart.map((item) => {
          const dopamineGained = calculateDopamine(
            item.product.price,
            item.product.dopamineMultiplier,
            item.quantity
          );
          return {
            id: `${item.product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            productId: item.product.id,
            productName: item.product.name,
            emoji: item.product.emoji,
            price: item.product.price,
            quantity: item.quantity,
            dopamineGained,
            timestamp: Date.now(),
          };
        });

        const totalSpent = cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        const totalDopamine = records.reduce((sum, record) => sum + record.dopamineGained, 0);

        set((state) => ({
          balance: state.balance - totalSpent,
          dopaminePoints: state.dopaminePoints + totalDopamine,
          purchaseHistory: [...records, ...state.purchaseHistory],
          cart: [],
        }));

        return records;
      },

      buyNow: (product) => {
        const dopamineGained = calculateDopamine(
          product.price,
          product.dopamineMultiplier,
          1
        );
        const record: PurchaseRecord = {
          id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          productId: product.id,
          productName: product.name,
          emoji: product.emoji,
          price: product.price,
          quantity: 1,
          dopamineGained,
          timestamp: Date.now(),
        };

        set((state) => ({
          balance: state.balance - product.price,
          dopaminePoints: state.dopaminePoints + dopamineGained,
          purchaseHistory: [record, ...state.purchaseHistory],
        }));

        return record;
      },

      resetBalance: () => set({ balance: INITIAL_BALANCE }),
    }),
    {
      name: 'zugurt-tesellisi-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
