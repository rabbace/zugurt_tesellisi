import React from 'react';
import { FlatList, View } from 'react-native';

import { CardActions, ProductCard } from '../components/ProductCard';
import { EmptyState } from '../components/ui';
import { formatTL } from '../format';
import { Favorite, PricedProduct } from '../types';

export function FavoritesScreen({
  favorites,
  products,
  actions,
}: {
  favorites: Favorite[];
  products: PricedProduct[];
  actions: CardActions;
}) {
  const items = favorites
    .map((f) => ({ favorite: f, product: products.find((p) => p.id === f.productId) }))
    .filter((x): x is { favorite: Favorite; product: PricedProduct } => !!x.product);

  if (items.length === 0) {
    return (
      <EmptyState
        icon="heart-outline"
        title="Henüz gönlünü çalan yok"
        subtitle="Beğendiğin ürünün kalbine dokun. Fiyatı düşünce haber veririm."
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(x) => x.product.id}
      numColumns={2}
      contentContainerStyle={{ padding: 6, paddingBottom: 24 }}
      renderItem={({ item }) => {
        const drop = item.favorite.priceAtAdd - item.product.price;
        return (
          <View className="flex-1 flex-row" style={{ maxWidth: '50%' }}>
            <ProductCard
              product={item.product}
              actions={actions}
              note={drop > 0 ? `Eklediğinden beri ${formatTL(drop)} ucuzladı` : undefined}
            />
          </View>
        );
      }}
    />
  );
}
