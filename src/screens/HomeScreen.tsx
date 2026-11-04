import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { CardActions, ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/ui';
import { discountPercent } from '../format';
import { activeCampaigns, formatCountdown, upcomingCampaigns } from '../pricing';
import { Campaign, Catalog, PricedProduct } from '../types';

type SortKey = 'recommended' | 'priceAsc' | 'priceDesc' | 'discount' | 'rating';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'Önerilen' },
  { key: 'priceAsc', label: 'En düşük fiyat' },
  { key: 'priceDesc', label: 'En yüksek fiyat' },
  { key: 'discount', label: 'En çok indirim' },
  { key: 'rating', label: 'En yüksek puan' },
];

const POPULAR = ['iPhone', 'Airfryer', 'PlayStation', 'Sneaker', 'Kahve', 'Süpürge'];

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

function CampaignCard({ campaign, now, onPress }: { campaign: Campaign; now: number; onPress: () => void }) {
  const live = now >= Date.parse(campaign.startsAt);
  const target = live ? Date.parse(campaign.endsAt) : Date.parse(campaign.startsAt);
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl p-4 mr-3 w-[270px] active:opacity-80"
      style={{ backgroundColor: campaign.color }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-3xl">{campaign.emoji}</Text>
        <View className="bg-white/20 rounded-full px-2.5 py-1">
          <Text className="text-white text-2xs font-bold">{live ? '● CANLI' : 'YAKINDA'}</Text>
        </View>
      </View>
      <Text className="text-white text-lg font-extrabold mt-2">{campaign.title}</Text>
      <Text className="text-white/90 text-sm mt-0.5" numberOfLines={2}>
        {campaign.subtitle}
      </Text>
      <Text className="text-white text-xs font-bold mt-3">
        ⏱ {live ? 'Bitmesine' : 'Başlamasına'} {formatCountdown(target - now)}
      </Text>
    </Pressable>
  );
}

