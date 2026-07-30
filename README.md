# MultiTools — Online Tools Platform

Next.js 15 (App Router) + Tailwind v4 ile kurulmuş, 500+ araca ölçeklenebilecek online araç platformu.

## Çalıştırma

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # üretim derlemesi
npm start
```

## Mimari

Her şey **tek bir kayıt defterinden** türetilir — rotalar, arama, kategoriler, sitemap ve SEO meta verileri dahil.

| Dosya | Sorumluluk |
| --- | --- |
| `lib/tools.ts` | Tüm araçların meta verisi (tek doğruluk kaynağı) |
| `lib/ai-prompts.ts` | AI araçlarının sistem prompt'ları ve form alanları |
| `lib/pdfjs.ts` | pdf.js yükleyicisi ve sayfa render yardımcıları |
| `app/api/net/route.ts` | WHOIS, IP, SSL, ping, port, durum kontrolü (Node soketleri) |
| `app/api/ai/route.ts` | Anthropic Messages API ile metin üretimi |
| `lib/categories.ts` | Kategoriler, renk paletleri, ikonlar |
| `lib/seo.ts` | Meta açıklama, başlık, JSON-LD (SoftwareApplication + Breadcrumb + FAQ) |
| `lib/format.ts` | Saf metin dönüşümleri (JSON/XML/HTML/CSS/JS/SQL/Base64/Markdown…) |
| `lib/blog.ts` | Blog içerikleri ve araç ↔ yazı bağlantıları |
| `components/tools/registry.tsx` | slug → bileşen eşlemesi; her araç ayrı chunk olarak lazy yüklenir |
| `app/tools/[slug]/page.tsx` | Tek şablon, tüm araç sayfalarını statik üretir |
| `app/sitemap.ts` / `app/robots.ts` | Kayıt defterinden otomatik üretilir |

### Yeni araç ekleme (2 adım)

1. `lib/tools.ts` içine bir kayıt ekleyin.
2. Bileşeni yazıp `components/tools/registry.tsx` içinde slug'a bağlayın.

`/admin` sayfasındaki **üretici** bu iki kod parçasını sizin için hazırlar.

## Öne çıkanlar

- **76 aracın tamamı çalışır durumda.** 66'sı tamamen tarayıcıda, 10'u (AI + ağ araçları) sunucu üzerinden.
- **Gizlilik:** PDF, görsel ve metin araçlarının tamamı tarayıcıda çalışır — dosya sunucuya gitmez.
- **Performans:** 104 sayfa statik üretilir; paylaşılan JS ~102 kB, ağır bağımlılıklar (pdf-lib, pdf.js, gifenc, qrcode) yalnızca ilgili araçta yüklenir.
- **Tema:** Aydınlık/karanlık, ilk boyamadan önce uygulanır (FOUC yok).
- **SEO:** Sayfa başına canonical, OpenGraph, Twitter kartı ve üç ayrı JSON-LD şeması.
- **Erişilebilirlik:** Klavye ile gezinilebilir arama (`⌘K`), skip link, `prefers-reduced-motion` desteği.

## Yapılandırma

`.env.example` dosyasını `.env.local` olarak kopyalayın:

| Değişken | Gerekli mi? | Ne için |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Üretimde | Canonical, OpenGraph ve sitemap URL'leri |
| `ANTHROPIC_API_KEY` | AI araçları için | 10 AI aracının metin üretimi |
| `SCREENSHOT_API_URL` | İsteğe bağlı | Site Ekran Görüntüsü aracı (başsız tarayıcı sağlayıcısı) |

Tanımlanmayan değişkenlerde ilgili araç, kullanıcıya ne yapılması gerektiğini anlatan net bir mesaj gösterir — sessizce bozulmaz.

## Gelir modeli

| Kanal | Nerede | Dosya |
| --- | --- | --- |
| AdSense | Ana sayfa (2), araç sayfası (2), kategori (1), araç listesi (1), blog yazısı (1) | `components/ads/AdUnit.tsx` |
| Affiliate | Araç sayfasında araca özel 1 teklif, kategoride 2 teklif | `lib/monetization.ts` → `offers` |
| Premium | Reklam yapılandırılmadığında reklam alanı Premium tanıtımına döner | `AdUnit` → `PlaceholderPromo` |
| API / İş planı | `/api` ve `/pricing` sayfaları | — |

Teknik notlar:

- **CLS sıfır.** Her reklam alanı sabit yükseklikle rezerve edilir; reklam gelsin gelmesin düzen kaymaz.
- **Tembel yükleme.** Reklam birimi görünüm alanına 300 px kalana kadar başlatılmaz; AdSense betiği `lazyOnload` ile yüklenir.
- **Consent Mode v2.** Ziyaretçi karar verene kadar kişiselleştirme `denied` başlar. Banner `components/ads/Monetization.tsx` içinde.
- **ads.txt** `NEXT_PUBLIC_ADSENSE_CLIENT` değerinden otomatik üretilir (`/ads.txt`).
- **Affiliate uyumu.** Tüm sponsorlu bağlantılar `rel="sponsored nofollow noopener"` taşır ve görünür "Sponsorlu" etiketiyle işaretlenir (Google link politikası + Ticari Reklam Yönetmeliği).

> **AB/İngiltere trafiği için not:** AdSense, EEA ve İngiltere ziyaretçileri için Google onaylı (IAB TCF) bir CMP zorunlu kılar. Buradaki banner Consent Mode v2'yi doğru şekilde sürer ve Türkiye trafiği için yeterlidir; EEA trafiği hedefleyecekseniz sertifikalı bir CMP eklemeniz gerekir.

## Yayın yolu A — paylaşımlı hosting (statik)

Sunucu gerektirmeyen saf HTML/CSS/JS üretir. LiteSpeed/Apache/nginx fark etmez.

```bash
npm run build:static      # → out/ klasörü + celaning-static.zip
```

`out/` klasörünün **içindekileri** `public_html/` altına yükleyin (klasörün kendisini değil).

Ne çalışır / çalışmaz:

- ✅ 66 araç — tüm PDF, görsel, geliştirici, SEO üreticileri, hesaplayıcılar, DNS sorgulama, döviz çevirici
- ❌ 10 araç — WHOIS, IP, SSL, Ping, Port, Site Durumu, Canonical, ekran görüntüsü ve 10 AI aracı (sunucu gerektirir)

Devre dışı araçlar bozuk görünmez; kullanıcıya durumu açıklayan bir panel gösterirler. Listeyi
`lib/runtime.ts` içindeki `serverTools` belirler.

Derleme script'i (`scripts/build-static.mjs`) sunucu rotalarını derleme süresince geçici olarak
kenara alır, `ads.txt` ve `.htaccess` dosyalarını üretir, iş bitince rotaları geri koyar.

## Yayın yolu B — Docker (VPS)

```bash
cp .env.example .env
# .env dosyasını doldurun, sonra:
docker compose up -d --build
```

Uygulama `http://localhost:3000` üzerinde çalışır. Önüne Nginx/Caddy koyup 80/443'ü yönlendirin ve SSL'i orada sonlandırın.

