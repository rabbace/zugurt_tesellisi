import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { CardActions, ProductCard } from '../components/ProductCard';
import { HeartButton, PriceBlock, PrimaryButton, Rating, ScreenHeader, StarPicker, Stepper } from '../components/ui';
import { formatDay, formatTL } from '../format';
import { REAL_DAY_MS } from '../orders/simulate';
import { formatCountdown, installments } from '../pricing';
import { combinedRating, sampleReviews } from '../reviews';
import { Category, Economy, PricedProduct, UserReview } from '../types';

export function ProductDetail({
  product,
  category,
  economy,
  similar,
  now,
  myReviews,
  helpfulVotes,
  canReview,
  placeholderColor,
  actions,
  onClose,
  onAdd,
  onBuyNow,
  onSubmitReview,
  onToggleHelpful,
}: {
  product: PricedProduct | null;
  category: Category | undefined;
  economy: Economy;
  similar: PricedProduct[];
  now: number;
  myReviews: UserReview[];
  helpfulVotes: string[];
  canReview: boolean;
  placeholderColor: string;
  actions: CardActions;
  onClose: () => void;
  onAdd: (product: PricedProduct, quantity: number) => void;
  onBuyNow: (product: PricedProduct, quantity: number) => void;
  onSubmitReview: (productId: string, rating: number, text: string) => void;
  onToggleHelpful: (reviewId: string) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [showInstallments, setShowInstallments] = useState(false);
  const [writing, setWriting] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setShowInstallments(false);
  }, [product?.id]);

  const samples = useMemo(() => (product ? sampleReviews(product, Date.now()) : []), [product]);

  if (!product) return null;
  const mine = myReviews.find((r) => r.productId === product.id);
  const summary = combinedRating(product, myReviews);
  const earliest = formatDay(now + product.deliveryDays[0] * REAL_DAY_MS);
  const latest = formatDay(now + product.deliveryDays[1] * REAL_DAY_MS);
  const plans = installments(product.price);

  const reviews = [
    ...(mine
      ? [{ id: mine.id, author: 'Sen', rating: mine.rating, text: mine.text, createdAt: mine.createdAt, seller: product.seller, helpful: 0, mine: true }]
      : []),
    ...samples,
  ];

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-page">
        <ScreenHeader
          title={category ? `${category.emoji} ${category.name}` : ''}
          onBack={onClose}
          right={<HeartButton size="lg" active={actions.isFavorite(product.id)} onPress={() => actions.onToggleFavorite(product)} />}
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="bg-card items-center justify-center h-64">
            <Text style={{ fontSize: 120 }}>{product.emoji}</Text>
          </View>

          {product.campaign && (
            <View className="px-4 py-2.5 flex-row items-center justify-between" style={{ backgroundColor: product.campaign.color }}>
              <Text className="text-white text-sm font-bold flex-1 mr-2" numberOfLines={1}>
                {product.campaign.emoji} {product.campaign.title} · ekstra %{product.campaign.discountPercent}
              </Text>
              <Text className="text-white text-xs font-semibold">
                ⏱ {formatCountdown(Date.parse(product.campaign.endsAt) - now)}
              </Text>
            </View>
          )}

          <View className="bg-card px-4 pb-4 pt-3">
            <Text className="text-ink text-lg">
              <Text className="font-extrabold">{product.brand} </Text>
              {product.title}
            </Text>
            <View className="mt-1">
              <Rating rating={summary.rating} count={summary.count} />
            </View>
            <View className="mt-3">
              <PriceBlock price={product.price} originalPrice={product.originalPrice} large />
            </View>
            {plans.length > 0 && (
              <Pressable onPress={() => setShowInstallments((v) => !v)} className="mt-2 active:opacity-60">
                <Text className="text-link text-sm font-semibold">
                  💳 {formatTL(plans[0].monthly)} x 3 ay peşin fiyatına · Taksit seçenekleri {showInstallments ? '▲' : '▼'}
                </Text>
              </Pressable>
            )}
            {showInstallments && (
              <View className="border border-line rounded-xl mt-2 overflow-hidden">
                {plans.map((p) => (
                  <View key={p.months} className="flex-row justify-between px-3 py-2 border-b border-line">
                    <Text className="text-ink text-sm w-16">{p.months} ay</Text>
                    <Text className="text-ink text-sm font-semibold flex-1">{formatTL(p.monthly)} / ay</Text>
                    <Text className="text-muted text-xs">{p.note}</Text>
                  </View>
                ))}
                <Text className="text-muted text-2xs px-3 py-2">
                  Bilgi amaçlıdır. Bu uygulamada ödeme yalnızca sanal krediyle, tek seferde yapılır.
                </Text>
              </View>
            )}
          </View>

          <View className="bg-card mt-2 px-4 py-3 gap-2">
            <Text className="text-soft text-sm">
              🚚 Tahmini teslimat: <Text className="font-bold text-ink">{earliest}</Text>
              {earliest !== latest ? ` – ${latest}` : ''}
            </Text>
            <Text className="text-soft text-sm">
              {product.freeShipping
                ? '✅ Kargo bedava'
                : `📦 ${formatTL(economy.freeShippingThreshold)} üzeri kargo bedava, altı ${formatTL(economy.shippingFee)}`}
            </Text>
            <Text className="text-soft text-sm">↩️ {economy.returnDays} gün içinde ücretsiz iade</Text>
            <Text className="text-soft text-sm">
              🏪 Satıcı: <Text className="font-bold text-ink">{product.seller}</Text> · 9.{(product.seller.length % 7) + 2} satıcı puanı
            </Text>
            <Text className={`text-sm ${product.stock <= 10 ? 'text-orange-600 font-bold' : 'text-soft'}`}>
              {product.stock <= 10 ? `⏳ Tükenmek üzere! Son ${product.stock} ürün` : '📦 Stokta var'}
            </Text>
          </View>

          <View className="bg-card mt-2 px-4 py-3">
            <Text className="text-ink text-base font-bold mb-1">Ürün açıklaması</Text>
            <Text className="text-soft text-sm leading-5">{product.description}</Text>
          </View>

          <View className="bg-card mt-2 px-4 py-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-ink text-base font-bold">Değerlendirmeler</Text>
              <Text className="text-muted text-xs">{summary.count.toLocaleString('tr-TR')} değerlendirme</Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Text className="text-ink text-4xl font-extrabold mr-3">{summary.rating.toFixed(1)}</Text>
              <Rating rating={summary.rating} count={summary.count} />
            </View>
            <View className="mt-3">
              {canReview ? (
                <PrimaryButton
                  label={mine ? '✏️ Yorumunu düzenle' : '✍️ Ürünü değerlendir'}
                  variant="outline"
                  onPress={() => setWriting(true)}
                />
              ) : (
                <Text className="text-muted text-xs">Bu ürünü satın alıp teslim aldıktan sonra yorum yazabilirsin.</Text>
              )}
            </View>
            {reviews.map((r) => {
              const voted = helpfulVotes.includes(r.id);
              return (
                <View key={r.id} className={`mt-3 pt-3 border-t border-line ${r.mine ? 'bg-chip -mx-4 px-4 pb-3' : ''}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-amber-500 text-sm">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                    <Text className="text-muted text-xs">{formatDay(r.createdAt)}</Text>
                  </View>
                  <Text className="text-ink text-sm mt-1">{r.text}</Text>
                  <View className="flex-row items-center justify-between mt-1.5">
                    <Text className="text-muted text-xs">
                      {r.mine ? '🙋 Senin yorumun' : `${r.author} · ✅ Satın aldı`}
                    </Text>
                    {!r.mine && (
                      <Pressable onPress={() => onToggleHelpful(r.id)} hitSlop={6} className="active:opacity-60">
                        <Text className={`text-xs ${voted ? 'text-link font-bold' : 'text-muted'}`}>
                          👍 Faydalı ({r.helpful + (voted ? 1 : 0)})
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
            <Text className="text-muted text-2xs mt-3">Diğer kullanıcı yorumları simülasyon amaçlı örnek yorumlardır.</Text>
          </View>

          {similar.length > 0 && (
            <View className="mt-2">
              <Text className="text-ink text-base font-bold px-4 pt-2">Benzer ürünler</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 6 }}>
                {similar.map((p) => (
                  <ProductCard key={p.id} product={p} actions={actions} compact />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View className="bg-card border-t border-line px-4 pt-3 pb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-soft text-sm">Adet</Text>
            <Stepper value={quantity} max={product.stock} onChange={(v) => setQuantity(Math.max(1, v))} />
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <PrimaryButton label="Sepete Ekle" variant="outline" onPress={() => onAdd(product, quantity)} />
            </View>
            <View className="flex-1">
              <PrimaryButton label="Hemen Al" onPress={() => onBuyNow(product, quantity)} />
            </View>
          </View>
        </View>

        {writing && (
          <ReviewForm
            productTitle={`${product.brand} ${product.title}`}
            initial={mine}
            placeholderColor={placeholderColor}
            onCancel={() => setWriting(false)}
            onSubmit={(rating, text) => {
              onSubmitReview(product.id, rating, text);
              setWriting(false);
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function ReviewForm({
  productTitle,
  initial,
  placeholderColor,
  onCancel,
  onSubmit,
}: {
  productTitle: string;
  initial: UserReview | undefined;
  placeholderColor: string;
  onCancel: () => void;
  onSubmit: (rating: number, text: string) => void;
}) {
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [text, setText] = useState(initial?.text ?? '');
  const valid = rating > 0 && text.trim().length >= 10;
  return (
    <View className="absolute inset-0 bg-black/60 justify-end">
      <View className="bg-card rounded-t-3xl p-5">
        <Text className="text-ink text-lg font-extrabold">Ürünü değerlendir</Text>
        <Text className="text-muted text-sm mt-1" numberOfLines={1}>
          {productTitle}
        </Text>
        <View className="mt-4 items-center">
          <StarPicker value={rating} onChange={setRating} />
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ürünle ilgili deneyimini paylaş (en az 10 karakter)"
          placeholderTextColor={placeholderColor}
          multiline
          maxLength={500}
          className="border border-line rounded-xl px-3 py-3 text-ink text-base mt-4 min-h-[110px]"
          style={{ textAlignVertical: 'top' }}
        />
        <Text className="text-muted text-xs text-right mt-1">{text.length}/500</Text>
        <View className="flex-row gap-2 mt-3">
          <View className="flex-1">
            <PrimaryButton label="Vazgeç" variant="outline" onPress={onCancel} />
          </View>
          <View className="flex-1">
            <PrimaryButton label="Gönder (+5 puan)" disabled={!valid} onPress={() => onSubmit(rating, text.trim())} />
          </View>
        </View>
      </View>
    </View>
  );
}
