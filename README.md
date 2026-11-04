# Züğürt Tesellisi

Gerçek ürünler, gerçekçi fiyatlar, gerçekçi kargo süreci, tek farkla: **sanal kredi**.
Hiçbir şey gerçekten satın alınmaz, hiçbir ödeme bilgisi istenmez.

## Özellikler

- **Ürün kataloğu:** 19 kategoride 120+ ürün, Türkiye piyasasına yakın TL fiyatları ve indirimler. Uzaktan güncellenir (`public/catalog.json`).
- **Kasım kampanyaları:** Kasım Fırsatları, Market Fırsatları, 11.11 Süper Gün, Kara Cuma Haftası, Siber Pazartesi. Geri sayımlı vitrin, kampanya sayfası ve kampanyalı fiyatlar. Kampanya başlamadan bir gün önce ve başladığında telefon bildirimi.
- **Kuponlar:** Hoş geldin kuponu, toplanabilir kampanya kuponları, alt limit ve kategori kuralları, sepette kupon seçimi.
- **Favoriler:** Kalp ile favoriye ekleme, "eklediğinden beri X TL düştü" etiketi, fiyat düşünce bildirim.
- **Yorumlar:** Teslim alınan ürünlere yıldız ve yorum yazma (+5 teselli puanı), "Faydalı" oyu, örnek kullanıcı yorumları.
- **Çoklu adres:** Ev, İş, Annemler... Adres ekle, düzenle, sil, sepette seç.
- **Sipariş ve kargo takibi:** Hazırlanıyor → Kargoda → Transfer → Dağıtımda → Teslim. Rastgele gecikme ve "adreste bulunamadı" denemeleri. Kargoya verilmeden iptal.
- **14 gün iade:** Teslim edilen siparişte iade sebebi seçip iade başlatma, iade kargo takibi, onaylanınca kredi iadesi.
- **Bildirim kutusu:** Kampanya, kargo, iade ve fiyat düşüşü bildirimleri.
- **Diğer:** Taksit tablosu (bilgi amaçlı), "Yarın kapında" ve "Çok satan" rozetleri, son aramalar, popüler aramalar, son gezilen ürünler, benzer ürünler, koyu tema.
- **Sanal kredi:** Başlangıç kredisi, bitince ödüllü reklam izleyerek kredi kazanma. Gerçek ödeme yok.
- **Hızlı kargo modu:** Test için 1 gün = 2 dakika.

## Android'de test etme (bilgisayar gerekmez)

Her push'ta GitHub Actions bir APK derler ve **Releases** sayfasına koyar:

1. Telefonda `github.com/rabbace/zugurt_tesellisi/releases` adresini açın.
2. En üstteki **Android build #N** sürümündeki `.apk` dosyasına dokunun.
3. Android "bilinmeyen kaynaklardan yükleme" izni isterse izin verin ve kurun.

Yeni sürümler eskisinin üzerine kurulur, veriler korunur.

Web önizleme: `https://rabbace.github.io/zugurt_tesellisi/` (reklam web'de simüle edilir).

## Katalog ve ekonomi ayarları

`public/catalog.json`:

| Alan | Açıklama |
| --- | --- |
| `economy.startingCredit` | İlk açılıştaki kredi |
| `economy.adReward` | Bir reklam başına kazanılan kredi |
| `economy.adCooldownSeconds` | İki reklam arası bekleme |
| `economy.freeShippingThreshold` / `shippingFee` | Kargo kuralları |
| `products[]` | Ürünler (`price`, `originalPrice` → indirim oranı otomatik hesaplanır) |

Dosyayı düzenleyip push etmek yeterli. Uygulama bir sonraki açılışta yeni fiyatları alır. `updatedAt` alanını da güncelleyin.

## Reklamlar (AdMob)

Şu an Google'ın **test** reklam kimlikleri kullanılıyor ("Test Ad" yazan reklamlar). Gerçek reklam için bir AdMob hesabı açılıp:

- `app.json` → `react-native-google-mobile-ads.androidAppId`
- `src/ads/rewarded.native.ts` → `REWARDED_UNIT_ID`

gerçek kimliklerle değiştirilmelidir.

## Teknoloji

Expo SDK 51 · React Native 0.74 · TypeScript · NativeWind v4 · Zustand (AsyncStorage ile kalıcı) · expo-notifications · react-native-google-mobile-ads

## Proje yapısı

```
App.tsx                         Sekme yapısı ve uygulama akışı
public/catalog.json             Ürün kataloğu ve ekonomi ayarları
src/catalog/catalogStore.ts     Uzaktan katalog + yerel yedek
src/store/useStore.ts           Kredi, sepet, siparişler
src/orders/simulate.ts          Kargo zaman çizelgesi ve gecikme simülasyonu
src/ads/                        Ödüllü reklam (native) / simülasyon (web)
src/notifications/              Kargo bildirimleri (native) / boş (web)
src/screens/                    Anasayfa, ürün detayı, sepet, siparişler, hesap
.github/workflows/              APK derleme + GitHub Pages yayını
```

## Geliştirme (bilgisayarda)

```bash
npm install
npm run web          # tarayıcıda önizleme
npm run android      # bağlı cihaz/emülatörde native build (Android SDK gerekir)
npm run typecheck
```
