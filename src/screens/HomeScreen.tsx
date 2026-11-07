import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon } from '../components/Icon';
import { CardActions, ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/ui';
import { discountPercent } from '../format';
import { activeCampaigns, formatCountdown, upcomingCampaigns } from '../pricing';
import { greeting } from '../theme';
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
      <View className="bg-paper/20 rounded-full px-2.5 py-1 self-start">
        <Text className="text-paper text-2xs font-strong">{live ? 'Şimdi' : 'Yakında'}</Text>
      </View>
      <Text className="font-display text-paper text-2xl mt-3">{campaign.title}</Text>
      <Text className="font-body text-paper/90 text-sm mt-0.5" numberOfLines={2}>
        {campaign.subtitle}
      </Text>
      <Text className="text-paper text-xs font-strong mt-3">
        {live ? 'Bitmesine' : 'Başlamasına'} {formatCountdown(target - now)}
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
      <Text className="font-display text-soft text-lg px-4 pt-4 pb-1">{greeting(now)}</Text>
      <View className="px-3 pt-2">
        <View className="flex-row items-center bg-card border border-line rounded-xl px-3">
          <Icon name="search-outline" size={20} className="text-muted" />
          <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onSubmitEditing={() => onSearch(query)}
          returnKeyType="search"
          placeholder="Ne arıyorsun?"
          placeholderTextColor={placeholderColor}
          className="flex-1 px-2 py-3 text-ink text-base font-body"
        />
        </View>
        {showSuggestions && (
          <View className="bg-card border border-line rounded-xl mt-2 p-3">
            {recentSearches.length > 0 && (
              <>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-ink text-sm font-strong">Son aramalar</Text>
                  <Pressable onPress={onClearSearches} hitSlop={6}>
                    <Text className="text-link text-xs font-strong">Temizle</Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {recentSearches.map((s) => (
                    <Pressable key={s} onPress={() => applySearch(s)} className="bg-sunken rounded-full px-3 py-1.5">
                      <Text className="font-body text-soft text-xs">{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            <Text className="text-ink text-sm font-strong mb-2">Popüler aramalar</Text>
            <View className="flex-row flex-wrap gap-2">
              {POPULAR.map((s) => (
                <Pressable key={s} onPress={() => applySearch(s)} className="bg-chip rounded-full px-3 py-1.5">
                  <Text className="text-link text-xs font-semi">{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}>
        {[{ id: null as string | null, name: 'Tümü' }, ...catalog.categories].map((c) => {
          const active = categoryId === c.id;
          return (
            <Pressable
              key={c.id ?? 'all'}
              onPress={() => setCategoryId(active && c.id ? null : c.id)}
              className={`px-4 py-2 rounded-full mr-2 ${active ? 'bg-brand' : 'bg-card border border-line'}`}
            >
              <Text className={`text-xs font-semi ${active ? 'text-paper' : 'text-soft'}`}>
                {c.name}
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
          <Text className="font-display text-ink text-xl px-4">Flaş indirimler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 6 }}>
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} actions={actions} compact />
            ))}
          </ScrollView>
        </View>
      )}

      {browsing && recentlyViewed.length > 0 && (
        <View className="mt-1">
          <Text className="font-display text-ink text-xl px-4">Son baktıkların</Text>
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
            <Text className={`text-xs ${sort === s.key ? 'text-link font-strong' : 'text-muted'}`}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="font-body text-muted text-xs px-4 pb-1">{filtered.length} ürün</Text>
    </View>
  );

  return (
    <FlatList
      data={filtered}
      keyExtractor={(p) => p.id}
      numColumns={2}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState icon="search-outline" title="Bunu bulamadım" subtitle="Başka bir kelimeyle ya da kategoriyle dener misin?" />}
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
        <Pressable onPress={onClose} hitSlop={8} className="flex-row items-center self-start active:opacity-50" accessibilityLabel="Geri">
          <Icon name="chevron-back" size={22} className="text-paper" />
          <Text className="text-paper text-base font-strong">Geri</Text>
        </Pressable>
        <Text className="font-display text-paper text-3xl mt-3">{campaign.title}</Text>
        <Text className="font-body text-paper/90 text-base mt-1">{campaign.subtitle}</Text>
        <Text className="text-paper text-sm font-strong mt-2">
          {live ? 'Bitmesine' : 'Başlamasına'} {formatCountdown(Date.parse(live ? campaign.endsAt : campaign.startsAt) - now)}
        </Text>
        {!live && (
          <Text className="font-body text-paper/90 text-xs mt-2">
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
