import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import bundledCatalog from '../../public/catalog.json';
import { Catalog } from '../types';

export const CATALOG_URL = 'https://rabbace.github.io/zugurt_tesellisi/catalog.json';
const FETCH_TIMEOUT_MS = 10000;

const fallback = bundledCatalog as unknown as Catalog;

function isCatalog(value: unknown): value is Catalog {
  const c = value as Catalog;
  return (
    !!c &&
    typeof c.version === 'number' &&
    !!c.economy &&
    Array.isArray(c.categories) &&
    Array.isArray(c.products) &&
    c.products.length > 0
  );
}

interface CatalogState {
  catalog: Catalog;
  source: 'bundled' | 'remote';
  lastFetchedAt: number | null;
  refresh: () => Promise<boolean>;
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set) => ({
      catalog: fallback,
      source: 'bundled',
      lastFetchedAt: null,
      refresh: async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        try {
          const res = await fetch(`${CATALOG_URL}?t=${Date.now()}`, { signal: controller.signal });
          if (!res.ok) return false;
          const data: unknown = await res.json();
          if (!isCatalog(data)) return false;
          set({ catalog: data, source: 'remote', lastFetchedAt: Date.now() });
          return true;
        } catch {
          return false;
        } finally {
          clearTimeout(timer);
        }
      },
    }),
    {
      name: 'zugurt-catalog',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ catalog: s.catalog, source: s.source, lastFetchedAt: s.lastFetchedAt }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CatalogState> | undefined;
        if (!saved?.catalog || !isCatalog(saved.catalog)) return current;
        if (
          saved.catalog.version < fallback.version ||
          saved.catalog.updatedAt < fallback.updatedAt
        ) {
          return current;
        }
        return { ...current, ...saved };
      },
    }
  )
);