`NEXT_PUBLIC_*` değerleri **derleme anında** paketlenir — değiştirdiğinizde `docker compose up -d --build` ile yeniden derleyin. Sunucu sırları (`ANTHROPIC_API_KEY` vb.) çalışma anında okunur, yeniden derleme gerektirmez.

## Bilinçli sınırlar

Aşağıdakiler teknik gerçeklerdir ve arayüzde de kullanıcıya açıkça söylenir:

- **PDF Sıkıştır** kayıpsız optimizasyon yapar (yapı yeniden yazılır, meta veri temizlenir). Taranmış PDF'lerde kazanç sınırlıdır.
- **PDF Kilidini Aç** parola kırmaz; parolayı bilmeniz gerekir. Çıktıda sayfalar görüntü olarak yeniden oluşturulur.
- **PDF to Word** metin katmanını aktarır; tablo ve gömülü görselleri aktarmaz, taranmış PDF'lerde çalışmaz (OCR gerekir).
- **Arka Plan Silici** düz renkli arka planlar içindir (ürün fotoğrafı, logo); karmaşık doğal sahnelerde çalışmaz.
- **Görsel Büyütücü** kademeli yeniden örnekleme + netleştirme kullanır; kayıp detayı yeniden üretmez.
- **Ping Testi** ICMP değil TCP el sıkışma süresini ölçer ve sunucu konumundan yapılır.
- **Yorumlar** bölümü backend olmadığı için localStorage'da tutulur.
