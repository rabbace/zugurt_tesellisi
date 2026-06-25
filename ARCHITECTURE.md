# Mimari Dokümantasyon — Züğürt Tesellisi

## Genel Bakış

Züğürt Tesellisi, Expo (React Native + Expo Web) üzerine kurulu, tek kod tabanından Android, iOS ve Web çıktısı üreten istemci taraflı (client-side) bir "Retail Therapy" simülatörüdür. Sunucu yoktur; tüm durum cihaz/tarayıcı üzerinde tutulur ve kalıcılaştırılır.

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│  (UI: Ürün Listesi, Sepet, Geçmiş, Dopamine Toast)       │
└───────────────┬───────────────────────────┬──────────────┘
                │ useStore() hooks          │ getProducts*()
                ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   src/store/useStore.ts   │   │   src/utils/products.ts   │
│  (Zustand + persist)      │   │  (statik ürün kataloğu)   │
└───────────────┬───────────┘   └───────────────────────────┘
                │ persist middleware
                ▼
┌───────────────────────────┐
│ @react-native-async-storage│
│  (Web: localStorage shim)  │
└───────────────────────────┘
```

## Global State (Zustand)

Uygulama tamamen istemci taraflı (client-side) çalışır. Tüm durum `src/store/useStore.ts` içinde tek bir merkezi store olarak yönetilir:

| Alan | Tip | Açıklama |
|---|---|---|
| `balance` | `number` | Başlangıçta **9.999.999.999 ₺** olan hayali bakiye (`INITIAL_BALANCE`). |
| `cart` | `CartItem[]` | Sepetteki ürünler dizisi (`{ product, quantity }`). |
| `dopaminePoints` (DP) | `number` | Harcanan paraya (`log10(price)`) ve satın alma sıklığına/ürünün `dopamineMultiplier` değerine göre artan yapay mutluluk puanı. |
| `purchaseHistory` | `PurchaseRecord[]` | Grafiklerde ve "Geçmiş" ekranında gösterilmek üzere geçmiş harcamaların kaydı (ürün, fiyat, miktar, kazanılan DP, zaman damgası). |

Store, `zustand/middleware`'in `persist` fonksiyonu ile sarılmıştır; `AsyncStorage` adaptörü (`createJSONStorage`) sayesinde bakiye, sepet, DP ve geçmiş, uygulama kapatılıp açıldığında da korunur.

### Aksiyonlar
- `addToCart` / `removeFromCart` / `updateCartQuantity` / `clearCart`: Sepet yönetimi.
- `buyNow(product)`: Tek ürünü anında satın alır, bakiyeyi düşer, DP ekler, geçmişe kaydeder.
- `checkout()`: Sepetteki tüm ürünleri tek seferde satın alır, toplu DP/bakiye güncellemesi yapar.
- `resetBalance()`: Bakiyeyi `INITIAL_BALANCE` değerine sıfırlar ("Yeniden Zengin Ol").

### Dopamine Points Formülü
```
dopamineGained = round( log10(price + 10) * 10 * dopamineMultiplier * quantity )
```
Bu formül, çok pahasına ürünlerde getiri artışını logaritmik olarak sınırlarken, ürüne özel `dopamineMultiplier` (kataloğa bakınız: `src/utils/products.ts`) absürtlük/lüks seviyesine göre ek bir çarpan sağlar.

## Ürün Kataloğu (`src/utils/products.ts`)

Statik, salt-okunur bir `Product[]` dizisi olarak tutulur. Her ürün; `id`, `name`, `description`, `price`, `category`, `emoji` ve `dopamineMultiplier` alanlarına sahiptir. `getProductsByCategory`, `getAllCategories` ve `getProductById` yardımcı fonksiyonları, UI tarafının kataloğu filtrelemesini sağlar.

## Platform Farklılıklarının Çözümü

### Ses Efektleri — `expo-av`
`expo-av` kütüphanesi, hem Web ses API'lerini (`HTMLAudioElement`/Web Audio) hem de mobil yerel ses sürücülerini (`AVAudioPlayer` / `MediaPlayer`) tek bir `Audio.Sound` arayüzü altında soyutlar. `App.tsx` içindeki `usePurchaseSound` hook'u, her satın alma anında `Audio.Sound.createAsync` ile sesi yükler ve `playAsync()` ile çalar; ses yüklenemezse (örn. tarayıcı otomatik oynatma kısıtlaması) hata sessizce yutulur ve haptic/toast geri bildirimi devreye girer.

### Dokunsal Geri Bildirim — `expo-haptics`
Mobilde (`Haptics.notificationAsync`, `Haptics.impactAsync`) titreşimli geri bildirim sağlanır; Web'de bu çağrılar no-op olarak davranır, böylece platforma özel `if` bloklarına gerek kalmaz.

### Tasarım — `NativeWind`
`NativeWind`, `tailwind.config.js` içinde tanımlanan Tailwind sınıflarını derleme zamanında (Babel eklentisi `nativewind/babel` aracılığıyla):
- **Web'de** → standart CSS sınıflarına,
- **Mobilde (iOS/Android)** → React Native `StyleSheet` nesnelerine

dönüştürür. Böylece `App.tsx` içindeki bileşenler tek bir `className` API'si ile yazılır ve üç platformda da tutarlı görünür.

### Kalıcı Depolama — `@react-native-async-storage/async-storage`
Mobilde yerel disk tabanlı depolamayı kullanırken, Web'de aynı API'nin `localStorage` üzerine kurulu shim'i çalışır; bu sayede `persist` middleware'i platform farkı olmadan çalışır.

## Veri Akışı Özeti

1. Kullanıcı bir kategori seçer → `getProductsByCategory` ile ürünler filtrelenir.
2. "Hemen Al" veya "Sepete Ekle" tetiklenir → `useStore` aksiyonları çağrılır.
3. Satın alma tamamlanınca → bakiye düşer, DP artar, `purchaseHistory`'e kayıt eklenir, `expo-av` ile ses ve `expo-haptics` ile titreşim tetiklenir, ekranda dopamin bildirimi (`DopamineToast`) gösterilir.
4. `persist` middleware, her state değişiminde otomatik olarak `AsyncStorage`'a yazar.

## CI/CD

`.github/workflows/build-deploy.yml`, her `main` push'unda:
1. Bağımlılıkları kurar, lint ve typecheck çalıştırır.
2. Web sürümünü `expo export --platform web` ile statik olarak derler.
3. EAS Build (Android/iOS) tetiklemesi için `eas build` adımlarını içerir (EAS token gerektirir, `secrets.EXPO_TOKEN`).
