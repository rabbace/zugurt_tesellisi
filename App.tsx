import './global.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, StatusBar, Text, View } from 'react-native';

import { initAds, isSimulatedAd, showRewardedAd } from './src/ads/rewarded';
import { useCatalogStore } from './src/catalog/catalogStore';
import { playSuccess, tap } from './src/feedback';
import { formatTL } from './src/format';
import {
  cancelOrderNotifications,
  scheduleOrderNotifications,
  setupNotifications,
} from './src/notifications/orderNotifications';
import { AccountScreen } from './src/screens/AccountScreen';
import { CartScreen } from './src/screens/CartScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { OrderDetail, OrdersScreen } from './src/screens/OrdersScreen';
import { ProductDetail } from './src/screens/ProductDetail';
import { computeTotals, resolveCart, useStore } from './src/store/useStore';
import { Order, Product } from './src/types';

type Tab = 'home' | 'cart' | 'orders' | 'account';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: 'Anasayfa', icon: '🏠' },
  { key: 'cart', label: 'Sepetim', icon: '🛒' },
  { key: 'orders', label: 'Siparişlerim', icon: '📦' },
  { key: 'account', label: 'Hesabım', icon: '👤' },
];

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View pointerEvents="none" className="absolute bottom-24 left-4 right-4 items-center z-50">
      <View className="bg-slate-900 rounded-2xl px-4 py-3">
        <Text className="text-white text-sm font-semibold text-center">{message}</Text>
      </View>
    </View>
  );
}

