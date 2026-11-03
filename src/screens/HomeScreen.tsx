import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/ui';
import { discountPercent } from '../format';
import { Catalog, Product } from '../types';

type SortKey = 'recommended' | 'priceAsc' | 'priceDesc' | 'discount';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'Önerilen' },
  { key: 'priceAsc', label: 'En düşük fiyat' },
  { key: 'priceDesc', label: 'En yüksek fiyat' },
  { key: 'discount', label: 'En çok indirim' },
];

function normalize(text: string): string {
  return text.toLocaleLowerCase('tr-TR');
}

export function HomeScreen({
  catalog,
  onOpen,
  onAdd,
}: {
  catalog: Catalog;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recommended');

  const deals = useMemo(
    () =>
      [...catalog.products]
        .filter((p) => discountPercent(p.price, p.originalPrice) >= 15)
        .sort(
          (a, b) =>
            discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice)
        )
        .slice(0, 8),
    [catalog.products]
  );

  const products = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = catalog.products.filter(
      (p) =>
        (!categoryId || p.categoryId === categoryId) &&
        (!q || normalize(`${p.brand} ${p.title}`).includes(q))
    );
    const sorted = [...filtered];
    if (sort === 'priceAsc') sorted.sort((a, b) => a.price - b.price);
    if (sort === 'priceDesc') sorted.sort((a, b) => b.price - a.price);
    if (sort === 'discount')
      sorted.sort(
        (a, b) => discountPercent(b.price, b.originalPrice) - discountPercent(a.price, a.originalPrice)
      );
    return sorted;
  }, [catalog.products, categoryId, query, sort]);

  const showDeals = !query && !categoryId && sort === 'recommended' && deals.length > 0;

  const header = (
    <View>
      <View className="px-3 pt-3">
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ürün, marka ara"
          placeholderTextColor="#94A3B8"
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingVertical: 10 }}>
        <Pressable
          onPress={() => setCategoryId(null)}
          className={`px-4 py-2 rounded-full mr-2 ${!categoryId ? 'bg-brand' : 'bg-white border border-slate-200'}`}
        >
          <Text className={`text-xs font-semibold ${!categoryId ? 'text-white' : 'text-slate-700'}`}>Tümü</Text>
        </Pressable>
        {catalog.categories.map((c) => {
          const active = categoryId === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(active ? null : c.id)}
              className={`px-4 py-2 rounded-full mr-2 ${active ? 'bg-brand' : 'bg-white border border-slate-200'}`}
            >
              <Text className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-700'}`}>
                {c.emoji} {c.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {showDeals && (
        <View className="mb-1">
          <View className="mx-3 bg-brand rounded-2xl p-4">
            <Text className="text-white font-extrabold text-lg">⚡ Flaş İndirimler</Text>
            <Text className="text-brand-light text-xs mt-0.5">Gerçek fiyatlar, sanal kredi. Pişmanlık yok!</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6, paddingVertical: 6 }}>
            {deals.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} onAdd={onAdd} compact />
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 4 }}>
        {SORTS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSort(s.key)}
            className={`px-3 py-1.5 rounded-lg mr-2 ${sort === s.key ? 'bg-brand-light' : ''}`}
          >
            <Text className={`text-xs ${sort === s.key ? 'text-brand font-bold' : 'text-slate-500'}`}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="text-slate-500 text-xs px-4 pb-1">{products.length} ürün</Text>
    </View>
  );

  return (
    <FlatList
      data={products}
      keyExtractor={(p) => p.id}
      numColumns={2}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState emoji="🔍" title="Sonuç bulunamadı" subtitle="Farklı bir arama veya kategori dene." />}
      contentContainerStyle={{ paddingHorizontal: 6, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <View className="flex-1 flex-row" style={{ maxWidth: '50%' }}>
          <ProductCard product={item} onOpen={onOpen} onAdd={onAdd} />
        </View>
      )}
    />
  );
}
