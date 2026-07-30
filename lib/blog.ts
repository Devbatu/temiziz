export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: number;
  category: string;
  /** Tool slugs this post should cross-link to. */
  tools: string[];
  /** Markdown-lite body: paragraphs and `## ` headings. */
  body: string;
}

export const posts: Post[] = [
  {
    slug: 'pdf-dosya-boyutu-kucultme-rehberi',
    title: 'PDF Dosya Boyutunu Küçültmenin 5 Etkili Yolu',
    excerpt:
      'E-posta limitine takılan PDF’leri kaliteden ödün vermeden küçültmenin pratik yöntemleri.',
    date: '2025-03-18',
    readingTime: 6,
    category: 'PDF',
    tools: ['compress-pdf', 'merge-pdf', 'image-compressor'],
    body: `PDF dosyaları çoğu zaman içindeki görseller yüzünden büyür. Metin katmanı birkaç yüz kilobayt yer kaplarken, taranmış tek bir sayfa onlarca megabayta ulaşabilir.

## 1. Görsel çözünürlüğünü düşürün
Ekranda okunacak bir belge için 150 DPI fazlasıyla yeterlidir. Baskı için 300 DPI gerekir, ancak arşivleme amaçlı belgelerde bu değeri düşürmek dosya boyutunu yarıdan fazla azaltır.

## 2. Gereksiz sayfaları çıkarın
Boş sayfalar, kapak tekrarları ve ekler çoğu zaman gereksizdir. PDF Böl aracıyla yalnızca ihtiyacınız olan aralığı ayırabilirsiniz.

## 3. Gömülü fontları sadeleştirin
Belgede kullanılmayan font varyantlarının gömülü kalması boyutu artırır. Yeniden kaydetme sırasında yalnızca kullanılan karakter setini gömmek daha verimlidir.

## 4. Görselleri önceden sıkıştırın
Belgeyi oluşturmadan önce görselleri sıkıştırmak, sonradan tüm PDF’i yeniden işlemekten çok daha iyi sonuç verir.

## 5. Birleştirirken tekrarları temizleyin
Birden fazla PDF’i birleştirirken aynı kapak veya antet sayfasının tekrarlanmadığından emin olun.`,
  },
  {
    slug: 'core-web-vitals-gorsel-optimizasyonu',
    title: 'Core Web Vitals için Görsel Optimizasyonu',
    excerpt:
      'LCP puanınızı düşüren en büyük neden genelde görsellerdir. Doğru format ve boyut nasıl seçilir?',
    date: '2025-03-10',
    readingTime: 8,
    category: 'Performans',
    tools: ['image-compressor', 'image-resizer', 'image-converter'],
    body: `Largest Contentful Paint (LCP) metriği, sayfadaki en büyük görsel öğenin ne kadar sürede göründüğünü ölçer. Çoğu sitede bu öğe bir kapak görselidir.

## Doğru formatı seçin
WebP, aynı görsel kalitesinde JPEG’e göre ortalama %25-35 daha küçük dosya üretir. Şeffaflık gerekmiyorsa PNG yerine WebP veya JPEG tercih edin.

## Gerçek gösterim boyutunda sunun
2400 piksel genişliğinde bir görseli 600 piksellik bir alanda göstermek, kullanıcıya boşuna dört kat veri indirtir. Görseli önce hedef boyuta indirin.

## Kalite ayarını deneyerek bulun
%80 kalite çoğu fotoğrafta gözle ayırt edilemezken dosya boyutunu belirgin şekilde düşürür.`,
  },
  {
    slug: 'guclu-parola-nasil-olusturulur',
    title: 'Güçlü Parola Nasıl Oluşturulur?',
    excerpt:
      'Uzunluk mu karmaşıklık mı? Parola güvenliğinde gerçekten işe yarayan kurallar.',
    date: '2025-02-28',
    readingTime: 5,
    category: 'Güvenlik',
    tools: ['password-generator', 'hash-generator'],
    body: `Parola güvenliğinde en belirleyici faktör uzunluktur. 8 karakterlik karmaşık bir parola, 16 karakterlik basit bir parola cümlesinden çok daha hızlı kırılır.

## Uzunluk her şeydir
Her ek karakter, denenecek kombinasyon sayısını üstel olarak artırır. En az 16 karakter hedefleyin.

## Tekrar kullanmayın
Bir sitede sızan parola, aynı parolayı kullandığınız tüm hesapları riske atar.

## Parola yöneticisi kullanın
Rastgele üretilmiş, her site için farklı parolaları ezberlemeye çalışmayın.`,
  },
  {
    slug: 'json-hatalari-ve-cozumleri',
    title: 'En Sık Yapılan 7 JSON Hatası',
    excerpt: 'Sondaki virgülden tırnak tipine, API entegrasyonlarını bozan klasik JSON hataları.',
    date: '2025-02-14',
    readingTime: 7,
    category: 'Geliştirme',
    tools: ['json-formatter', 'json-validator', 'jwt-decoder'],
    body: `JSON basit bir formattır ama katı kuralları vardır. En sık karşılaşılan hatalar neredeyse her zaman aynıdır.

## Sondaki virgül
JavaScript nesnelerinde geçerli olan sondaki virgül, JSON’da sözdizimi hatasıdır.

## Tek tırnak
JSON yalnızca çift tırnak kabul eder. Anahtarlar da tırnak içinde olmalıdır.

## Yorum satırları
JSON standardında yorum yoktur. Yapılandırma dosyalarınızda yoruma ihtiyaç duyuyorsanız JSON5 veya YAML düşünün.`,
  },
  {
    slug: 'meta-etiketleri-2025-rehberi',
    title: 'Meta Etiketleri: 2025 Uygulama Rehberi',
    excerpt: 'Hangi meta etiketleri hâlâ önemli, hangileri artık yok sayılıyor?',
    date: '2025-01-30',
    readingTime: 9,
    category: 'SEO',
    tools: ['meta-tag-generator', 'opengraph-generator', 'schema-generator'],
    body: `Meta etiketlerinin bir kısmı yıllar içinde önemini yitirdi, bir kısmı ise hâlâ tıklanma oranınızı doğrudan etkiliyor.

## Title etiketi
Sıralamayı ve tıklanmayı en çok etkileyen tek etikettir. 55-60 karakter arasında tutun.

## Meta description
Doğrudan sıralama faktörü değildir ama arama sonuçlarındaki tıklanma oranını belirler.

## Meta keywords
Google tarafından uzun süredir yok sayılıyor. Eklemenize gerek yok.

## OpenGraph
Bağlantınız sosyal medyada paylaşıldığında nasıl göründüğünü belirler; ihmal edilmemeli.`,
  },
  {
    slug: 'qr-kod-kullanim-alanlari',
    title: 'QR Kodların İşletmeler İçin 10 Kullanım Alanı',
    excerpt: 'Menüden fatura takibine, QR kodu gerçekten işe yarar hale getiren senaryolar.',
    date: '2025-01-18',
    readingTime: 6,
    category: 'Pazarlama',
    tools: ['qr-code-generator', 'qr-scanner', 'website-screenshot'],
    body: `QR kod, fiziksel dünya ile dijital içerik arasındaki en ucuz köprüdür. Doğru senaryoda kullanıldığında dönüşüm oranı yüksektir.

## Dijital menü
Basılı menü maliyetini sıfırlar, fiyat güncellemesini anında yapmanızı sağlar.

## Etkinlik kaydı
Davetiye üzerindeki kod, katılımcıyı doğrudan kayıt formuna götürür.

## Wi-Fi paylaşımı
Misafirlerinize parolayı yazdırmadan güvenli bağlantı sunabilirsiniz.`,
  },
];

export const postMap = new Map(posts.map((p) => [p.slug, p]));

export function getPost(slug: string) {
  return postMap.get(slug);
}

export function postsForTool(slug: string, limit = 3) {
  return posts.filter((p) => p.tools.includes(slug)).slice(0, limit);
}