export default function App() {
  const catalog = useCatalogStore((s) => s.catalog);
  const catalogSource = useCatalogStore((s) => s.source);
  const lastFetchedAt = useCatalogStore((s) => s.lastFetchedAt);
  const refreshCatalog = useCatalogStore((s) => s.refresh);

  const store = useStore();
  const now = useNow(5000);

  const [tab, setTab] = useState<Tab>('home');
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initialize } = store;
  const startingCredit = catalog.economy.startingCredit;

  useEffect(() => {
    const init = () => initialize(startingCredit);
    if (useStore.persist.hasHydrated()) init();
    return useStore.persist.onFinishHydration(init);
  }, [initialize, startingCredit]);

  useEffect(() => {
    refreshCatalog();
    setupNotifications();
    initAds();
  }, [refreshCatalog]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const cartItems = useMemo(() => resolveCart(store.cart, catalog.products), [store.cart, catalog.products]);
  const totals = useMemo(() => computeTotals(cartItems, catalog.economy), [cartItems, catalog.economy]);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const openOrder = store.orders.find((o) => o.id === openOrderId) ?? null;

  const adCooldownLeft = store.lastAdAt
    ? Math.max(0, Math.ceil((store.lastAdAt + catalog.economy.adCooldownSeconds * 1000 - now) / 1000))
    : 0;

  const handleAdd = useCallback(
    (product: Product, quantity = 1) => {
      store.addToCart(product, quantity);
      tap();
      showToast(`${product.brand} ${product.title} sepete eklendi`);
    },
    [store, showToast]
  );

  const handleBuyNow = useCallback(
    (product: Product, quantity: number) => {
      store.addToCart(product, quantity);
      setOpenProduct(null);
      setTab('cart');
    },
    [store]
  );

  const handleCheckout = useCallback(async () => {
    const result = store.placeOrder(cartItems, catalog.economy);
    if (!result.ok) {
      showToast(result.reason);
      return;
    }
    setTab('orders');
    showToast(`Siparişin alındı! ${formatTL(result.order.total)} sanal kredinden düşüldü 🎉`);
    playSuccess();
    const ids = await scheduleOrderNotifications(result.order);
    if (ids.length) store.attachNotifications(result.order.id, ids);
  }, [store, cartItems, catalog.economy, showToast]);

  const handleCancel = useCallback(
    (order: Order) => {
      const cancelled = store.cancelOrder(order.id);
      if (!cancelled) {
        showToast('Bu sipariş artık iptal edilemez, kargoya verildi.');
        return;
      }
      cancelOrderNotifications(order.notificationIds);
      showToast(`Sipariş iptal edildi, ${formatTL(order.total)} iade edildi`);
    },
    [store, showToast]
  );

  const handleWatchAd = useCallback(async () => {
    if (adLoading || adCooldownLeft > 0) return;
    setAdLoading(true);
    const earned = await showRewardedAd();
    setAdLoading(false);
    if (earned) {
      store.rewardAd(catalog.economy.adReward);
      playSuccess();
      showToast(`+${formatTL(catalog.economy.adReward)} sanal kredi kazandın!`);
    } else {
      showToast('Reklam şu an yüklenemedi veya yarıda kapatıldı. Biraz sonra tekrar dene.');
    }
  }, [adLoading, adCooldownLeft, store, catalog.economy.adReward, showToast]);

  const handleReset = useCallback(() => {
    store.orders.forEach((o) => cancelOrderNotifications(o.notificationIds));
    store.resetAll(catalog.economy.startingCredit);
    setTab('home');
    showToast('Hesap sıfırlandı, krediler yenilendi');
  }, [store, catalog.economy.startingCredit, showToast]);

  const handleRefreshCatalog = useCallback(async () => {
    const ok = await refreshCatalog();
    showToast(ok ? 'Fiyatlar güncellendi' : 'Fiyatlar güncellenemedi, internet bağlantını kontrol et');
  }, [refreshCatalog, showToast]);

  return (
    <SafeAreaView className="flex-1 bg-page" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <Text className="text-brand text-xl font-extrabold">Züğürt Tesellisi</Text>
        <Pressable onPress={() => setTab('account')} className="bg-brand-light rounded-full px-3 py-1.5 active:opacity-70">
          <Text className="text-brand font-bold text-xs">💰 {formatTL(store.credit)}</Text>
        </Pressable>
      </View>

      <View className="flex-1">
        {tab === 'home' && <HomeScreen catalog={catalog} onOpen={setOpenProduct} onAdd={(p) => handleAdd(p)} />}
        {tab === 'cart' && (
          <CartScreen
            items={cartItems}
            totals={totals}
            economy={catalog.economy}
            credit={store.credit}
            address={store.address}
            onQuantity={store.setQuantity}
            onRemove={store.removeFromCart}
            onCheckout={handleCheckout}
            onEarnCredit={() => setTab('account')}
          />
        )}
        {tab === 'orders' && <OrdersScreen orders={store.orders} now={now} onOpen={(o) => setOpenOrderId(o.id)} />}
        {tab === 'account' && (
          <AccountScreen
            credit={store.credit}
            catalog={catalog}
            catalogSource={catalogSource}
            dopaminePoints={store.dopaminePoints}
            totalSpent={store.totalSpent}
            orderCount={store.orders.length}
            adsWatched={store.adsWatched}
            adCooldownLeft={adCooldownLeft}
            adLoading={adLoading}
            isSimulatedAd={isSimulatedAd}
            fastMode={store.fastMode}
            address={store.address}
            lastFetchedAt={lastFetchedAt}
            onWatchAd={handleWatchAd}
            onFastMode={store.setFastMode}
            onAddress={(a) => {
              store.setAddress(a);
              showToast('Adres kaydedildi');
            }}
            onRefreshCatalog={handleRefreshCatalog}
            onReset={handleReset}
          />
        )}
      </View>

      <View className="flex-row bg-white border-t border-slate-100 pb-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} className="flex-1 items-center pt-2 active:opacity-60">
              <View>
                <Text className="text-xl text-center">{t.icon}</Text>
                {t.key === 'cart' && cartCount > 0 && (
                  <View className="absolute -top-1 -right-3 bg-red-600 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
                    <Text className="text-white text-[10px] font-bold">{cartCount}</Text>
                  </View>
                )}
              </View>
              <Text className={`text-[11px] mt-0.5 ${active ? 'text-brand font-bold' : 'text-slate-500'}`}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Toast message={toast} />

      <ProductDetail
        product={openProduct}
        category={catalog.categories.find((c) => c.id === openProduct?.categoryId)}
        economy={catalog.economy}
        onClose={() => setOpenProduct(null)}
        onAdd={(p, q) => {
          handleAdd(p, q);
          setOpenProduct(null);
        }}
        onBuyNow={handleBuyNow}
      />

      <OrderDetail order={openOrder} now={now} onClose={() => setOpenOrderId(null)} onCancel={handleCancel} />
    </SafeAreaView>
  );
}