export function HomeScreen({
  catalog,
  products,
  now,
  placeholderColor,
  recentlyViewed,
  recentSearches,
  actions,
  onSearch,
  onClearSearches,
  onOpenCampaign,
}: {
  catalog: Catalog;
  products: PricedProduct[];
  now: number;
  placeholderColor: string;
  recentlyViewed: PricedProduct[];
  recentSearches: string[];
  actions: CardActions;
  onSearch: (query: string) => void;
  onClearSearches: () => void;
  onOpenCampaign: (campaign: Campaign) => void;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recommended');

  const campaigns = useMemo(
    () => [...activeCampaigns(catalog.campaigns, now), ...upcomingCampaigns(catalog.campaigns, now).slice(0, 2)],
    [catalog.campaigns, now]
  );

  const deals = useMemo(
    () =>
      [...products]
        .filter((p) => discountPercent(p.price, p.originalPrice) >= 15)
        .sort((a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice))
        .slice(0, 10),
    [products]
  );

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = products.filter(
      (p) => (!categoryId || p.categoryId === categoryId) && (!q || normalize(`${p.brand} ${p.title}`).includes(q))
    );
    const sorted = [...list];
    if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'discount')
      sorted.sort((a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice));
    if (sort === 'rating') sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    return sorted;
  }, [products, categoryId, query, sort]);

  const browsing = !query && !categoryId && sort === 'recommended';
  const showSuggestions = focused && !query;

  const applySearch = (q: string) => {
    setQuery(q);
    onSearch(q);
  };

  const header = (
    <View>
      <View className="px-3 pt-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onSubmitEditing={() => onSearch(query)}
          returnKeyType="search"
          placeholder="🔍 Ürün, marka veya kategori ara"
          placeholderTextColor={placeholderColor}
          className="bg-card border border-line rounded-xl px-4 py-3 text-ink text-base"
        />
        {showSuggestions && (
          <View className="bg-card border border-line rounded-xl mt-2 p-3">
            {recentSearches.length > 0 && (
              <>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-ink text-sm font-bold">Son aramalar</Text>
                  <Pressable onPress={onClearSearches} hitSlop={6}>
                    <Text className="text-link text-xs font-bold">Temizle</Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {recentSearches.map((s) => (
                    <Pressable key={s} onPress={() => applySearch(s)} className="bg-sunken rounded-full px-3 py-1.5">
                      <Text className="text-soft text-xs">🕘 {s}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <Text className="text-ink text-sm font-bold mb-2">Popüler aramalar</Text>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR.map((s) => (
                <Pressable key={s} onPress={() => applySearch(s)} className="bg-chip rounded-full px-3 py-1.5">
                  <Text className="text-link text-xs font-semibold">🔥 {s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}>
        {[{ id: null as string | null, name: 'Tümü', emoji: '✨' }, ...catalog.categories].map((c) => {
          const active = categoryId === c.id;
          return (
            <Pressable
              key={c.id ?? 'all'}
              onPress={() => setCategoryId(active && c.id ? null : c.id)}
              className={`px-4 py-2 rounded-full mr-2 ${active ? 'bg-brand' : 'bg-card border border-line'}`}
            >
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-soft'}`}>
                {c.emoji} {c.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {browsing && campaigns.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 6 }}>
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} now={now} onPress={() => onOpenCampaign(c)} />
          ))}
        </ScrollView>
      )}

      {browsing && deals.length > 0 && (
        <View className="mt-2">
          <Text className="text-ink text-lg font-extrabold px-4">⚡ Flaş İndirimler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 6 }}>
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} actions={actions} compact />
            ))}
          </ScrollView>
        </View>
      )}

      {browsing && recentlyViewed.length > 0 && (
        <View className="mt-1">
          <Text className="text-ink text-lg font-extrabold px-4">👀 Son gezdiklerin</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 6 }}>
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} actions={actions} compact />
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 6 }}>
        {SORTS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSort(s.key)}
            className={`px-3 py-1.5 rounded-lg mr-2 ${sort === s.key ? 'bg-chip' : ''}`}
          >
            <Text className={`text-xs ${sort === s.key ? 'text-link font-bold' : 'text-muted'}`}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="text-muted text-xs px-4 pb-1">{filtered.length} ürün</Text>
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(p) => p.id}
      numColumns={2}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState emoji="🔍" title="Sonuç bulunamadı" subtitle="Farklı bir arama veya kategori dene." />}
      contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <View className="flex-1 flex-row" style={{ maxWidth: '50%' }}>
          <ProductCard product={item} actions={actions} />
        </View>
      )}
    />
  );
}

export function CampaignScreen({
  campaign,
  products,
  now,
  actions,
  onClose,
}: {
  campaign: Campaign;
  products: PricedProduct[];
  now: number;
  actions: CardActions;
  onClose: () => void;
}) {
  const live = now >= Date.parse(campaign.startsAt);
  const list = products.filter((p) => !campaign.categoryIds || campaign.categoryIds.includes(p.categoryId));
  return (
    <View className="flex-1 bg-page">
      <View className="px-4 pt-10 pb-5" style={{ backgroundColor: campaign.color }}>
        <Pressable onPress={onClose} hitSlop={8} className="self-start active:opacity-50">
          <Text className="text-white text-base font-bold">‹ Geri</Text>
        </Pressable>
        <Text className="text-white text-2xl font-extrabold mt-3">
          {campaign.emoji} {campaign.title}
        </Text>
        <Text className="text-white/90 text-base mt-1">{campaign.subtitle}</Text>
        <Text className="text-white text-sm font-bold mt-2">
          ⏱ {live ? 'Bitmesine' : 'Başlamasına'} {formatCountdown(Date.parse(live ? campaign.endsAt : campaign.startsAt) - now)}
        </Text>
        {!live && (
          <Text className="text-white/90 text-xs mt-2">
            Kampanya başlayınca indirimli fiyatlar burada görünecek. Favorilerine eklediğin ürünler için bildirim alırsın.
          </Text>
        )}
      </View>
      <FlatList
        data={list}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={{ padding: 6, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="flex-1 flex-row" style={{ maxWidth: '50%' }}>
            <ProductCard product={item} actions={actions} />
          </View>
        )}
      />
    </View>
  );
}
