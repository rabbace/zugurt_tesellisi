export type ProductCategory =
  | 'Ulaşım'
  | 'Emlak'
  | 'Gastronomi'
  | 'Takı & Saat'
  | 'Uzay & Bilim'
  | 'Sanat & Koleksiyon'
  | 'Yaşam Tarzı';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  emoji: string;
  dopamineMultiplier: number;
}

export const PRODUCTS: Product[] = [
  {
    id: 'yacht-001',
    name: 'Lüks Süper Yat "Poseidon"',
    description: '110 metre uzunluğunda, helikopter pisti ve mini denizaltı garajı dahil özel yat.',
    price: 450_000_000,
    category: 'Ulaşım',
    emoji: '🛥️',
    dopamineMultiplier: 5,
  },
  {
    id: 'jet-001',
    name: 'Özel Jet Gulfstream G700',
    description: 'Transatlantik uçuşlarda durmadan 13 saat uçabilen, altın kaplama kabinli özel jet.',
    price: 75_000_000,
    category: 'Ulaşım',
    emoji: '✈️',
    dopamineMultiplier: 4.5,
  },
  {
    id: 'car-001',
    name: 'Elmas Kaplamalı Spor Araba',
    description: 'Karoserine 18.000 adet gerçek elmas işlenmiş, tek seri üretim spor otomobil.',
    price: 12_500_000,
    category: 'Ulaşım',
    emoji: '🏎️',
    dopamineMultiplier: 4,
  },
  {
    id: 'island-001',
    name: 'Özel Ada "Maldiv İncisi"',
    description: 'Maldivler\'de tamamı size ait, helikopter pisti ve özel resifi olan ıssız ada.',
    price: 950_000_000,
    category: 'Emlak',
    emoji: '🏝️',
    dopamineMultiplier: 6,
  },
  {
    id: 'penthouse-001',
    name: 'Manhattan Gökdelen Çatı Katı',
    description: '360 derece şehir manzaralı, kendi asansörü olan 1200 metrekarelik çatı katı.',
    price: 180_000_000,
    category: 'Emlak',
    emoji: '🏙️',
    dopamineMultiplier: 4.5,
  },
  {
    id: 'castle-001',
    name: 'Orta Çağ Kalesi (İskoçya)',
    description: '14. yüzyıldan kalma, hendeği ve özel ormanı olan tarihi şato.',
    price: 95_000_000,
    category: 'Emlak',
    emoji: '🏰',
    dopamineMultiplier: 4,
  },
  {
    id: 'burger-001',
    name: '24 Karat Altın Kaplamalı Burger',
    description: 'Wagyu eti, beluga havyarı ve yenilebilir altın yaprakla kaplanmış efsanevi burger.',
    price: 25_000,
    category: 'Gastronomi',
    emoji: '🍔',
    dopamineMultiplier: 1.2,
  },
  {
    id: 'pizza-001',
    name: 'Elmaslı Lüks Pizza',
    description: 'Üzerinde gerçek beyaz trüf, ıstakoz ve serpiştirilmiş pul altın bulunan pizza.',
    price: 18_000,
    category: 'Gastronomi',
    emoji: '🍕',
    dopamineMultiplier: 1.1,
  },
  {
    id: 'wine-001',
    name: '1945 Romanée-Conti Şarap Şişesi',
    description: 'Dünyada sadece birkaç şişe kalan, müzayedelerin efsanesi nadir şarap.',
    price: 2_200_000,
    category: 'Gastronomi',
    emoji: '🍷',
    dopamineMultiplier: 2.5,
  },
  {
    id: 'watch-001',
    name: 'Patek Philippe Grandmaster Chime',
    description: 'Dünyanın en karmaşık cep saatlerinden biri, elle yapılmış 20 komplikasyon.',
    price: 31_000_000,
    category: 'Takı & Saat',
    emoji: '⌚',
    dopamineMultiplier: 3.5,
  },
  {
    id: 'diamond-001',
    name: 'Pembe Elmas "Graff Pink" Yüzük',
    description: '23.88 karatlık, müzayedede dünya rekoru kıran efsanevi pembe elmas yüzük.',
    price: 46_000_000,
    category: 'Takı & Saat',
    emoji: '💍',
    dopamineMultiplier: 4,
  },
  {
    id: 'crown-001',
    name: 'Özel Tasarım Taç (Kraliyet Replikası)',
    description: 'Saf platin ve 2.800 mücevherle işlenmiş, tamamen size özel taç.',
    price: 8_500_000,
    category: 'Takı & Saat',
    emoji: '👑',
    dopamineMultiplier: 3,
  },
  {
    id: 'space-001',
    name: 'Uzay Turizmi Bileti (Yörünge Oteli)',
    description: 'Dünya yörüngesindeki özel uzay otelinde 10 günlük tatil paketi.',
    price: 55_000_000,
    category: 'Uzay & Bilim',
    emoji: '🚀',
    dopamineMultiplier: 5,
  },
  {
    id: 'moon-001',
    name: 'Ay\'da 1 Hektar Arazi Tapusu',
    description: 'Uluslararası Ay Kayıt Ofisi onaylı (gayriresmi) sembolik ay arazisi tapusu.',
    price: 4_999,
    category: 'Uzay & Bilim',
    emoji: '🌕',
    dopamineMultiplier: 1.05,
  },
  {
    id: 'rocket-001',
    name: 'Kişisel Suborbital Roket Bileti',
    description: 'Karman hattını geçip ağırlıksızlık deneyimi yaşatan 90 dakikalık roket seferi.',
    price: 1_200_000,
    category: 'Uzay & Bilim',
    emoji: '🛰️',
    dopamineMultiplier: 2.2,
  },
  {
    id: 'art-001',
    name: 'Leonardo da Vinci Tablosu "Salvator Mundi"',
    description: 'Dünyanın en pahalı tablosu, özel kasada saklanmaya hazır orijinal eser.',
    price: 450_300_000,
    category: 'Sanat & Koleksiyon',
    emoji: '🖼️',
    dopamineMultiplier: 5.5,
  },
  {
    id: 'dino-001',
    name: 'Tam Boy T-Rex Fosili',
    description: 'Müzayedede satışa çıkan, %80 orijinal kemiklerden oluşan dinazor iskeleti.',
    price: 31_800_000,
    category: 'Sanat & Koleksiyon',
    emoji: '🦖',
    dopamineMultiplier: 4.2,
  },
  {
    id: 'card-001',
    name: 'Efsanevi Pokémon Kartı (1. Baskı Charizard)',
    description: 'PSA 10 dereceli, dünyada birkaç adet kalan ilk baskı Charizard kartı.',
    price: 5_275_000,
    category: 'Sanat & Koleksiyon',
    emoji: '🃏',
    dopamineMultiplier: 2.8,
  },
  {
    id: 'submarine-001',
    name: 'Kişisel Lüks Denizaltı',
    description: '3 kişilik, panoramik cam kabinli, 300 metre dalış kapasiteli özel denizaltı.',
    price: 18_000_000,
    category: 'Yaşam Tarzı',
    emoji: '🤿',
    dopamineMultiplier: 3.2,
  },
  {
    id: 'zoo-001',
    name: 'Özel Hayvanat Bahçesi (Beyaz Aslan Dahil)',
    description: 'Bahçenizde kurulu, veteriner ekibi dahil tam donanımlı özel mini hayvanat bahçesi.',
    price: 62_000_000,
    category: 'Yaşam Tarzı',
    emoji: '🦁',
    dopamineMultiplier: 3.8,
  },
];

export function getProductsByCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((product) => product.category === category);
}

export function getAllCategories(): ProductCategory[] {
  return Array.from(new Set(PRODUCTS.map((product) => product.category)));
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}
