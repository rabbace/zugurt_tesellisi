import './global.css';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, SafeAreaView, StatusBar, Text, View } from 'react-native';

import { initAds, isSimulatedAd, showRewardedAd } from './src/ads/rewarded';
import { useCatalogStore } from './src/catalog/catalogStore';
import { CardActions } from './src/components/ProductCard';
import { playSuccess, tap } from './src/feedback';
import { formatTL } from './src/format';
import {
  cancelNotifications,
  scheduleCampaignNotifications,
  scheduleOrderNotifications,
  setupNotifications,
} from './src/notifications/orderNotifications';
import { currentStage, NOTIFY_STAGES, reachedEvents } from './src/orders/simulate';
import {
  activeCampaigns,
  campaignAppliesTo,
  computeTotals,
  evaluateCoupon,
  priceCatalog,
  upcomingCampaigns,
} from './src/pricing';
import { AddressBook, CouponPicker, CouponsScreen, InboxScreen } from './src/screens/AccountPages';
import { AccountScreen } from './src/screens/AccountScreen';
import { CartScreen } from './src/screens/CartScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { CampaignScreen, HomeScreen } from './src/screens/HomeScreen';
import { OrderDetail, OrdersScreen } from './src/screens/OrdersScreen';
import { ProductDetail } from './src/screens/ProductDetail';
import { resolveCart, useStore } from './src/store/useStore';
import { THEME_COLORS, useApplyTheme } from './src/theme';
import { Order, PricedProduct } from './src/types';

type Tab = 'home' | 'favorites' | 'cart' | 'orders' | 'account';

type Page =
  | { kind: 'addresses'; selecting: boolean }
  | { kind: 'coupons' }
  | { kind: 'couponPicker' }
  | { kind: 'inbox' }
  | { kind: 'campaign'; id: string };

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'home', label: 'Anasayfa', icon: '🏠' },
  { key: 'favorites', label: 'Favoriler', icon: '❤️' },
  { key: 'cart', label: 'Sepetim', icon: '🛒' },
  { key: 'orders', label: 'Siparişler', icon: '📦' },
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
      <View className="bg-ink rounded-2xl px-4 py-3">
        <Text className="text-page text-sm font-semibold text-center">{message}</Text>
      </View>
    </View>
  );
}

