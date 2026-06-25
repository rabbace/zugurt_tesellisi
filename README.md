# Züğürt Tesellisi (Dopamine Shopping Simulator)

Bu uygulama, tek bir kuruş harcamadan, sınırsız sahte bakiye ile ultra lüks veya absürt ürünleri satın alarak dopamin salgılamayı amaçlayan bir "Retail Therapy" (Alışveriş Terapisi) simülatörüdür.

## Desteklenen Platformlar
- 🤖 Android (APK / AAB)
- 🍏 iOS (IPA / TestFlight)
- 🌐 Web Browser (Responsive PWA)

## Özellikler
- 💰 Sınırsız sahte bakiye (varsayılan: ₺9.999.999.999)
- 🛍️ Lüks ve absürt ürün kataloğu (yatlar, uzay biletleri, altın burgerler...)
- 🎉 Satın alma anında ses efekti / haptic feedback ile dopamin tetikleyici geri bildirim
- 🧠 Dopamine Points (DP): harcanan paraya ve satın alma sıklığına göre artan yapay mutluluk puanı
- 📊 Harcama geçmişi ve toplam "teselli" istatistikleri
- 🔁 Bakiye sıfırlandığında tek tıkla "Yeniden Zengin Ol" butonu
- 🌗 Karanlık/Aydınlık tema desteği

## Teknoloji Yığını
- [Expo](https://expo.dev) (React Native + Expo Web)
- TypeScript
- [Zustand](https://github.com/pmndrs/zustand) (state management, AsyncStorage persist)
- NativeWind / TailwindCSS (stil — Web'de CSS'e, mobilde `StyleSheet`'e derlenir)
- `expo-av` (platformlar arası ses efekti soyutlaması)
- GitHub Actions (CI/CD - EAS Build & Web Deploy)

## Kurulum ve Çalıştırma
1. Bağımlılıkları Yükleyin:
   ```bash
   npm install
   ```
2. Web Sürümünü Başlatın:
   ```bash
   npx expo start --web
   ```
3. Mobil (Android/iOS) Sürümünü Başlatın:
   ```bash
   npx expo start
   ```

## Proje Yapısı

```
.
├── .github/workflows/build-deploy.yml   # CI/CD pipeline (EAS + Web)
├── App.tsx                              # Uygulama giriş noktası
├── app.json                             # Expo yapılandırması
├── package.json                         # Bağımlılıklar ve scriptler
├── tailwind.config.js                   # NativeWind/Tailwind yapılandırması
├── src/
│   ├── store/
│   │   └── useStore.ts                  # Zustand global state (bakiye, sepet, geçmiş)
│   └── utils/
│       └── products.ts                  # Lüks/absürt ürün kataloğu
└── ARCHITECTURE.md                       # Detaylı mimari dokümantasyonu
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm start` | Expo geliştirme sunucusunu başlatır |
| `npm run web` | Web sürümünü başlatır |
| `npm run android` | Android emülatöründe/cihazında çalıştırır |
| `npm run ios` | iOS simülatöründe/cihazında çalıştırır |
| `npm run lint` | ESLint ile kod kalitesi kontrolü |
| `npm run typecheck` | TypeScript tip kontrolü |

## Eklenmesi Gereken Varlıklar (Assets)
`app.json` aşağıdaki ikon/splash görsellerine referans verir; bu ikili (binary) dosyalar bu depoda yer almaz, projeyi build almadan önce `assets/` klasörüne eklenmelidir:
- `assets/icon.png` (1024x1024)
- `assets/splash.png`
- `assets/adaptive-icon.png` (Android)
- `assets/favicon.png` (Web)

## Lisans
MIT
