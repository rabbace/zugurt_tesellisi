import { Product, UserReview } from './types';

export interface DisplayReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: number;
  seller: string;
  helpful: number;
  mine: boolean;
}

const NAMES = ['Ayşe', 'Mehmet', 'Zeynep', 'Emre', 'Elif', 'Burak', 'Selin', 'Can', 'Merve', 'Oğuz', 'Deniz', 'Ece', 'Kerem', 'Buse', 'Mert', 'Gizem'];
const SURNAMES = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Koç'];

const POSITIVE = [
  'Ürün açıklandığı gibi geldi, paketleme çok özenliydi. Kesinlikle tavsiye ederim.',
  'Kargo beklediğimden hızlı geldi. Fiyat/performans olarak gayet başarılı.',
  'İkinci kez alıyorum, yine memnun kaldım. Satıcıya teşekkürler.',
  'Kalitesi fotoğraflardakinden bile iyi. Kampanyada aldığım için ayrıca sevindim.',
  'Hediye olarak aldım, çok beğenildi. Orijinal ürün, faturası da geldi.',
  'Uzun süre araştırdım, iyi ki bunu almışım. Günlük kullanımda hiçbir sorun yok.',
];
const NEUTRAL = [
  'Ürün güzel ama kargo bir gün gecikti. Yine de genel olarak memnunum.',
  'Fiyatına göre idare eder. Beklentim biraz daha yüksekti.',
  'Kutusu hafif ezik geldi ama ürüne bir şey olmamış.',
];
const NEGATIVE = ['Beklediğim gibi çıkmadı, iade sürecini başlattım. Satıcı hızlı dönüş yaptı.'];

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function maskName(first: string, last: string): string {
  return `${first[0]}** ${last[0]}**`;
}

export function sampleReviews(product: Product, now: number): DisplayReview[] {
  const rand = seeded(hash(product.id));
  const count = 4;
  const out: DisplayReview[] = [];
  const used = new Set<string>();
  for (let i = 0; i < count; i++) {
    const roll = rand();
    const high = product.rating >= 4.5;
    const rating = roll < (high ? 0.75 : 0.55) ? 5 : roll < 0.9 ? 4 : roll < 0.97 ? 3 : 2;
    const pool = (rating >= 4 ? POSITIVE : rating === 3 ? NEUTRAL : NEGATIVE).filter((t) => !used.has(t));
    const text = pool.length ? pool[Math.floor(rand() * pool.length)] : POSITIVE[i % POSITIVE.length];
    used.add(text);
    out.push({
      id: `${product.id}-s${i}`,
      author: maskName(NAMES[Math.floor(rand() * NAMES.length)], SURNAMES[Math.floor(rand() * SURNAMES.length)]),
      rating,
      text,
      createdAt: now - Math.floor(rand() * 60 + 1) * 86400000,
      seller: product.seller,
      helpful: Math.floor(rand() * 120),
      mine: false,
    });
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export function combinedRating(product: Product, mine: UserReview[]): { rating: number; count: number } {
  const own = mine.filter((r) => r.productId === product.id);
  if (own.length === 0) return { rating: product.rating, count: product.reviewCount };
  const count = product.reviewCount + own.length;
  const sum = product.rating * product.reviewCount + own.reduce((s, r) => s + r.rating, 0);
  return { rating: Math.round((sum / count) * 10) / 10, count };
}