function CountBadge({ count, className = '-top-1 -right-3' }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <View className={`absolute ${className} bg-red-600 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1`}>
      <Text className="text-white text-2xs font-bold">{count > 99 ? '99+' : count}</Text>
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
  const minute = Math.floor(now / 60000);
  const scheme = useApplyTheme(store.theme);
  const colors = THEME_COLORS[scheme];

  const [tab, setTab] = useState<Tab>('home');
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [adLoading, setAdLoading] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initialize } = store;
  const { economy } = catalog;

  useEffect(() => {
    const init = () => initialize(economy.startingCredit);
    if (useStore.persist.hasHydrated()) init();
    return useStore.persist.onFinishHydration(init);
  }, [initialize, economy.startingCredit]);

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

  const products = useMemo(
    () => priceCatalog(catalog.products, catalog.campaigns, minute * 60000),
    [catalog.products, catalog.campaigns, minute]
  );
  const productById = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const cartItems = useMemo(() => resolveCart(store.cart, products), [store.cart, products]);
  const selectedCoupon = catalog.coupons.find((c) => c.code === couponCode);
  const couponCheck = selectedCoupon ? evaluateCoupon(selectedCoupon, cartItems, now) : null;
  const appliedCoupon = couponCheck?.ok ? couponCode : null;
  const totals = computeTotals(cartItems, economy, couponCheck?.ok ? couponCheck.discount : 0);
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const unread = store.inbox.filter((i) => !i.read).length;
  const usableCoupons = store.coupons.filter((c) => {
    const coupon = catalog.coupons.find((x) => x.code === c.code);
    return !c.usedAt && !!coupon && now < Date.parse(coupon.validUntil) && now >= Date.parse(coupon.validFrom);
  }).length;
  const address = store.addresses.find((a) => a.id === store.selectedAddressId) ?? store.addresses[0];
  const openOrder = store.orders.find((o) => o.id === openOrderId) ?? null;
  const openProduct = openProductId ? (productById(openProductId) ?? null) : null;

  const deliveredProductIds = useMemo(
    () =>
      new Set(
        store.orders.filter((o) => currentStage(o, now) === 'delivered').flatMap((o) => o.items.map((i) => i.product.id))
      ),
    [store.orders, now]
  );

  const adCooldownLeft = store.lastAdAt
    ? Math.max(0, Math.ceil((store.lastAdAt + economy.adCooldownSeconds * 1000 - now) / 1000))
    : 0;

  // Kampanya başlangıçlarını, kargo/iade adımlarını ve favori fiyat düşüşlerini bildirim kutusuna yazar.
  useEffect(() => {
    if (!store.initialized) return;
    const s = useStore.getState();

    for (const c of activeCampaigns(catalog.campaigns, now)) {
      if (s.announcedCampaigns.includes(c.id)) continue;
      s.markCampaignAnnounced(c.id);
      s.pushInbox({ kind: 'campaign', title: `${c.emoji} ${c.title} başladı!`, body: c.subtitle });
    }

    for (const o of s.orders) {
      if (o.cancelledAt === null) {
        const reached = reachedEvents(o, now);
        if (reached.length > o.notifiedEventCount) {
          reached
            .slice(o.notifiedEventCount)
            .filter((e) => NOTIFY_STAGES.includes(e.stage))
            .forEach((e) =>
              s.pushInbox({
                kind: 'order',
                title: `${e.title} · #${o.id}`,
                body: e.stage === 'delivered' ? 'Ürünlerini değerlendirmeyi unutma! ✍️' : e.detail,
                at: e.at,
              })
            );
          s.setNotifiedEventCount(o.id, reached.length);
        }
      }
      const refund = o.returnInfo?.events[o.returnInfo.events.length - 1];
      if (o.returnInfo && o.returnInfo.refundedAt === null && refund && refund.at <= now) {
        s.completeRefund(o.id);
        s.pushInbox({ kind: 'return', title: `İaden tamamlandı · #${o.id}`, body: `${formatTL(o.total)} sanal kredine yüklendi.` });
      }
    }

    for (const f of s.favorites) {
      const p = products.find((x) => x.id === f.productId);
      if (!p || p.price === f.lastNotifiedPrice) continue;
      if (p.price < f.lastNotifiedPrice) {
        s.pushInbox({
          kind: 'price',
          title: '📉 Favorindeki ürünün fiyatı düştü',
          body: `${p.brand} ${p.title}: ${formatTL(f.lastNotifiedPrice)} → ${formatTL(p.price)}`,
        });
      }
      s.markFavoriteNotified(p.id, p.price);
    }
  }, [now, store.initialized, catalog.campaigns, products]);

  const favoriteKey = store.favorites.map((f) => f.productId).join(',');
  useEffect(() => {
    if (!store.initialized) return;
    let cancelled = false;
    (async () => {
      const s = useStore.getState();
      await cancelNotifications(s.campaignNotificationIds);
      const plan = upcomingCampaigns(catalog.campaigns, Date.now()).map((campaign) => ({
        campaign,
        favoriteCount: s.favorites.filter((f) => {
          const p = catalog.products.find((x) => x.id === f.productId);
          return !!p && campaignAppliesTo(campaign, p);
        }).length,
      }));
      const ids = await scheduleCampaignNotifications(plan);
      if (!cancelled) s.setCampaignNotificationIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [store.initialized, catalog.campaigns, catalog.products, favoriteKey]);

  const favorites = store.favorites;
  const actions: CardActions = useMemo(
    () => ({
      onOpen: (p: PricedProduct) => {
        setOpenProductId(p.id);
        useStore.getState().viewProduct(p.id);
      },
      onAdd: (p: PricedProduct) => {
        useStore.getState().addToCart(p, 1);
        tap();
        showToast(`${p.brand} ${p.title} sepete eklendi`);
      },
      isFavorite: (id: string) => favorites.some((f) => f.productId === id),
      onToggleFavorite: (p: PricedProduct) => {
        const added = useStore.getState().toggleFavorite(p);
        tap();
        showToast(added ? '❤️ Favorilere eklendi. Fiyatı düşünce haber vereceğiz.' : 'Favorilerden çıkarıldı');
      },
    }),
    [favorites, showToast]
  );

  const handleCheckout = useCallback(async () => {
    const s = useStore.getState();
    const result = s.placeOrder(cartItems, economy, appliedCoupon, totals.discount);
    if (!result.ok) {
      showToast(result.reason);
      return;
    }
    setCouponCode(null);
    setTab('orders');
    showToast(`Siparişin alındı! ${formatTL(result.order.total)} sanal kredinden düşüldü 🎉`);
    playSuccess();
    const ids = await scheduleOrderNotifications(result.order);
    if (ids.length) s.attachNotifications(result.order.id, ids);
  }, [cartItems, economy, appliedCoupon, totals.discount, showToast]);

  const handleCancel = useCallback(
    (order: Order) => {
      const cancelled = useStore.getState().cancelOrder(order.id);
      if (!cancelled) {
        showToast('Bu sipariş artık iptal edilemez, kargoya verildi.');
        return;
      }
      cancelNotifications(order.notificationIds);
      showToast(`Sipariş iptal edildi, ${formatTL(order.total)} iade edildi`);
    },
    [showToast]
  );

  const handleReturn = useCallback(
    (order: Order, reason: string) => {
      const updated = useStore.getState().requestReturn(order.id, reason, economy.returnDays);
      showToast(updated ? '↩️ İade talebin alındı. Kurye paketi adresinden alacak.' : 'Bu sipariş için iade süresi doldu.');
    },
    [economy.returnDays, showToast]
  );

  const handleWatchAd = useCallback(async () => {
    if (adLoading || adCooldownLeft > 0) return;
    setAdLoading(true);
    const earned = await showRewardedAd();
    setAdLoading(false);
    if (earned) {
      useStore.getState().rewardAd(economy.adReward);
      playSuccess();
      showToast(`+${formatTL(economy.adReward)} sanal kredi kazandın!`);
    } else {
      showToast('Reklam şu an yüklenemedi veya yarıda kapatıldı. Biraz sonra tekrar dene.');
    }
  }, [adLoading, adCooldownLeft, economy.adReward, showToast]);

  const handleReset = useCallback(() => {
    const s = useStore.getState();
    s.orders.forEach((o) => cancelNotifications(o.notificationIds));
    s.resetAll(economy.startingCredit);
    setCouponCode(null);
    setTab('home');
    showToast('Hesap sıfırlandı, krediler yenilendi');
  }, [economy.startingCredit, showToast]);

  const handleRefreshCatalog = useCallback(async () => {
    const ok = await refreshCatalog();
    showToast(ok ? 'Fiyatlar güncellendi' : 'Fiyatlar güncellenemedi, internet bağlantını kontrol et');
  }, [refreshCatalog, showToast]);

  const openInbox = () => {
    setPage({ kind: 'inbox' });
    store.markInboxRead();
  };

  const recentlyViewed = store.recentlyViewed.map(productById).filter((p): p is PricedProduct => !!p);
  const campaignPage = page?.kind === 'campaign' ? catalog.campaigns.find((c) => c.id === page.id) : undefined;

  return (
    <SafeAreaView className="flex-1 bg-page" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.card} />

      <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-line">
        <Text className="text-link text-base font-extrabold flex-1 mr-2" numberOfLines={1}>
          Züğürt Tesellisi
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable onPress={openInbox} hitSlop={8} className="active:opacity-60" accessibilityLabel="Bildirimler">
            <Text className="text-2xl">🔔</Text>
            <CountBadge count={unread} className="-top-1 -right-2" />
          </Pressable>
          <Pressable onPress={() => setTab('account')} className="bg-chip rounded-full px-3 py-1.5 active:opacity-70">
            <Text className="text-link font-bold text-xs">💰 {formatTL(store.credit)}</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1">
        {tab === 'home' && (
          <HomeScreen
            catalog={catalog}
            products={products}
            now={now}
            placeholderColor={colors.muted}
            recentlyViewed={recentlyViewed}
            recentSearches={store.recentSearches}
            actions={actions}
            onSearch={store.addRecentSearch}
            onClearSearches={store.clearRecentSearches}
            onOpenCampaign={(c) => setPage({ kind: 'campaign', id: c.id })}
          />
        )}
        {tab === 'favorites' && <FavoritesScreen favorites={store.favorites} products={products} actions={actions} />}
        {tab === 'cart' && (
          <CartScreen
            items={cartItems}
            totals={totals}
            economy={economy}
            credit={store.credit}
            address={address}
            couponCode={appliedCoupon}
            usableCouponCount={usableCoupons}
            onQuantity={store.setQuantity}
            onRemove={store.removeFromCart}
            onCheckout={handleCheckout}
            onEarnCredit={() => setTab('account')}
            onChangeAddress={() => setPage({ kind: 'addresses', selecting: true })}
            onChooseCoupon={() => setPage({ kind: 'couponPicker' })}
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
            theme={store.theme}
            switchOffColor={colors.line}
            addressCount={store.addresses.length}
            couponCount={usableCoupons}
            unreadCount={unread}
            reviewCount={store.reviews.length}
            lastFetchedAt={lastFetchedAt}
            onWatchAd={handleWatchAd}
            onFastMode={store.setFastMode}
            onTheme={store.setTheme}
            onOpenAddresses={() => setPage({ kind: 'addresses', selecting: false })}
            onOpenCoupons={() => setPage({ kind: 'coupons' })}
            onOpenInbox={openInbox}
            onOpenOrders={() => setTab('orders')}
            onOpenFavorites={() => setTab('favorites')}
            onRefreshCatalog={handleRefreshCatalog}
            onReset={handleReset}
          />
        )}
      </View>

      <View className="flex-row bg-card border-t border-line pb-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} className="flex-1 items-center pt-2 active:opacity-60">
              <View>
                <Text className="text-xl text-center">{t.icon}</Text>
                {t.key === 'cart' && <CountBadge count={cartCount} />}
                {t.key === 'favorites' && <CountBadge count={store.favorites.length} />}
              </View>
              <Text className={`text-2xs mt-0.5 ${active ? 'text-link font-bold' : 'text-muted'}`}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Toast message={toast} />

      {page && (
        <Modal visible animationType="slide" onRequestClose={() => setPage(null)}>
          {page.kind === 'addresses' && (
            <AddressBook
              addresses={store.addresses}
              selectedId={address?.id ?? ''}
              placeholderColor={colors.muted}
              selecting={page.selecting}
              onSelect={store.selectAddress}
              onSave={(a) => {
                store.saveAddress(a);
                showToast('Adres kaydedildi');
              }}
              onRemove={store.removeAddress}
              onClose={() => setPage(null)}
            />
          )}
          {page.kind === 'coupons' && (
            <CouponsScreen
              coupons={catalog.coupons}
              claimed={store.coupons}
              now={now}
              onClaim={(code) => {
                if (store.claimCoupon(code)) showToast(`🎟️ ${code} kuponu hesabına eklendi`);
              }}
              onClose={() => setPage(null)}
            />
          )}
          {page.kind === 'couponPicker' && (
            <CouponPicker
              coupons={catalog.coupons}
              claimed={store.coupons}
              items={cartItems}
              now={now}
              selected={appliedCoupon}
              onSelect={setCouponCode}
              onClose={() => setPage(null)}
            />
          )}
          {page.kind === 'inbox' && <InboxScreen items={store.inbox} onClose={() => setPage(null)} />}
          {campaignPage && (
            <CampaignScreen campaign={campaignPage} products={products} now={now} actions={actions} onClose={() => setPage(null)} />
          )}
        </Modal>
      )}

      <OrderDetail
        order={openOrder}
        now={now}
        returnDays={economy.returnDays}
        reviewedProductIds={store.reviews.map((r) => r.productId)}
        onClose={() => setOpenOrderId(null)}
        onCancel={handleCancel}
        onReturn={handleReturn}
        onOpenProduct={(id) => {
          setOpenOrderId(null);
          setOpenProductId(id);
        }}
      />

      <ProductDetail
        product={openProduct}
        category={catalog.categories.find((c) => c.id === openProduct?.categoryId)}
        economy={economy}
        similar={
          openProduct ? products.filter((p) => p.categoryId === openProduct.categoryId && p.id !== openProduct.id).slice(0, 8) : []
        }
        now={now}
        myReviews={store.reviews}
        helpfulVotes={store.helpfulVotes}
        canReview={!!openProduct && deliveredProductIds.has(openProduct.id)}
        placeholderColor={colors.muted}
        actions={actions}
        onClose={() => setOpenProductId(null)}
        onAdd={(p, q) => {
          store.addToCart(p, q);
          tap();
          showToast(`${p.brand} ${p.title} sepete eklendi`);
          setOpenProductId(null);
        }}
        onBuyNow={(p, q) => {
          store.addToCart(p, q);
          setOpenProductId(null);
          setPage(null);
          setTab('cart');
        }}
        onSubmitReview={(id, rating, text) => {
          store.addReview(id, rating, text);
          showToast('Yorumun yayınlandı, teşekkürler! +5 teselli puanı');
        }}
        onToggleHelpful={store.toggleHelpful}
      />
    </SafeAreaView>
  );
}
