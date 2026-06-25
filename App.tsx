import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import {
  getAllCategories,
  getProductsByCategory,
  Product,
  ProductCategory,
} from './src/utils/products';
import { PurchaseRecord, useStore } from './src/store/useStore';

function formatCurrency(value: number): string {
  return `₺${value.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
}

const PURCHASE_SOUND_URI =
  'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg';

function usePurchaseSound() {
  const soundRef = useRef<Audio.Sound | null>(null);

  return useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri: PURCHASE_SOUND_URI });
      soundRef.current = sound;
      await sound.playAsync();
    } catch {
      // Ses dosyası web/mobil platformda kullanılamıyorsa sessizce yutulur,
      // dopamin geri bildirimi haptics/confetti ile zaten sağlanır.
    }
  }, []);
}

function ProductCard({
  product,
  onBuyNow,
  onAddToCart,
}: {
  product: Product;
  onBuyNow: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}) {
  return (
    <View className="bg-zugurt-panel rounded-2xl p-4 m-2 flex-1 min-w-[160px] border border-white/5">
      <Text className="text-4xl text-center mb-2">{product.emoji}</Text>
      <Text className="text-white font-bold text-base" numberOfLines={2}>
        {product.name}
      </Text>
      <Text className="text-gray-400 text-xs mt-1" numberOfLines={3}>
        {product.description}
      </Text>
      <Text className="text-zugurt-gold font-extrabold text-lg mt-3">
        {formatCurrency(product.price)}
      </Text>
      <View className="flex-row mt-3 gap-2">
        <Pressable
          onPress={() => onAddToCart(product)}
          className="flex-1 bg-white/10 rounded-xl py-2 items-center active:opacity-70"
        >
          <Text className="text-white text-xs font-semibold">Sepete Ekle</Text>
        </Pressable>
        <Pressable
          onPress={() => onBuyNow(product)}
          className="flex-1 bg-zugurt-accent rounded-xl py-2 items-center active:opacity-70"
        >
          <Text className="text-white text-xs font-bold">Hemen Al</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DopamineToast({ visible, dopamine }: { visible: boolean; dopamine: number }) {
  if (!visible) return null;
  return (
    <View className="absolute top-16 self-center bg-zugurt-success px-5 py-3 rounded-full shadow-lg z-50">
      <Text className="text-white font-bold">+{dopamine} DP 🧠✨ Teselli Bulundu!</Text>
    </View>
  );
}

export default function App() {
  const balance = useStore((state) => state.balance);
  const cart = useStore((state) => state.cart);
  const dopaminePoints = useStore((state) => state.dopaminePoints);
  const purchaseHistory = useStore((state) => state.purchaseHistory);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const getCartTotal = useStore((state) => state.getCartTotal);
  const checkout = useStore((state) => state.checkout);
  const buyNow = useStore((state) => state.buyNow);
  const resetBalance = useStore((state) => state.resetBalance);

  const categories = useMemo(() => getAllCategories(), []);
  const [activeCategory, setActiveCategory] = useState<ProductCategory>(categories[0]);
  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; dopamine: number }>({
    visible: false,
    dopamine: 0,
  });

  const playPurchaseSound = usePurchaseSound();
  const products = useMemo(() => getProductsByCategory(activeCategory), [activeCategory]);

  const triggerDopamineFeedback = useCallback(
    async (dopamine: number) => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await playPurchaseSound();
      setToast({ visible: true, dopamine });
      setTimeout(() => setToast({ visible: false, dopamine: 0 }), 1800);
    },
    [playPurchaseSound]
  );

  const handleBuyNow = useCallback(
    (product: Product) => {
      if (balance < product.price) return;
      const record: PurchaseRecord = buyNow(product);
      triggerDopamineFeedback(record.dopamineGained);
    },
    [balance, buyNow, triggerDopamineFeedback]
  );

  const handleAddToCart = useCallback(
    (product: Product) => {
      addToCart(product);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [addToCart]
  );

  const handleCheckout = useCallback(async () => {
    const records = checkout();
    if (records.length === 0) return;
    const totalDopamine = records.reduce((sum, r) => sum + r.dopamineGained, 0);
    setCartOpen(false);
    await triggerDopamineFeedback(totalDopamine);
  }, [checkout, triggerDopamineFeedback]);

  const cartTotal = getCartTotal();

  return (
    <SafeAreaView className="flex-1 bg-zugurt-dark">
      <StatusBar barStyle="light-content" />
      <DopamineToast visible={toast.visible} dopamine={toast.dopamine} />

      <View className="px-4 pt-2 pb-3 border-b border-white/10">
        <Text className="text-zugurt-gold text-2xl font-extrabold">Züğürt Tesellisi</Text>
        <View className="flex-row justify-between mt-2">
          <View>
            <Text className="text-gray-400 text-xs">Bakiye</Text>
            <Text className="text-white text-lg font-bold">{formatCurrency(balance)}</Text>
          </View>
          <View>
            <Text className="text-gray-400 text-xs">Dopamine Points</Text>
            <Text className="text-zugurt-accent text-lg font-bold">🧠 {dopaminePoints} DP</Text>
          </View>
        </View>
        <View className="flex-row mt-3 gap-2">
          <Pressable
            onPress={() => setCartOpen(true)}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 items-center active:opacity-70"
          >
            <Text className="text-white text-xs font-semibold">🛒 Sepet ({cart.length})</Text>
          </Pressable>
          <Pressable
            onPress={() => setHistoryOpen(true)}
            className="bg-white/10 rounded-xl px-3 py-2 flex-1 items-center active:opacity-70"
          >
            <Text className="text-white text-xs font-semibold">📊 Geçmiş</Text>
          </Pressable>
          <Pressable
            onPress={resetBalance}
            className="bg-zugurt-gold rounded-xl px-3 py-2 flex-1 items-center active:opacity-70"
          >
            <Text className="text-zugurt-dark text-xs font-bold">🔁 Yeniden Zengin Ol</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-2 py-3"
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {categories.map((category) => (
          <Pressable
            key={category}
            onPress={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full mr-2 ${
              activeCategory === category ? 'bg-zugurt-accent' : 'bg-white/10'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                activeCategory === category ? 'text-white' : 'text-gray-300'
              }`}
            >
              {category}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <ProductCard product={item} onBuyNow={handleBuyNow} onAddToCart={handleAddToCart} />
        )}
      />

      <Modal visible={cartOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-zugurt-panel rounded-t-3xl p-4 max-h-[80%]">
            <Text className="text-white text-lg font-bold mb-3">Sepetiniz</Text>
            <ScrollView>
              {cart.length === 0 && (
                <Text className="text-gray-400 text-center py-8">Sepetiniz boş.</Text>
              )}
              {cart.map((item) => (
                <View
                  key={item.product.id}
                  className="flex-row items-center justify-between border-b border-white/10 py-3"
                >
                  <Text className="text-2xl mr-2">{item.product.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {item.quantity} x {formatCurrency(item.product.price)}
                    </Text>
                  </View>
                  <Pressable onPress={() => removeFromCart(item.product.id)} className="px-2">
                    <Text className="text-zugurt-accent font-bold">Kaldır</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <View className="flex-row justify-between items-center mt-4">
              <Text className="text-white font-bold text-base">
                Toplam: {formatCurrency(cartTotal)}
              </Text>
              <Pressable
                onPress={handleCheckout}
                disabled={cart.length === 0 || cartTotal > balance}
                className="bg-zugurt-success rounded-xl px-5 py-3 active:opacity-70 disabled:opacity-40"
              >
                <Text className="text-white font-bold">Satın Al</Text>
              </Pressable>
            </View>
            <Pressable onPress={() => setCartOpen(false)} className="mt-4 items-center">
              <Text className="text-gray-400">Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={historyOpen} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-zugurt-panel rounded-t-3xl p-4 max-h-[80%]">
            <Text className="text-white text-lg font-bold mb-3">Harcama Geçmişi</Text>
            <ScrollView>
              {purchaseHistory.length === 0 && (
                <Text className="text-gray-400 text-center py-8">
                  Henüz teselli bulunmadı. Hadi alışverişe başla!
                </Text>
              )}
              {purchaseHistory.map((record) => (
                <View
                  key={record.id}
                  className="flex-row items-center justify-between border-b border-white/10 py-3"
                >
                  <Text className="text-2xl mr-2">{record.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {record.productName}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {record.quantity} x {formatCurrency(record.price)} · +{record.dopamineGained} DP
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => setHistoryOpen(false)} className="mt-4 items-center">
              <Text className="text-gray-400">Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
