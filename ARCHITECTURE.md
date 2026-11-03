# Mimari

## Veri akışı

```
public/catalog.json ──(GitHub Pages)──► catalogStore.refresh()  ─┐
        └──────────(uygulamaya gömülü yedek)─────────────────────┴─► useCatalogStore.catalog
                                                                         │
App.tsx ── resolveCart(cart, catalog.products) ── computeTotals() ──► useStore.placeOrder()
                                                                         │
                                                         orders/simulate.buildOrder()
                                                                         │
                                         notifications.scheduleOrderNotifications(order)
```

## Global state (Zustand, AsyncStorage ile kalıcı)

`src/store/useStore.ts`

| Alan | Açıklama |
| --- | --- |
| `credit` | Sanal kredi. İlk açılışta `economy.startingCredit` ile başlar. |
| `cart` | Sepet. Fiyatlar ödeme anında güncel katalogdan yeniden okunur. |
| `orders` | Siparişler ve önceden hesaplanmış kargo olayları. |
| `dopaminePoints` | Teselli puanı: `round(log10(tutar + 10) * 10)` |
| `fastMode` | Hızlı kargo modu (1 gün = 2 dakika). |
| `lastAdAt`, `adsWatched` | Reklam bekleme süresi ve istatistik. |

`src/catalog/catalogStore.ts` katalogu ayrı tutar. Kaydedilmiş katalog, uygulamaya gömülü olandan eskiyse gömülü olan kullanılır.

## Sipariş simülasyonu

`buildOrder()` sipariş anında tüm kargo olaylarını gerçek zaman damgalarıyla üretir:

1. Sipariş alındı → Hazırlanıyor (≈1 saat) → Kargoya verildi (4-10 saat)
2. Transfer merkezi
3. %20 olasılıkla **gecikme** (+1-2 gün, rastgele sebep)
4. %10 olasılıkla **teslim edilemedi** → ertesi gün tekrar dağıtım
5. Teslim edildi

Ekranlar o anki zamana göre hangi olayların gerçekleştiğini hesaplar. Bu sayede uygulama kapalıyken de sipariş ilerler. Gelecekteki gecikmeler önceden gösterilmez, tahmini teslim tarihi ancak gecikme olayı gerçekleşince güncellenir.

## Platform farkları

Metro, `.native.ts` dosyalarını Android/iOS'ta, düz `.ts` dosyalarını web'de kullanır:

| Modül | Android / iOS | Web |
| --- | --- | --- |
| `src/ads/rewarded` | AdMob ödüllü reklam | 3 sn simülasyon |
| `src/notifications/orderNotifications` | expo-notifications ile zamanlanmış bildirim | işlem yok |
| Haptics | expo-haptics | atlanır |

Stil: NativeWind v4 (Tailwind sınıfları web'de CSS'e, native'de StyleSheet'e dönüşür).

## CI/CD (`.github/workflows/build-deploy.yml`)

- **typecheck:** `tsc --noEmit`
- **web:** `expo export --platform web` (`GH_PAGES_BASE_PATH` ile alt-yol), `gh-pages` dalına yayın. Katalog da bununla yayınlanır.
- **android:** `expo prebuild` + `./gradlew assembleRelease`. Expo hesabı gerekmez. APK, `android-build-N` etiketiyle GitHub Releases'a yüklenir. `versionCode` = run numarası, böylece yeni sürüm eskisinin üzerine kurulur.
