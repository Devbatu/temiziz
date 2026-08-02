import type { CategoryId } from './categories';
import { businessTools, healthTools } from './tools-professional';

export interface FaqItem {
  q: string;
  a: string;
}

export interface Tool {
  /** URL segment — /tools/<slug> */
  slug: string;
  name: string;
  category: CategoryId;
  /** Single-sentence meta description seed. */
  description: string;
  /** Lucide icon name. */
  icon: string;
  /** Search keywords (TR + EN). */
  keywords: string[];
  /** Curated ranking score, 0-100. Drives "en çok kullanılan" ordering. */
  popularity: number;
  /** ISO date the tool was published — drives "son eklenen". */
  added: string;
  badges?: Array<'popular' | 'new' | 'trending' | 'pro'>;
  /** Longer intro paragraph shown on the tool page. */
  about?: string;
  /** Concrete "ne işe yarar" bullets. */
  useCases?: string[];
  faq?: FaqItem[];
  /** True when the interactive widget is wired up. */
  live?: boolean;
}

/**
 * The single source of truth for every tool on the platform.
 * Adding a tool = one entry here + one component in `components/tools/registry.tsx`.
 * Routes, sitemap, search, categories and SEO metadata all derive from this list.
 */
export const tools: Tool[] = [
  // ─────────────────────────────── PDF ───────────────────────────────
  {
    slug: 'merge-pdf',
    name: 'PDF Birleştir',
    category: 'pdf',
    description:
      'Birden fazla PDF dosyasını istediğiniz sırayla tek bir PDF haline getirin.',
    icon: 'Combine',
    keywords: ['pdf birleştir', 'merge pdf', 'pdf birleştirme', 'combine pdf'],
    popularity: 96,
    added: '2025-01-12',
    badges: ['popular'],
    live: true,
    about:
      'PDF Birleştir aracı, seçtiğiniz tüm PDF dosyalarını sayfa kalitesini bozmadan tek bir belgede toplar. İşlem tamamen tarayıcınızda yapılır; dosyalarınız hiçbir sunucuya yüklenmez.',
    useCases: [
      'Fatura, dekont ve makbuzları tek dosyada arşivlemek',
      'Bölüm bölüm hazırlanmış raporları teslim öncesi birleştirmek',
      'Tarayıcıdan sayfa sayfa çıkan taramaları tek belgeye çevirmek',
    ],
    faq: [
      {
        q: 'Dosyalarım sunucuya yükleniyor mu?',
        a: 'Hayır. Birleştirme işlemi WebAssembly ile tamamen tarayıcınızda çalışır, dosyanız cihazınızdan çıkmaz.',
      },
      {
        q: 'Kaç dosya birleştirebilirim?',
        a: 'Pratik bir sınır yoktur; toplam boyut cihazınızın belleğiyle sınırlıdır. 100 MB’a kadar dosyalarda sorunsuz çalışır.',
      },
      {
        q: 'Sıralamayı değiştirebilir miyim?',
        a: 'Evet, dosyaları listeye ekledikten sonra yukarı/aşağı taşıyarak istediğiniz sırayı belirleyebilirsiniz.',
      },
    ],
  },
  {
    slug: 'split-pdf',
    name: 'PDF Böl',
    category: 'pdf',
    description:
      'PDF dosyanızdan istediğiniz sayfa aralığını ayırın veya belgeyi parçalara bölün.',
    icon: 'Scissors',
    keywords: ['pdf böl', 'split pdf', 'sayfa ayır', 'pdf ayırma'],
    popularity: 88,
    added: '2025-01-12',
    badges: ['popular'],
    live: true,
    useCases: [
      'Uzun bir sözleşmeden yalnızca ilgili sayfaları paylaşmak',
      'Sunum dosyasından tek bir bölümü çıkarmak',
      'E-kitaptan belirli bölümleri ayrı dosya yapmak',
    ],
  },
  {
    slug: 'compress-pdf',
    name: 'PDF Sıkıştır',
    category: 'pdf',
    description:
      'PDF dosya boyutunu düşürerek e-posta ve yükleme limitlerine sığdırın.',
    icon: 'Minimize2',
    keywords: ['pdf sıkıştır', 'compress pdf', 'pdf boyut küçültme'],
    popularity: 91,
    added: '2025-01-12',
    badges: ['popular', 'trending'],
    live: true,
  },
  {
    slug: 'rotate-pdf',
    name: 'PDF Döndür',
    category: 'pdf',
    description: 'Ters veya yan duran PDF sayfalarını 90° adımlarla düzeltin.',
    icon: 'RotateCw',
    keywords: ['pdf döndür', 'rotate pdf', 'sayfa çevirme'],
    popularity: 64,
    added: '2025-01-20',
    live: true,
  },
  {
    slug: 'protect-pdf',
    name: 'PDF Şifrele',
    category: 'pdf',
    description: 'PDF dosyanıza parola ekleyerek yetkisiz erişimi engelleyin.',
    icon: 'Lock',
    keywords: ['pdf şifrele', 'protect pdf', 'pdf parola', 'pdf koruma', 'pdf kilitleme'],
    popularity: 72,
    added: '2025-02-02',
    live: true,
    about:
      'PDF Şifrele aracı, belgenize AES-256 şifreleme ile açma parolası ekler ve yazdırma, kopyalama, düzenleme izinlerini ayrı ayrı kontrol etmenizi sağlar. Şifreleme tamamen tarayıcınızda yapılır — ne dosyanız ne de parolanız sunucuya gönderilir.',
    useCases: [
      'Maaş bordrosu, sözleşme ve mali tabloları e-posta ile güvenle göndermek',
      'Müşteriye teslim edilen teklif dosyasında kopyalamayı kısıtlamak',
      'Hasta, öğrenci veya personel kayıtlarını KVKK gereklerine uygun paylaşmak',
    ],
    faq: [
      {
        q: 'Hangi şifreleme standardı kullanılıyor?',
        a: 'PDF standardının AES-256 güvenlik işleyicisi kullanılır. Bu, modern PDF okuyucuların tamamı tarafından desteklenen en güçlü seçenektir.',
      },
      {
        q: 'Parolamı unutursam ne olur?',
        a: 'Belgeye erişemezsiniz. AES-256 şifrelemesi parola olmadan çözülemez; parolanızı bir parola yöneticisinde saklamanızı öneririz.',
      },
      {
        q: 'Açma parolası ile sahip parolası arasındaki fark nedir?',
        a: 'Açma parolası belgeyi görüntülemek için gerekir. Sahip parolası ise yazdırma ve düzenleme gibi izinleri değiştirmek isteyenlerden istenir; boş bırakırsanız açma parolası her ikisi için kullanılır.',
      },
    ],
  },
  {
    slug: 'unlock-pdf',
    name: 'PDF Kilidini Aç',
    category: 'pdf',
    description:
      'Parolasını bildiğiniz PDF dosyalarındaki kısıtlamaları kaldırın.',
    icon: 'Unlock',
    keywords: ['pdf kilit aç', 'unlock pdf', 'pdf parola kaldır', 'pdf kısıtlama kaldırma'],
    popularity: 70,
    added: '2025-02-02',
    live: true,
    about:
      'PDF Kilidini Aç, parolasını bildiğiniz korumalı bir belgeyi açar ve kısıtlamasız yeni bir PDF olarak yeniden oluşturur. Araç parola kırmaz — yalnızca erişim hakkınız olan belgelerde kullanılabilir. Tüm işlem tarayıcınızda gerçekleşir.',
    useCases: [
      'Kendi arşivinizdeki eski korumalı belgeleri yeniden düzenlenebilir hale getirmek',
      'Bankadan gelen parolalı ekstreyi muhasebe programına aktarmadan önce açmak',
      'Yazdırması kısıtlanmış kendi belgenizi baskıya hazırlamak',
    ],
    faq: [
      {
        q: 'Parolayı bilmiyorsam kullanabilir miyim?',
        a: 'Hayır. Bu araç parola kırma veya tahmin etme yapmaz; belgeyi açmak için doğru parolayı girmeniz gerekir.',
      },
      {
        q: 'Çıktıdaki metni seçebilir miyim?',
        a: 'Hayır. Sayfalar görüntü olarak yeniden oluşturulduğu için çıktıda seçilebilir metin katmanı bulunmaz. Metne ihtiyacınız varsa PDF to Word aracını kullanın.',
      },
      {
        q: 'Yasal mı?',
        a: 'Yalnızca sahibi olduğunuz veya erişim hakkınızın bulunduğu belgelerde kullanın. Başkasına ait korumalı belgelerin kilidini kaldırmak yasa dışı olabilir.',
      },
    ],
  },
  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    category: 'pdf',
    description: 'PDF sayfalarını yüksek çözünürlüklü JPG görsellere dönüştürün.',
    icon: 'FileImage',
    keywords: ['pdf to jpg', 'pdf görsele çevir', 'pdf jpg', 'pdf png', 'pdf resme dönüştürme'],
    popularity: 85,
    added: '2025-01-25',
    badges: ['popular'],
    live: true,
    about:
      'PDF to JPG, belgenizin her sayfasını seçtiğiniz çözünürlükte JPG, PNG veya WebP görsele dönüştürür. Sayfaları tek tek indirebilir veya hepsini tek bir ZIP dosyası olarak alabilirsiniz. Dönüştürme tarayıcınızda çalışır.',
    useCases: [
      'Sunum veya sosyal medya paylaşımı için PDF sayfalarını görsele çevirmek',
      'Katalog sayfalarını web sitesinde göstermek',
      'Belgenin bir sayfasını mesajlaşma uygulamasından hızlıca paylaşmak',
    ],
    faq: [
      {
        q: 'Hangi çözünürlüğü seçmeliyim?',
        a: 'Ekranda görüntüleme için 96-150 DPI yeterlidir. Baskı için 300 DPI seçin; dosya boyutu artar ama detay korunur.',
      },
      {
        q: 'Tüm sayfaları birden indirebilir miyim?',
        a: 'Evet. “Tümünü ZIP indir” düğmesi tüm sayfaları tek bir sıkıştırılmış dosyada indirir.',
      },
      {
        q: 'Şeffaf arka plan alabilir miyim?',
        a: 'PDF sayfaları beyaz zemin üzerine çizildiği için çıktı şeffaf olmaz. Şeffaflık gerekiyorsa PNG çıktısını Arka Plan Silici ile işleyebilirsiniz.',
      },
    ],
  },
  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    category: 'pdf',
    description: 'Fotoğraflarınızı tek tıkla düzenli bir PDF belgesine dönüştürün.',
    icon: 'FileUp',
    keywords: ['jpg to pdf', 'resimden pdf', 'fotoğraf pdf yapma'],
    popularity: 87,
    added: '2025-01-25',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'pdf-to-word',
    name: 'PDF to Word',
    category: 'pdf',
    description:
      'PDF belgelerinizi düzenlenebilir Word (DOCX) dosyasına çevirin.',
    icon: 'FileType2',
    keywords: ['pdf to word', 'pdf word çevirme', 'pdf docx', 'pdf düzenleme', 'pdf metin çıkarma'],
    popularity: 98,
    added: '2025-01-10',
    badges: ['popular', 'trending'],
    live: true,
    about:
      'PDF to Word, belgenizin metin katmanını çıkarıp sayfa düzenini koruyan bir DOCX dosyası üretir. Böylece PDF’i baştan yazmak yerine doğrudan Word, Google Dokümanlar veya LibreOffice’te düzenleyebilirsiniz. Dosyanız tarayıcınızdan çıkmaz.',
    useCases: [
      'Eski bir sözleşmeyi yeniden yazmadan güncellemek',
      'Rapordaki uzun metinleri başka bir belgeye taşımak',
      'Akademik makaleden alıntı ve kaynakça bölümlerini çıkarmak',
    ],
    faq: [
      {
        q: 'Tablolar ve görseller aktarılıyor mu?',
        a: 'Hayır. Dönüştürme metin katmanı üzerinden yapılır; tablolar, gömülü görseller ve karmaşık sütun düzenleri aktarılmaz. Metin ise tam olarak düzenlenebilir biçimde gelir.',
      },
      {
        q: 'Taranmış PDF’lerde çalışır mı?',
        a: 'Hayır. Taranmış belgeler bir görüntüden ibarettir ve seçilebilir metin içermez; bu durumda önce OCR (optik karakter tanıma) uygulanması gerekir. Araç bu durumu tespit edip sizi uyarır.',
      },
      {
        q: 'Sayfa düzeni korunuyor mu?',
        a: 'Paragraf yapısı ve sayfa sonları korunur. Yazı tipi, kenar boşlukları ve hizalama gibi görsel ayrıntılar Word’ün varsayılanlarına döner.',
      },
    ],
  },
  {
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    category: 'pdf',
    description: 'DOCX dosyalarınızı biçimini koruyarak PDF’e dönüştürün.',
    icon: 'FileDown',
    keywords: ['word to pdf', 'docx pdf', 'word pdf çevirme', 'belge dönüştürme'],
    popularity: 94,
    added: '2025-01-10',
    badges: ['popular'],
    live: true,
    about:
      'Word to PDF, .docx dosyanızı okuyarak başlıkları, paragrafları ve kalın yazı biçimini koruyan A4 sayfalar halinde bir PDF üretir. Word kurulu olmayan bilgisayarlarda da çalışır ve dosyanız tarayıcınızdan hiç çıkmaz.',
    useCases: [
      'CV veya teklif belgesini herkesin aynı gördüğü sabit bir formata çevirmek',
      'Word kurulu olmayan bir bilgisayarda belgeyi PDF olarak teslim etmek',
      'Resmî başvurularda istenen PDF formatını hazırlamak',
    ],
    faq: [
      {
        q: 'Eski .doc dosyaları destekleniyor mu?',
        a: 'Hayır, yalnızca .docx desteklenir. Eski .doc dosyalarını Word veya LibreOffice’te açıp .docx olarak kaydedin.',
      },
      {
        q: 'Görseller ve tablolar aktarılıyor mu?',
        a: 'Hayır. Metin, başlık düzeyleri ve kalın yazı biçimi korunur; gömülü görseller, tablolar ve özel yazı tipleri aktarılmaz.',
      },
      {
        q: 'Türkçe karakterler doğru çıkıyor mu?',
        a: 'Evet. Standart PDF yazı tiplerinin kodlayamadığı birkaç karakter (ğ, ı, ş gibi) en yakın Latin karşılığına çevrilir; metin okunabilirliğini korur.',
      },
    ],
  },

  // ────────────────────────────── IMAGE ──────────────────────────────
  {
    slug: 'image-compressor',
    name: 'Görsel Sıkıştırıcı',
    category: 'image',
    description:
      'Görsellerinizi kaliteyi koruyarak %90’a varan oranda küçültün.',
    icon: 'Minimize2',
    keywords: ['görsel sıkıştır', 'image compressor', 'resim boyut küçültme'],
    popularity: 95,
    added: '2025-01-14',
    badges: ['popular'],
    live: true,
    about:
      'Görsel Sıkıştırıcı, JPEG/PNG/WebP dosyalarını tarayıcı içindeki canvas motoruyla yeniden kodlar. Kalite seviyesini kendiniz belirler, sonucu anında önizler ve boyut kazancını yüzde olarak görürsünüz.',
    useCases: [
      'Web sitesi görsellerini hızlandırıp Core Web Vitals puanını yükseltmek',
      'E-ticaret ürün fotoğraflarını yükleme limitine sığdırmak',
      'E-posta ekindeki fotoğrafları küçültmek',
    ],
  },
  {
    slug: 'image-resizer',
    name: 'Görsel Boyutlandırıcı',
    category: 'image',
    description:
      'Görsellerinizi piksel veya yüzde bazlı olarak yeniden boyutlandırın.',
    icon: 'Scaling',
    keywords: ['görsel boyutlandır', 'image resizer', 'resim yeniden boyutlandırma'],
    popularity: 90,
    added: '2025-01-14',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'image-converter',
    name: 'Görsel Dönüştürücü',
    category: 'image',
    description: 'JPG, PNG ve WebP formatları arasında anında dönüştürme yapın.',
    icon: 'Repeat',
    keywords: ['image converter', 'webp dönüştür', 'png jpg çevirme'],
    popularity: 89,
    added: '2025-01-16',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'crop-image',
    name: 'Görsel Kırpma',
    category: 'image',
    description: 'Görselinizi istediğiniz en-boy oranında hassas şekilde kırpın.',
    icon: 'Crop',
    keywords: ['görsel kırp', 'crop image', 'resim kesme'],
    popularity: 78,
    added: '2025-01-16',
    live: true,
  },
  {
    slug: 'blur-image',
    name: 'Görsel Bulanıklaştırma',
    category: 'image',
    description:
      'Fotoğraftaki hassas bilgileri veya arka planı bulanıklaştırın.',
    icon: 'Droplets',
    keywords: ['blur image', 'görsel bulanıklaştır', 'sansür'],
    popularity: 61,
    added: '2025-02-05',
    live: true,
  },
  {
    slug: 'watermark-image',
    name: 'Filigran Ekle',
    category: 'image',
    description: 'Görsellerinize metin filigranı ekleyerek telif koruması sağlayın.',
    icon: 'Stamp',
    keywords: ['watermark', 'filigran ekle', 'logo ekleme'],
    popularity: 66,
    added: '2025-02-05',
    live: true,
  },
  {
    slug: 'background-remover',
    name: 'Arka Plan Silici',
    category: 'image',
    description: 'Düz renkli arka planları tek tıkla saydam hale getirin.',
    icon: 'Eraser',
    keywords: ['arka plan sil', 'background remover', 'saydam arka plan', 'png saydam', 'ürün fotoğrafı'],
    popularity: 97,
    added: '2025-01-18',
    badges: ['popular', 'trending'],
    live: true,
    about:
      'Arka Plan Silici, görselin kenarlarından başlayarak düz ve tek renkli arka planı tespit eder ve saydam hale getirir. Ürün fotoğrafları, logolar ve beyaz fonda çekilmiş görsellerde çok iyi sonuç verir. Tolerans ve kenar yumuşatma ayarlarıyla sonucu kendiniz ince ayarlayabilirsiniz; işlem tamamen tarayıcınızda çalışır.',
    useCases: [
      'E-ticaret ürün fotoğraflarını beyaz fondan kurtarıp katalogda kullanmak',
      'Logoyu saydam PNG olarak sunum ve web sitesine yerleştirmek',
      'Tasarımda kullanmak üzere ikon ve grafikleri fondan ayırmak',
    ],
    faq: [
      {
        q: 'Her fotoğrafta çalışır mı?',
        a: 'Hayır. Araç düz ve tek renkli arka planlar için tasarlandı. Kalabalık bir sokak fotoğrafı gibi karmaşık doğal sahnelerde beklediğiniz sonucu vermez.',
      },
      {
        q: 'Sonuç istediğim gibi çıkmadı, ne yapmalıyım?',
        a: 'Arka plandan çok az alan silindiyse renk toleransını artırın; nesnenin bir kısmı da silindiyse toleransı azaltın. Kenarlar sert görünüyorsa yumuşatma değerini yükseltin.',
      },
      {
        q: 'Çıktı hangi formatta?',
        a: 'Saydamlığı destekleyen PNG formatında. JPEG saydamlık desteklemediği için bu araçta kullanılamaz.',
      },
    ],
  },
  {
    slug: 'image-upscaler',
    name: 'Görsel Büyütücü',
    category: 'image',
    description: 'Düşük çözünürlüklü görselleri 4 katına kadar temiz şekilde büyütün.',
    icon: 'Expand',
    keywords: ['image upscaler', 'görsel büyüt', 'çözünürlük artırma', 'fotoğraf büyütme', 'netleştirme'],
    popularity: 83,
    added: '2025-02-10',
    badges: ['trending'],
    live: true,
    about:
      'Görsel Büyütücü, görselinizi kademeli yüksek kaliteli yeniden örnekleme ile 2×, 3× veya 4× büyütür ve ardından unsharp mask tekniğiyle netleştirir. Tek adımda yapılan büyütmeye göre belirgin şekilde daha temiz kenarlar üretir.',
    useCases: [
      'Küçük bir logoyu baskı çözünürlüğüne çıkarmak',
      'Web’den alınan düşük çözünürlüklü görseli sunumda büyük kullanmak',
      'Eski fotoğrafları çerçevelemeden önce ölçeklendirmek',
    ],
    faq: [
      {
        q: 'Kaybolan detayları geri getiriyor mu?',
        a: 'Hayır. Araç var olan detayı mümkün olan en temiz şekilde ölçekler; görselde hiç bulunmayan detayı üretmez. Aşırı bulanık bir fotoğraf net hale gelmez.',
      },
      {
        q: 'Netleştirme ayarını kaça getirmeliyim?',
        a: 'Çoğu fotoğraf için %30-40 iyi sonuç verir. Çok yükseltirseniz kenarlarda hale (halo) oluşabilir; grafik ve logolarda daha yüksek değerler kullanılabilir.',
      },
      {
        q: 'Dosya boyutu sınırı var mı?',
        a: 'Hedef çözünürlük 40 megapikseli aşamaz. Çok büyük bir görseli 4× büyütmek isterseniz araç sizi uyarır; daha düşük bir kat seçin.',
      },
    ],
  },
  {
    slug: 'gif-maker',
    name: 'GIF Oluşturucu',
    category: 'image',
    description: 'Görsellerinizi birleştirerek animasyonlu GIF üretin.',
    icon: 'Film',
    keywords: ['gif maker', 'gif oluştur', 'animasyon', 'gif yapma', 'hareketli görsel'],
    popularity: 69,
    added: '2025-02-12',
    live: true,
    about:
      'GIF Oluşturucu, yüklediğiniz görselleri sırayla birleştirerek animasyonlu GIF üretir. Kare süresini ve çıktı genişliğini ayarlayabilir, kareleri sürükleyerek yeniden sıralayabilirsiniz. Kodlama tarayıcınızda yapılır, görselleriniz yüklenmez.',
    useCases: [
      'Ürün tanıtımı için birkaç kareden döngüsel animasyon hazırlamak',
      'Bir sürecin adımlarını tek dosyada göstermek',
      'Sunum veya e-postaya hafif bir hareketli görsel eklemek',
    ],
    faq: [
      {
        q: 'Kaç kare ekleyebilirim?',
        a: 'Pratik bir sınır yoktur, ancak kare sayısı arttıkça dosya boyutu hızla büyür. Çoğu kullanım için 5-30 kare idealdir.',
      },
      {
        q: 'Farklı boyuttaki görseller sorun çıkarır mı?',
        a: 'Hayır. Görseller oranları bozulmadan ortalanır ve boşluklar beyazla doldurulur.',
      },
      {
        q: 'Dosya boyutunu nasıl küçültürüm?',
        a: 'Çıktı genişliğini düşürün, kare sayısını azaltın veya kare süresini uzatarak daha az kare kullanın.',
      },
    ],
  },
  {
    slug: 'meme-generator',
    name: 'Meme Oluşturucu',
    category: 'image',
    description: 'Üst ve alt yazı ekleyerek klasik meme görselleri hazırlayın.',
    icon: 'Laugh',
    keywords: ['meme generator', 'caps yapma', 'meme oluştur'],
    popularity: 74,
    added: '2025-02-12',
    live: true,
  },

  // ──────────────────────────────── AI ───────────────────────────────
  {
    slug: 'ai-resume-builder',
    name: 'AI Özgeçmiş Oluşturucu',
    category: 'ai',
    description:
      'Bilgilerinizi girin, işe alım uzmanlarının aradığı formatta CV metni alın.',
    icon: 'FileUser',
    keywords: ['cv oluştur', 'resume builder', 'özgeçmiş hazırlama', 'cv şablonu', 'ats uyumlu cv'],
    popularity: 92,
    added: '2025-03-01',
    badges: ['new', 'trending'],
    live: true,
    about:
      'AI Özgeçmiş Oluşturucu, girdiğiniz deneyim ve yetkinlikleri aday takip sistemlerinin (ATS) okuyabileceği, ölçülebilir başarılara odaklanan bir CV metnine dönüştürür. Uydurma deneyim veya sertifika eklemez — yalnızca verdiğiniz bilgileri düzenler ve güçlendirir.',
    useCases: [
      'Dağınık notlardan derli toplu bir özgeçmiş metni çıkarmak',
      'Aynı deneyimi farklı pozisyonlara göre yeniden konumlandırmak',
      'İngilizce başvurular için CV metnini hazırlamak',
    ],
    faq: [
      {
        q: 'Bilgilerim saklanıyor mu?',
        a: 'Hayır. Girdiğiniz bilgiler yalnızca o istek için işlenir; sunucularımızda saklanmaz ve model eğitiminde kullanılmaz.',
      },
      {
        q: 'ATS uyumlu ne demek?',
        a: 'Büyük şirketler başvuruları önce otomatik sistemlerle tarar. Araç, bu sistemlerin okuyamadığı karmaşık tablo ve grafiklerden kaçınıp düz metin başlıkları kullanır.',
      },
      {
        q: 'Çıktıyı olduğu gibi kullanabilir miyim?',
        a: 'Yayınlamadan önce mutlaka gözden geçirin. Yapay zekâ metni düzenler ama tarih, unvan ve rakamların doğruluğundan siz sorumlusunuz.',
      },
    ],
  },
  {
    slug: 'ai-cover-letter',
    name: 'AI Ön Yazı Oluşturucu',
    category: 'ai',
    description:
      'Başvurduğunuz pozisyona özel, ikna edici ön yazılar üretin.',
    icon: 'Mail',
    keywords: ['cover letter', 'ön yazı', 'başvuru mektubu', 'motivasyon mektubu'],
    popularity: 80,
    added: '2025-03-01',
    badges: ['new'],
    live: true,
    about:
      'AI Ön Yazı Oluşturucu, deneyiminizi başvurduğunuz pozisyonun ihtiyaçlarına bağlayan, en fazla dört paragraflık bir ön yazı üretir. Klişe kalıplardan kaçınır ve seçtiğiniz tonu tutarlı biçimde uygular.',
    useCases: [
      'Her başvuru için sıfırdan yazmak yerine pozisyona özel taslak almak',
      'Kariyer değişikliğinde geçmiş deneyimi yeni role bağlamak',
      'Yabancı dilde başvuru mektubu hazırlamak',
    ],
    faq: [
      {
        q: 'Ne kadar uzun oluyor?',
        a: 'En fazla dört paragraf. İşe alım uzmanları ön yazıya ortalama 30 saniye ayırdığı için kısa ve odaklı tutulur.',
      },
      {
        q: 'Şirket hakkında bilgi ekliyor mu?',
        a: 'Yalnızca sizin verdiğiniz bilgileri kullanır; şirket hakkında doğrulanmamış iddialar üretmez.',
      },
    ],
  },
  {
    slug: 'ai-email-generator',
    name: 'AI E-posta Üretici',
    category: 'ai',
    description: 'Konu ve tona göre profesyonel e-posta taslakları oluşturun.',
    icon: 'Send',
    keywords: ['email generator', 'e-posta yazma', 'mail taslağı', 'iş maili', 'profesyonel e-posta'],
    popularity: 86,
    added: '2025-03-02',
    badges: ['new'],
    live: true,
    about:
      'AI E-posta Üretici, amacınızı ve eklemek istediğiniz detayları alıp konu satırıyla birlikte gönderilmeye hazır bir e-posta taslağı yazar. Zor konuları (gecikmiş ödeme, olumsuz yanıt, zam talebi) doğru tonda ifade etmenizi kolaylaştırır.',
    useCases: [
      'Gecikmiş faturayı nazik ama net bir dille hatırlatmak',
      'Müşteri şikâyetine profesyonel yanıt hazırlamak',
      'Toplantı talebi veya iş birliği teklifi yazmak',
    ],
    faq: [
      {
        q: 'Konu satırı da üretiliyor mu?',
        a: 'Evet. Çıktı, açılma oranını artıracak kısa bir konu satırı ve gövde metninden oluşur.',
      },
      {
        q: 'Türkçe dışında dil desteği var mı?',
        a: 'Evet, formdan İngilizce seçebilirsiniz.',
      },
    ],
  },
  {
    slug: 'ai-blog-writer',
    name: 'AI Blog Yazarı',
    category: 'ai',
    description: 'Anahtar kelimeden SEO uyumlu blog taslağı ve içerik üretin.',
    icon: 'PenLine',
    keywords: ['blog writer', 'içerik üretici', 'yazı yazdırma', 'seo içerik', 'blog yazısı'],
    popularity: 93,
    added: '2025-03-02',
    badges: ['new', 'trending'],
    live: true,
    about:
      'AI Blog Yazarı, konu ve anahtar kelimenizden H2/H3 başlıklarla bölümlenmiş, okunabilir bir blog yazısı üretir. Anahtar kelimeyi doğal bir yoğunlukta kullanır; anahtar kelime doldurmadan kaçınır. Uzunluğu ve tonu siz belirlersiniz.',
    useCases: [
      'İçerik takviminizdeki konular için ilk taslağı hızlıca çıkarmak',
      'Yazarken tıkandığınız bölümler için yapı ve başlık önerisi almak',
      'Ürün veya hizmetinizi anlatan bilgilendirici içerik hazırlamak',
    ],
    faq: [
      {
        q: 'Üretilen içerik özgün mü?',
        a: 'Metin her seferinde yeniden üretilir, kopyalanmaz. Yine de yayınlamadan önce kendi bilgi ve örneklerinizi ekleyerek zenginleştirmenizi öneririz.',
      },
      {
        q: 'İstatistik ve kaynak veriyor mu?',
        a: 'Hayır. Araç bilinçli olarak rakam ve alıntı uydurmaz; sayısal iddiaları kendi kaynaklarınızla eklemelisiniz.',
      },
      {
        q: 'Arama motorları AI içeriği cezalandırır mı?',
        a: 'Google, üretim yöntemine değil içeriğin faydasına bakar. Taslağı düzenleyip özgün değer katarsanız sorun yaşamazsınız.',
      },
    ],
  },
  {
    slug: 'ai-caption-generator',
    name: 'AI Açıklama Üretici',
    category: 'ai',
    description: 'Sosyal medya gönderileriniz için etkileyici açıklamalar yazın.',
    icon: 'MessageSquareText',
    keywords: ['caption generator', 'instagram açıklama', 'sosyal medya metni', 'gönderi yazısı'],
    popularity: 84,
    added: '2025-03-04',
    badges: ['new'],
    live: true,
    about:
      'AI Açıklama Üretici, gönderi konunuz için seçtiğiniz platformun üslubuna uygun beş farklı açıklama alternatifi üretir. Böylece markanıza en uygun olanı seçip düzenleyebilirsiniz.',
    useCases: [
      'Aynı görsel için farklı üsluplarda alternatifler denemek',
      'İçerik takviminizi hızlıca doldurmak',
      'LinkedIn ve Instagram için aynı konuyu farklı tonlarda anlatmak',
    ],
    faq: [
      {
        q: 'Kaç alternatif üretiliyor?',
        a: 'Her seferinde beş farklı açıklama. Beğenmezseniz tekrar üretebilirsiniz.',
      },
      {
        q: 'Emoji kullanıyor mu?',
        a: 'Ölçülü şekilde. Aşırı emoji kullanımından kaçınacak biçimde ayarlandı.',
      },
    ],
  },
  {
    slug: 'ai-product-description',
    name: 'AI Ürün Açıklaması',
    category: 'ai',
    description: 'E-ticaret ürünleriniz için dönüşüm odaklı açıklamalar üretin.',
    icon: 'ShoppingBag',
    keywords: ['ürün açıklaması', 'product description', 'e-ticaret metni', 'ürün metni yazma'],
    popularity: 81,
    added: '2025-03-04',
    badges: ['new'],
    live: true,
    about:
      'AI Ürün Açıklaması, teknik özellikleri müşterinin anlayacağı faydalara çevirir. Tarama kolaylığı için kısa bir tanıtım paragrafı, madde işaretli öne çıkan özellikler ve bir kapanış cümlesi üretir.',
    useCases: [
      'Yüzlerce ürünlük kataloğa hızlıca açıklama yazmak',
      'Tedarikçiden gelen kuru teknik listeyi satış metnine çevirmek',
      'Pazaryeri listelerini rakiplerden ayrıştırmak',
    ],
    faq: [
      {
        q: 'Vermediğim özellikleri ekliyor mu?',
        a: 'Hayır. Araç yalnızca girdiğiniz özellikleri kullanır; garanti, sertifika veya ölçü uydurmaz.',
      },
      {
        q: 'SEO açısından faydalı mı?',
        a: 'Evet. Benzersiz ürün açıklamaları, tedarikçi metnini kopyalayan mağazalara göre arama sonuçlarında avantaj sağlar.',
      },
    ],
  },
  {
    slug: 'ai-prompt-generator',
    name: 'AI Prompt Üretici',
    category: 'ai',
    description: 'Fikrinizi ayrıntılı ve etkili yapay zekâ prompt’una çevirin.',
    icon: 'Wand2',
    keywords: ['prompt generator', 'prompt yazma', 'ai komut', 'prompt mühendisliği'],
    popularity: 88,
    added: '2025-03-06',
    badges: ['new', 'trending'],
    live: true,
    about:
      'AI Prompt Üretici, kısa fikrinizi rol, bağlam, görev, kısıtlar ve istenen çıktı biçimi içeren ayrıntılı bir prompt’a dönüştürür. Çıktıyı doğrudan kopyalayıp istediğiniz yapay zekâ aracında kullanabilirsiniz.',
    useCases: [
      'Belirsiz bir fikirden tekrar kullanılabilir bir prompt şablonu çıkarmak',
      'Görsel üretim araçları için ayrıntılı sahne tarifi yazmak',
      'Ekip içinde standart prompt kütüphanesi oluşturmak',
    ],
    faq: [
      {
        q: 'Hangi araçlarda kullanabilirim?',
        a: 'Üretilen prompt genel amaçlıdır; metin, görsel, kod veya veri analizi araçlarından hangisi için istediğinizi formdan seçebilirsiniz.',
      },
      {
        q: 'Neden uzun prompt daha iyi sonuç veriyor?',
        a: 'Rol, kısıt ve çıktı biçimi belirtildiğinde model tahmin yürütmek zorunda kalmaz; sonuç beklentinize daha yakın olur.',
      },
    ],
  },
  {
    slug: 'ai-rewrite-tool',
    name: 'AI Yeniden Yazma',
    category: 'ai',
    description: 'Metninizi anlamını koruyarak farklı ton ve üslupta yeniden yazın.',
    icon: 'RefreshCw',
    keywords: ['rewrite', 'metin yeniden yazma', 'paraphrase', 'metin sadeleştirme'],
    popularity: 87,
    added: '2025-03-06',
    badges: ['new'],
    live: true,
    about:
      'AI Yeniden Yazma, metninizi anlamını ve olgusal içeriğini koruyarak seçtiğiniz amaca göre yeniden kurgular: sadeleştirme, kısaltma, detaylandırma veya ton değişikliği. Yeni bilgi eklemez, mevcut bilgiyi çıkarmaz.',
    useCases: [
      'Teknik bir metni müşterinin anlayacağı dile çevirmek',
      'Uzun bir paragrafı karakter sınırına sığdırmak',
      'Resmî bir yazıyı daha samimi hale getirmek',
    ],
    faq: [
      {
        q: 'Anlam değişiyor mu?',
        a: 'Hayır, amaç anlamı korumaktır. Yine de önemli belgelerde çıktıyı orijinaliyle karşılaştırmanızı öneririz.',
      },
      {
        q: 'Ne kadar uzun metin girebilirim?',
        a: 'Birkaç sayfalık metinler sorunsuz işlenir. Çok uzun içerikleri bölümler halinde göndermek daha iyi sonuç verir.',
      },
    ],
  },
  {
    slug: 'ai-hashtag-generator',
    name: 'AI Hashtag Üretici',
    category: 'ai',
    description: 'İçeriğinize uygun, erişimi artıran hashtag setleri oluşturun.',
    icon: 'Hash',
    keywords: ['hashtag generator', 'etiket üretici', 'instagram hashtag', 'tiktok etiket'],
    popularity: 79,
    added: '2025-03-08',
    badges: ['new'],
    live: true,
    about:
      'AI Hashtag Üretici, popüler, orta ve niş hacimli etiketleri dengeleyen setler üretir. Yalnızca yüksek hacimli etiketler kullanmak içeriğin kaybolmasına yol açtığı için bu denge erişim açısından belirleyicidir.',
    useCases: [
      'Yeni bir hesapla niş etiketler üzerinden görünürlük kazanmak',
      'Kampanya gönderileri için hazır etiket seti oluşturmak',
      'Farklı platformlara uygun etiket stratejisi kurmak',
    ],
    faq: [
      {
        q: 'Etiketlerin gerçek hacmini ölçüyor mu?',
        a: 'Hayır. Araç canlı platform verisine bağlanmaz; konuya uygunluğa ve yaygın kullanım kalıplarına göre öneri üretir. Kritik kampanyalarda platformun kendi arama sonuçlarından doğrulayın.',
      },
      {
        q: 'Kaç hashtag kullanmalıyım?',
        a: 'Instagram’da 10-20, LinkedIn’de 3-5, X’te 1-2 etiket genellikle en iyi sonucu verir.',
      },
    ],
  },
  {
    slug: 'ai-title-generator',
    name: 'AI Başlık Üretici',
    category: 'ai',
    description: 'Tıklanma oranı yüksek başlık alternatifleri üretin.',
    icon: 'Heading1',
    keywords: ['başlık üretici', 'title generator', 'seo başlık', 'youtube başlık'],
    popularity: 82,
    added: '2025-03-08',
    badges: ['new'],
    live: true,
    about:
      'AI Başlık Üretici, merak uyandıran ama abartıya kaçmayan 10 başlık alternatifi üretir. Her başlığın karakter sayısını gösterir ve SEO için kritik olan 60 karakter sınırını aşanları işaretler.',
    useCases: [
      'Blog yazısı için A/B testine uygun başlık havuzu oluşturmak',
      'YouTube videosunun tıklanma oranını artıracak alternatifler denemek',
      'E-posta kampanyası konu satırlarını çeşitlendirmek',
    ],
    faq: [
      {
        q: 'Neden 60 karakter sınırı?',
        a: 'Google arama sonuçlarında başlıkların yaklaşık 60 karakterden sonrası kesilir. Daha uzun başlıklar kullanılabilir ama önemli kelimeler başa alınmalıdır.',
      },
      {
        q: 'Clickbait üretiyor mu?',
        a: 'Hayır. Araç merak uyandıran ama içeriğin karşılayabileceği başlıklar üretecek şekilde ayarlandı; boş vaatlerden kaçınır.',
      },
    ],
  },
  // ─────────────────────────────── SEO ───────────────────────────────
  {
    slug: 'meta-tag-generator',
    name: 'Meta Etiket Üretici',
    category: 'seo',
    description:
      'Title, description, robots ve sosyal medya meta etiketlerini hazır alın.',
    icon: 'Tags',
    keywords: ['meta tag generator', 'meta etiket', 'seo etiket'],
    popularity: 89,
    added: '2025-01-28',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'schema-generator',
    name: 'Schema Üretici',
    category: 'seo',
    description:
      'Article, FAQ, Product ve LocalBusiness için JSON-LD schema kodu üretin.',
    icon: 'Braces',
    keywords: ['schema generator', 'json-ld', 'yapısal veri'],
    popularity: 76,
    added: '2025-01-28',
    live: true,
  },
  {
    slug: 'opengraph-generator',
    name: 'OpenGraph Üretici',
    category: 'seo',
    description:
      'Bağlantılarınızın sosyal medyada doğru görünmesi için OG etiketleri üretin.',
    icon: 'Share2',
    keywords: ['opengraph', 'og tag', 'sosyal medya önizleme'],
    popularity: 73,
    added: '2025-01-30',
    live: true,
  },
  {
    slug: 'keyword-density-checker',
    name: 'Kelime Yoğunluğu Analizi',
    category: 'seo',
    description:
      'Metninizdeki anahtar kelime yoğunluğunu ve tekrar oranlarını ölçün.',
    icon: 'BarChart3',
    keywords: ['keyword density', 'kelime yoğunluğu', 'içerik analizi'],
    popularity: 71,
    added: '2025-01-30',
    live: true,
  },
  {
    slug: 'robots-txt-generator',
    name: 'Robots.txt Üretici',
    category: 'seo',
    description:
      'Arama motoru botları için doğru kurallara sahip robots.txt hazırlayın.',
    icon: 'Bot',
    keywords: ['robots.txt', 'robots generator', 'tarama kuralı'],
    popularity: 68,
    added: '2025-02-01',
    live: true,
  },
  {
    slug: 'sitemap-generator',
    name: 'Sitemap Üretici',
    category: 'seo',
    description: 'URL listenizden geçerli bir XML sitemap dosyası oluşturun.',
    icon: 'Network',
    keywords: ['sitemap generator', 'site haritası', 'xml sitemap'],
    popularity: 75,
    added: '2025-02-01',
    live: true,
  },
  {
    slug: 'slug-generator',
    name: 'Slug Üretici',
    category: 'seo',
    description:
      'Türkçe karakterleri düzelterek SEO dostu URL slug’ları oluşturun.',
    icon: 'Link2',
    keywords: ['slug generator', 'url oluştur', 'seo url'],
    popularity: 77,
    added: '2025-02-03',
    live: true,
  },
  {
    slug: 'canonical-checker',
    name: 'Canonical Kontrol',
    category: 'seo',
    description: 'Sayfalarınızdaki canonical etiketlerini doğrulayın.',
    icon: 'CheckCheck',
    keywords: ['canonical', 'canonical tag', 'seo kontrol', 'yinelenen içerik', 'noindex kontrol'],
    popularity: 58,
    added: '2025-02-03',
    live: true,
    about:
      'Canonical Kontrol, girdiğiniz sayfayı sunucu tarafında çekip canonical etiketini analiz eder: etiket var mı, kendine mi işaret ediyor, birden fazla mı tanımlanmış, HTTPS mi, sayfa noindex mi. Yönlendirmeleri de takip eder ve son adresi gösterir.',
    useCases: [
      'Yinelenen içerik sorununun kaynağını bulmak',
      'Yeni yayına alınan sayfaların indekslenmeye hazır olduğunu doğrulamak',
      'Site taşıma sonrasında canonical zincirlerini kontrol etmek',
    ],
    faq: [
      {
        q: 'Canonical etiketi kendine mi işaret etmeli?',
        a: 'Çoğu durumda evet. Kendine işaret eden (self-referencing) canonical, arama motorlarına “bu sayfanın asıl adresi budur” der ve parametreli URL’lerden doğan yinelenme sorunlarını önler.',
      },
      {
        q: 'Neden birden fazla canonical sorun yaratır?',
        a: 'Google birden fazla canonical gördüğünde hepsini yok sayar ve kendi kararını verir. Sayfada yalnızca bir canonical etiketi bulunmalıdır.',
      },
      {
        q: 'JavaScript ile eklenen canonical görünüyor mu?',
        a: 'Hayır. Araç sunucudan gelen ham HTML’i inceler. Canonical etiketiniz yalnızca istemci tarafında ekleniyorsa burada görünmez — bu zaten SEO açısından önerilmeyen bir yaklaşımdır.',
      },
    ],
  },

  // ───────────────────────────── DEVELOPER ───────────────────────────
  {
    slug: 'json-formatter',
    name: 'JSON Formatlayıcı',
    category: 'developer',
    description:
      'Karmaşık JSON verisini okunabilir biçimde düzenleyin veya tek satıra sıkıştırın.',
    icon: 'Braces',
    keywords: ['json formatter', 'json beautify', 'json düzenle'],
    popularity: 99,
    added: '2025-01-05',
    badges: ['popular', 'trending'],
    live: true,
    about:
      'JSON Formatlayıcı, API yanıtlarını ve yapılandırma dosyalarını anında girintileyip renklendirir. Hatalı bir JSON girdiğinizde sorunun tam olarak hangi karakterde olduğunu gösterir.',
    useCases: [
      'API yanıtlarını hata ayıklarken okunabilir hale getirmek',
      'Yapılandırma dosyalarını commit öncesi biçimlendirmek',
      'Üretim ortamı için JSON’u minify ederek boyut kazanmak',
    ],
  },
  {
    slug: 'json-validator',
    name: 'JSON Doğrulayıcı',
    category: 'developer',
    description:
      'JSON verinizin geçerliliğini kontrol edin, hatanın satırını görün.',
    icon: 'ShieldCheck',
    keywords: ['json validator', 'json doğrula', 'json hata'],
    popularity: 84,
    added: '2025-01-05',
    live: true,
  },
  {
    slug: 'xml-formatter',
    name: 'XML Formatlayıcı',
    category: 'developer',
    description: 'XML dosyalarınızı girintili ve okunabilir hale getirin.',
    icon: 'FileCode2',
    keywords: ['xml formatter', 'xml düzenle', 'xml beautify'],
    popularity: 67,
    added: '2025-01-07',
    live: true,
  },
  {
    slug: 'html-formatter',
    name: 'HTML Formatlayıcı',
    category: 'developer',
    description: 'Dağınık HTML kodunu düzgün girintili yapıya kavuşturun.',
    icon: 'Code',
    keywords: ['html formatter', 'html beautify', 'html düzenle'],
    popularity: 72,
    added: '2025-01-07',
    live: true,
  },
  {
    slug: 'css-minifier',
    name: 'CSS Küçültücü',
    category: 'developer',
    description: 'CSS dosyanızdaki boşluk ve yorumları temizleyip boyutu düşürün.',
    icon: 'Palette',
    keywords: ['css minifier', 'css küçült', 'css sıkıştır'],
    popularity: 70,
    added: '2025-01-09',
    live: true,
  },
  {
    slug: 'javascript-minifier',
    name: 'JavaScript Küçültücü',
    category: 'developer',
    description: 'JS kodunuzu güvenli şekilde sıkıştırarak yükleme süresini azaltın.',
    icon: 'FileCode',
    keywords: ['js minifier', 'javascript sıkıştır', 'minify js'],
    popularity: 74,
    added: '2025-01-09',
    live: true,
  },
  {
    slug: 'sql-formatter',
    name: 'SQL Formatlayıcı',
    category: 'developer',
    description: 'Uzun SQL sorgularını standart girintilerle okunabilir yapın.',
    icon: 'Database',
    keywords: ['sql formatter', 'sql düzenle', 'query beautify'],
    popularity: 76,
    added: '2025-01-11',
    live: true,
  },
  {
    slug: 'regex-tester',
    name: 'Regex Test Aracı',
    category: 'developer',
    description:
      'Düzenli ifadelerinizi canlı olarak test edin, eşleşmeleri anında görün.',
    icon: 'Regex',
    keywords: ['regex tester', 'düzenli ifade', 'regex test'],
    popularity: 85,
    added: '2025-01-11',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'base64-encode-decode',
    name: 'Base64 Encode / Decode',
    category: 'developer',
    description: 'Metinlerinizi Base64 formatına çevirin veya geri çözün.',
    icon: 'Binary',
    keywords: ['base64', 'encode', 'decode', 'base64 çevir'],
    popularity: 90,
    added: '2025-01-13',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'uuid-generator',
    name: 'UUID Üretici',
    category: 'developer',
    description: 'Kriptografik olarak güvenli UUID v4 değerleri toplu üretin.',
    icon: 'Fingerprint',
    keywords: ['uuid generator', 'guid', 'benzersiz kimlik'],
    popularity: 81,
    added: '2025-01-13',
    live: true,
  },
  {
    slug: 'hash-generator',
    name: 'Hash Üretici',
    category: 'developer',
    description: 'Metinlerinizin SHA-1, SHA-256 ve SHA-512 özetlerini hesaplayın.',
    icon: 'KeyRound',
    keywords: ['hash generator', 'sha256', 'md5', 'özet'],
    popularity: 78,
    added: '2025-01-15',
    live: true,
  },
  {
    slug: 'jwt-decoder',
    name: 'JWT Çözücü',
    category: 'developer',
    description:
      'JWT token’larının header ve payload içeriğini güvenle inceleyin.',
    icon: 'ScanLine',
    keywords: ['jwt decoder', 'token çöz', 'jwt parse'],
    popularity: 83,
    added: '2025-01-15',
    live: true,
  },
  {
    slug: 'markdown-editor',
    name: 'Markdown Editör',
    category: 'developer',
    description: 'Markdown yazarken canlı HTML önizlemesi görün.',
    icon: 'FileText',
    keywords: ['markdown editor', 'md önizleme', 'markdown html'],
    popularity: 79,
    added: '2025-01-17',
    live: true,
  },
  {
    slug: 'cron-generator',
    name: 'Cron İfade Üretici',
    category: 'developer',
    description:
      'Zamanlanmış görevleriniz için cron ifadesi oluşturun ve okunur açıklamasını görün.',
    icon: 'Timer',
    keywords: ['cron generator', 'cron expression', 'zamanlanmış görev'],
    popularity: 66,
    added: '2025-01-17',
    live: true,
  },

  // ────────────────────────────── UTILITY ────────────────────────────
  {
    slug: 'qr-code-generator',
    name: 'QR Kod Üretici',
    category: 'utility',
    description:
      'Bağlantı, metin veya Wi-Fi bilgisinden yüksek kaliteli QR kod oluşturun.',
    icon: 'QrCode',
    keywords: ['qr kod', 'qr code generator', 'karekod'],
    popularity: 97,
    added: '2025-01-06',
    badges: ['popular', 'trending'],
    live: true,
    about:
      'QR Kod Üretici; renk, boyut ve hata düzeltme seviyesini özelleştirebildiğiniz, baskıya uygun çözünürlükte PNG çıktısı veren bir araçtır.',
    useCases: [
      'Menü, katalog veya kampanya sayfasını fiziksel materyale bağlamak',
      'Etkinlik davetiyelerine hızlı erişim linki eklemek',
      'Wi-Fi bilgisini misafirlerle güvenle paylaşmak',
    ],
  },
  {
    slug: 'qr-scanner',
    name: 'QR Okuyucu',
    category: 'utility',
    description: 'Kameranızla veya yüklediğiniz görselden QR kodu okuyun.',
    icon: 'ScanQrCode',
    keywords: ['qr okuyucu', 'qr scanner', 'karekod oku', 'qr kod tarama', 'barkod okuma'],
    popularity: 73,
    added: '2025-02-08',
    live: true,
    about:
      'QR Okuyucu, cihazınızın kamerasıyla canlı tarama yapar veya yüklediğiniz bir ekran görüntüsünden QR kodu çözer. Uygulama indirmenize gerek yoktur ve okuma tamamen tarayıcınızda gerçekleşir — görsel hiçbir yere yüklenmez.',
    useCases: [
      'Masaüstünde gelen bir QR kodu telefon kullanmadan okumak',
      'Ekran görüntüsündeki karekodun hangi adrese gittiğini açmadan görmek',
      'Etkinlik biletindeki kodun içeriğini doğrulamak',
    ],
    faq: [
      {
        q: 'Kamera izni vermek zorunda mıyım?',
        a: 'Hayır. Kamera kullanmak istemezseniz QR kodu içeren bir görsel yükleyerek de okuyabilirsiniz.',
      },
      {
        q: 'Okunan bağlantı güvenli mi?',
        a: 'Araç yalnızca kodun içeriğini gösterir, otomatik yönlendirme yapmaz. Bağlantıyı açmadan önce adresi kontrol edebilirsiniz — bu, kötü amaçlı QR kodlarına karşı iyi bir alışkanlıktır.',
      },
      {
        q: 'Barkod da okuyor mu?',
        a: 'Hayır, yalnızca QR (karekod) formatı desteklenir.',
      },
    ],
  },
  {
    slug: 'password-generator',
    name: 'Parola Üretici',
    category: 'utility',
    description:
      'Kırılması zor, rastgele ve güçlü parolalar üretin; gücünü anında görün.',
    icon: 'KeySquare',
    keywords: ['parola üretici', 'password generator', 'şifre oluştur'],
    popularity: 94,
    added: '2025-01-06',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Üretici',
    category: 'utility',
    description: 'Tasarımlarınız için paragraf, cümle veya kelime bazlı dolgu metni üretin.',
    icon: 'Type',
    keywords: ['lorem ipsum', 'dolgu metni', 'placeholder text'],
    popularity: 80,
    added: '2025-01-08',
    live: true,
  },
  {
    slug: 'random-number-generator',
    name: 'Rastgele Sayı Üretici',
    category: 'utility',
    description: 'Belirlediğiniz aralıkta tekrarsız rastgele sayılar üretin.',
    icon: 'Dices',
    keywords: ['rastgele sayı', 'random number', 'çekiliş'],
    popularity: 72,
    added: '2025-01-08',
    live: true,
  },
  {
    slug: 'random-name-generator',
    name: 'Rastgele İsim Üretici',
    category: 'utility',
    description: 'Karakter, marka veya kullanıcı adı fikirleri için isimler üretin.',
    icon: 'UserRound',
    keywords: ['isim üretici', 'random name', 'kullanıcı adı'],
    popularity: 63,
    added: '2025-02-14',
    live: true,
  },
  {
    slug: 'age-calculator',
    name: 'Yaş Hesaplama',
    category: 'utility',
    description: 'Doğum tarihinden yaşınızı yıl, ay ve gün olarak hesaplayın.',
    icon: 'CalendarDays',
    keywords: ['yaş hesaplama', 'age calculator', 'kaç yaşındayım'],
    popularity: 86,
    added: '2025-01-19',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'bmi-calculator',
    name: 'Vücut Kitle İndeksi',
    category: 'utility',
    description: 'Boy ve kilonuzdan BMI değerinizi ve sağlık aralığınızı görün.',
    icon: 'HeartPulse',
    keywords: ['bmi', 'vücut kitle indeksi', 'kilo hesaplama'],
    popularity: 82,
    added: '2025-01-19',
    live: true,
  },
  {
    slug: 'unit-converter',
    name: 'Birim Dönüştürücü',
    category: 'utility',
    description:
      'Uzunluk, ağırlık, sıcaklık, alan ve veri birimlerini anında dönüştürün.',
    icon: 'ArrowLeftRight',
    keywords: ['birim çevirici', 'unit converter', 'ölçü dönüştürme'],
    popularity: 88,
    added: '2025-01-21',
    badges: ['popular'],
    live: true,
  },
  {
    slug: 'currency-converter',
    name: 'Döviz Çevirici',
    category: 'utility',
    description: 'Güncel kurlarla para birimleri arasında dönüşüm yapın.',
    icon: 'Banknote',
    keywords: ['döviz çevirici', 'currency converter', 'kur hesaplama', 'dolar tl', 'euro tl'],
    popularity: 91,
    added: '2025-02-16',
    badges: ['trending'],
    live: true,
    about:
      'Döviz Çevirici, 12 para birimi arasında Avrupa Merkez Bankası referans kurlarıyla dönüşüm yapar. Kurlar iş günlerinde günde bir kez güncellenir ve sorgu doğrudan tarayıcınızdan yapılır.',
    useCases: [
      'Yurt dışı alışverişinde fiyatı TL karşılığıyla görmek',
      'Yabancı müşteriye kesilecek faturayı hesaplamak',
      'Seyahat bütçesini planlamak',
    ],
    faq: [
      {
        q: 'Kurlar anlık mı?',
        a: 'Hayır. Avrupa Merkez Bankası referans kurları kullanılır ve iş günlerinde günde bir kez yayınlanır. Anlık piyasa kuru için bankanızın ekranına bakın.',
      },
      {
        q: 'Neden bankamın verdiği kurdan farklı?',
        a: 'Bankalar alış ve satış arasında bir fark (spread) ve komisyon uygular. Referans kur, gerçek işlem maliyetinizi değil piyasanın orta noktasını gösterir.',
      },
      {
        q: 'Hafta sonu kurlar güncelleniyor mu?',
        a: 'Hayır. Hafta sonu ve resmî tatillerde son iş gününün kurları gösterilir.',
      },
    ],
  },
  {
    slug: 'timezone-converter',
    name: 'Saat Dilimi Çevirici',
    category: 'utility',
    description: 'Farklı şehirlerdeki yerel saatleri karşılaştırın.',
    icon: 'Clock',
    keywords: ['saat dilimi', 'timezone converter', 'dünya saati'],
    popularity: 70,
    added: '2025-02-16',
    live: true,
  },
  {
    slug: 'color-picker',
    name: 'Renk Seçici',
    category: 'utility',
    description: 'HEX, RGB ve HSL değerleri arasında geçiş yapın, tonları kopyalayın.',
    icon: 'Pipette',
    keywords: ['renk seçici', 'color picker', 'hex rgb'],
    popularity: 84,
    added: '2025-01-23',
    live: true,
  },
  {
    slug: 'gradient-generator',
    name: 'Gradient Üretici',
    category: 'utility',
    description: 'Görsel olarak gradient tasarlayın ve CSS kodunu kopyalayın.',
    icon: 'Blend',
    keywords: ['gradient generator', 'css gradient', 'renk geçişi'],
    popularity: 77,
    added: '2025-01-23',
    live: true,
  },
  {
    slug: 'palette-generator',
    name: 'Palet Üretici',
    category: 'utility',
    description: 'Bir ana renkten uyumlu renk paletleri türetin.',
    icon: 'SwatchBook',
    keywords: ['renk paleti', 'palette generator', 'color palette'],
    popularity: 79,
    added: '2025-01-25',
    live: true,
  },
  {
    slug: 'countdown-timer',
    name: 'Geri Sayım Sayacı',
    category: 'utility',
    description: 'Belirlediğiniz tarihe kalan süreyi canlı olarak takip edin.',
    icon: 'TimerReset',
    keywords: ['geri sayım', 'countdown timer', 'sayaç'],
    popularity: 68,
    added: '2025-02-18',
    live: true,
  },
  {
    slug: 'stopwatch',
    name: 'Kronometre',
    category: 'utility',
    description: 'Tur kaydı destekli, milisaniye hassasiyetinde kronometre.',
    icon: 'Watch',
    keywords: ['kronometre', 'stopwatch', 'süre tutma'],
    popularity: 65,
    added: '2025-02-18',
    live: true,
  },

  // ────────────────────────────── WEBSITE ────────────────────────────
  {
    slug: 'whois-lookup',
    name: 'WHOIS Sorgulama',
    category: 'website',
    description: 'Alan adının sahibi, kayıt ve bitiş tarihlerini sorgulayın.',
    icon: 'Search',
    keywords: ['whois', 'alan adı sorgulama', 'domain bilgisi', 'domain müsait mi', 'alan adı bitiş tarihi'],
    popularity: 80,
    added: '2025-02-20',
    live: true,
    about:
      'WHOIS Sorgulama, bir alan adının kayıt firmasını, kayıt ve bitiş tarihlerini, ad sunucularını ve durum kodlarını gösterir. Sorgu doğrudan yetkili WHOIS sunucularına yapılır; ince kayıt tutan uzantılarda (.com, .net) kayıt firmasının detaylı kaydına da otomatik olarak geçilir.',
    useCases: [
      'Almak istediğiniz alan adının müsait olup olmadığını kontrol etmek',
      'Kendi alan adınızın yenilenme tarihini takip etmek',
      'Bir sitenin hangi kayıt firmasında ve ne zamandır kayıtlı olduğunu görmek',
    ],
    faq: [
      {
        q: 'Neden sahip bilgileri gizli görünüyor?',
        a: 'GDPR ve benzeri gizlilik düzenlemeleri gereği çoğu kayıt firması kişisel iletişim bilgilerini maskeler. Kayıt tarihleri, durum kodları ve ad sunucuları ise genellikle açıktır.',
      },
      {
        q: 'Hangi uzantılar destekleniyor?',
        a: '.com, .net, .org, .io, .dev, .app, .co, .tr, .info, .biz, .me ve .xyz uzantıları için WHOIS sunucusu tanımlıdır. Diğer uzantılarda araç sizi bilgilendirir.',
      },
      {
        q: 'Kayıtlı görünmüyorsa hemen alabilir miyim?',
        a: 'Genellikle evet, ancak WHOIS kaydı bazı durumlarda gecikmeli güncellenir. Kesin sonuç için bir kayıt firmasının arama ekranından doğrulayın.',
      },
    ],
  },
  {
    slug: 'dns-lookup',
    name: 'DNS Sorgulama',
    category: 'website',
    description: 'A, AAAA, MX, TXT ve NS kayıtlarını tek ekranda görün.',
    icon: 'Server',
    keywords: ['dns lookup', 'dns kaydı', 'mx kayıt', 'txt kayıt', 'nameserver sorgulama'],
    popularity: 78,
    added: '2025-02-20',
    live: true,
    about:
      'DNS Sorgulama, bir alan adının A, AAAA, CNAME, MX, NS, TXT, SOA ve CAA kayıtlarını TTL değerleriyle birlikte listeler. Sorgu doğrudan tarayıcınızdan Cloudflare’in genel çözümleyicisine (1.1.1.1) gider; sunucularımızda kayıt tutulmaz.',
    useCases: [
      'Alan adı yönlendirmesinin doğru IP’ye gittiğini doğrulamak',
      'E-posta teslim sorunlarında MX ve SPF kayıtlarını kontrol etmek',
      'Domain doğrulaması için eklenen TXT kaydının yayılıp yayılmadığını görmek',
    ],
    faq: [
      {
        q: 'Değişiklik yaptım ama görünmüyor, neden?',
        a: 'DNS değişiklikleri TTL süresi kadar önbellekte kalır. Bu süre genellikle 5 dakika ile 24 saat arasındadır; kayıt satırındaki TTL değeri ne kadar beklemeniz gerektiğini gösterir.',
      },
      {
        q: 'SPF kaydımı nasıl kontrol ederim?',
        a: 'Kayıt türü olarak TXT seçin. SPF kaydı “v=spf1” ile başlayan satırdır.',
      },
      {
        q: 'Sorgular kaydediliyor mu?',
        a: 'Hayır. İstek doğrudan tarayıcınızdan Cloudflare DNS’e gider, bizim sunucularımızdan geçmez.',
      },
    ],
  },
  {
    slug: 'ip-lookup',
    name: 'IP Sorgulama',
    category: 'website',
    description: 'IP adresinin konum, ISP ve ağ bilgilerini öğrenin.',
    icon: 'MapPin',
    keywords: ['ip sorgulama', 'ip lookup', 'ip konum', 'ip adresi öğrenme', 'proxy tespiti'],
    popularity: 85,
    added: '2025-02-22',
    badges: ['popular'],
    live: true,
    about:
      'IP Sorgulama, bir IP adresinin veya alan adının kayıtlı olduğu ülke, şehir, servis sağlayıcı, kuruluş ve AS numarası bilgilerini gösterir. Ayrıca adresin veri merkezi, proxy/VPN veya mobil ağa ait olup olmadığını işaretler.',
    useCases: [
      'Sunucu günlüklerindeki şüpheli bir IP’nin nereden geldiğini anlamak',
      'Bir sitenin hangi hosting sağlayıcısında barındığını görmek',
      'Ziyaretçi trafiğinin bot mu gerçek kullanıcı mı olduğuna dair ipucu almak',
    ],
    faq: [
      {
        q: 'Konum bilgisi ne kadar doğru?',
        a: 'Ülke düzeyinde genellikle doğrudur; şehir düzeyinde yanılma payı yüksektir. IP konumu, adresin kayıtlı olduğu bölgeyi gösterir, kullanıcının fiziksel adresini değil.',
      },
      {
        q: 'Birinin adresini bulabilir miyim?',
        a: 'Hayır. IP sorgusu kişisel adres, kimlik veya iletişim bilgisi vermez; yalnızca ağ operatörüne ait genel bilgileri gösterir.',
      },
      {
        q: 'Kendi IP’mi nasıl öğrenirim?',
        a: 'Alan adı yerine boş bırakamazsınız; kendi adresinizi öğrenmek için önce bir “IP adresim” servisinden IP’nizi alıp buraya girebilirsiniz.',
      },
    ],
  },
  {
    slug: 'ssl-checker',
    name: 'SSL Kontrol',
    category: 'website',
    description: 'Sertifikanın geçerliliğini ve bitiş tarihini kontrol edin.',
    icon: 'ShieldCheck',
    keywords: ['ssl checker', 'sertifika kontrol', 'https', 'ssl bitiş tarihi', 'tls sürümü'],
    popularity: 74,
    added: '2025-02-22',
    live: true,
    about:
      'SSL Kontrol, sitenizin 443 portuna bağlanarak sertifikanın kime ait olduğunu, hangi kurum tarafından verildiğini, ne zaman dolacağını ve zincirin doğrulanıp doğrulanmadığını gösterir. Sertifikanın kapsadığı tüm alan adlarını ve kullanılan TLS sürümünü de listeler.',
    useCases: [
      'Sertifikanın yenilenme tarihini takip edip kesinti yaşamamak',
      'Alt alan adının sertifika kapsamında olduğunu doğrulamak',
      '“Bağlantınız gizli değil” uyarısının kaynağını bulmak',
    ],
    faq: [
      {
        q: 'Sertifikam geçerli ama zincir doğrulanamadı, ne demek?',
        a: 'Sunucunuz ara sertifikaları (intermediate) göndermiyor olabilir. Tarayıcılar bazen bunu telafi eder ama mobil uygulamalar ve API istemcileri hata verir — sunucu yapılandırmanıza tam zinciri ekleyin.',
      },
      {
        q: 'Ne zaman yenilemeliyim?',
        a: 'Bitiş tarihinden en az 15 gün önce. Let’s Encrypt sertifikaları 90 günlüktür ve genellikle otomatik yenilenir; otomasyonun çalıştığını bu araçla doğrulayabilirsiniz.',
      },
      {
        q: 'Süresi dolmuş sertifika ne olur?',
        a: 'Ziyaretçiler tam sayfa güvenlik uyarısı görür ve çoğu siteyi terk eder. Arama motorları da bu durumu olumsuz değerlendirir.',
      },
    ],
  },
  {
    slug: 'ping-test',
    name: 'Ping Testi',
    category: 'website',
    description: 'Sunucuya erişim gecikmesini ölçün.',
    icon: 'Activity',
    keywords: ['ping', 'gecikme testi', 'latency', 'sunucu yanıt süresi', 'bağlantı testi'],
    popularity: 69,
    added: '2025-02-24',
    live: true,
    about:
      'Ping Testi, hedef sunucuya dört ayrı TCP bağlantısı kurarak en düşük, en yüksek ve ortalama gecikmeyi ölçer. Klasik ICMP ping’in aksine TCP kullanıldığı için ICMP’yi engelleyen güvenlik duvarlarının ardındaki sunucular da ölçülebilir.',
    useCases: [
      'Sunucunuzun tepki süresini farklı zamanlarda karşılaştırmak',
      'Hosting sağlayıcısı değiştirmeden önce gecikmeyi ölçmek',
      'Bir servisin yavaşlama şikâyetlerini somut sayılarla doğrulamak',
    ],
    faq: [
      {
        q: 'Neden ICMP ping değil?',
        a: 'Tarayıcılar ham ICMP paketi gönderemez ve birçok sunucu ICMP’yi engeller. TCP el sıkışma süresi hem daha güvenilir ölçülür hem de gerçek uygulama gecikmesine daha yakındır.',
      },
      {
        q: 'Sonuç benim bağlantımı mı gösteriyor?',
        a: 'Hayır. Ölçüm sunucumuzun bulunduğu konumdan yapılır. Kendi bağlantınızı ölçmek için işletim sisteminizin ping komutunu kullanın.',
      },
      {
        q: 'İyi bir gecikme kaç ms?',
        a: 'Aynı ülkedeki sunucular için 50 ms altı çok iyi, 150 ms altı normaldir. 300 ms üzeri değerler kullanıcı deneyiminde hissedilir.',
      },
    ],
  },
  {
    slug: 'website-screenshot',
    name: 'Site Ekran Görüntüsü',
    category: 'website',
    description: 'Herhangi bir sayfanın masaüstü ve mobil görüntüsünü alın.',
    icon: 'Camera',
    keywords: ['website screenshot', 'ekran görüntüsü', 'site görseli', 'sayfa görüntüsü'],
    popularity: 76,
    added: '2025-02-24',
    live: true,
    about:
      'Site Ekran Görüntüsü, verdiğiniz adresin masaüstü (1440×900) veya mobil (390×844) görünümünü PNG olarak alır. Bu araç sunucu tarafında başsız tarayıcı gerektirir; kendi kurulumunuzda SCREENSHOT_API_URL ortam değişkenini tanımlayarak dilediğiniz sağlayıcıyı bağlayabilirsiniz.',
    useCases: [
      'Rakip sitelerin sayfa düzenini arşivlemek',
      'Bir sayfanın belirli bir tarihteki halini kanıt olarak saklamak',
      'Sunum ve raporlara site görselleri eklemek',
    ],
    faq: [
      {
        q: 'Araç neden yapılandırma istiyor?',
        a: 'Ekran görüntüsü almak, sayfayı gerçekten çalıştıran bir tarayıcı gerektirir. Bunu her ziyaretçi için ücretsiz sunmak mümkün olmadığından, kendi sağlayıcınızı bağlayabileceğiniz bir yapı tercih edildi.',
      },
      {
        q: 'Giriş gerektiren sayfaların görüntüsü alınır mı?',
        a: 'Hayır. Yalnızca herkese açık sayfalar görüntülenebilir; oturum açılması gereken sayfalarda giriş ekranı görünür.',
      },
    ],
  },
  {
    slug: 'website-status-checker',
    name: 'Site Durum Kontrol',
    category: 'website',
    description: 'Sitenin ayakta olup olmadığını ve yanıt süresini kontrol edin.',
    icon: 'Gauge',
    keywords: ['site durumu', 'uptime', 'website status', 'site açık mı', 'http durum kodu'],
    popularity: 81,
    added: '2025-02-26',
    live: true,
    about:
      'Site Durum Kontrol, adrese HTTPS (gerekirse HTTP) üzerinden istek göndererek HTTP durum kodunu, yanıt süresini, yönlendirme sonrası son adresi ve sunucu başlığını gösterir. “Sadece bende mi açılmıyor?” sorusunu saniyeler içinde yanıtlar.',
    useCases: [
      'Sitenin gerçekten kapalı mı yoksa sorunun sizde mi olduğunu anlamak',
      'Yayına alma sonrası sayfanın erişilebilir olduğunu doğrulamak',
      'Yönlendirme zincirinin doğru adrese ulaştığını kontrol etmek',
    ],
    faq: [
      {
        q: 'Hangi durum kodu ne anlama gelir?',
        a: '200 başarılı; 301/302 yönlendirme; 403 erişim engellendi; 404 sayfa yok; 500 ve üzeri sunucu hatası; 503 geçici olarak hizmet dışı.',
      },
      {
        q: 'Yanıt süresi neden benim gördüğümden farklı?',
        a: 'Ölçüm sunucumuzdan yapılır ve yalnızca ilk HTML yanıtını kapsar. Tarayıcınızdaki toplam yüklenme süresi görseller, betikler ve stil dosyalarını da içerdiği için daha uzundur.',
      },
      {
        q: 'Sürekli izleme yapıyor mu?',
        a: 'Hayır, bu araç anlık kontrol yapar. Kesintisiz izleme için düzenli aralıklarla kontrol eden bir uptime servisi gerekir.',
      },
    ],
  },
  {
    slug: 'port-checker',
    name: 'Port Kontrol',
    category: 'website',
    description: 'Belirtilen portun dışarıya açık olup olmadığını test edin.',
    icon: 'Plug',
    keywords: ['port checker', 'port tarama', 'açık port', 'port açık mı', 'firewall testi'],
    popularity: 62,
    added: '2025-02-26',
    live: true,
    about:
      'Port Kontrol, sunucunuzun belirtilen portuna internet üzerinden TCP bağlantısı kurmayı dener ve sonucu bağlantı süresiyle birlikte gösterir. Yaygın portlar (HTTP, HTTPS, SSH, FTP, SMTP, MySQL, PostgreSQL, RDP) tek tıkla seçilebilir.',
    useCases: [
      'Yeni açtığınız servisin dışarıdan erişilebildiğini doğrulamak',
      'Güvenlik duvarı kuralının beklendiği gibi çalıştığını test etmek',
      'Veritabanı portunun yanlışlıkla internete açık kalmadığını kontrol etmek',
    ],
    faq: [
      {
        q: '“Zaman aşımı” ile “bağlantı reddedildi” farkı nedir?',
        a: 'Bağlantı reddedildi, portun kapalı ama sunucuya ulaşıldığı anlamına gelir. Zaman aşımı ise trafiğin bir güvenlik duvarı tarafından sessizce düşürüldüğünü gösterir.',
      },
      {
        q: 'Toplu port taraması yapabilir miyim?',
        a: 'Hayır. Araç tek seferde tek port test eder; izinsiz toplu tarama amaçlı kullanımı desteklenmez.',
      },
      {
        q: 'Yerel ağımdaki cihazı test edebilir miyim?',
        a: 'Hayır. Yerel ve özel ağ adresleri güvenlik gereği engellenmiştir.',
      },
    ],
  },
  ...healthTools,
  ...businessTools,
];

export const toolMap = new Map(tools.map((t) => [t.slug, t]));

export function getTool(slug: string) {
  return toolMap.get(slug);
}

export function toolsByCategory(category: string) {
  return tools.filter((t) => t.category === category);
}

export const popularTools = [...tools]
  .sort((a, b) => b.popularity - a.popularity)
  .slice(0, 12);

export const trendingTools = tools.filter((t) => t.badges?.includes('trending'));

export const newestTools = [...tools]
  .sort((a, b) => (a.added < b.added ? 1 : -1))
  .slice(0, 8);

/** Same-category siblings, ranked by popularity. */
export function relatedTools(slug: string, limit = 6) {
  const tool = getTool(slug);
  if (!tool) return [];
  return tools
    .filter((t) => t.slug !== slug && t.category === tool.category)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/** Lightweight scoring search used by the command palette and /tools page. */
export function searchTools(query: string, limit = 30) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return tools
    .map((tool) => {
      const haystack = `${tool.name} ${tool.description} ${tool.keywords.join(' ')} ${tool.slug}`.toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (!haystack.includes(term)) return { tool, score: -1 };
        if (tool.name.toLowerCase().startsWith(term)) score += 6;
        else if (tool.name.toLowerCase().includes(term)) score += 4;
        if (tool.keywords.some((k) => k.toLowerCase().includes(term))) score += 2;
        score += 1;
      }
      return { tool, score: score + tool.popularity / 100 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.tool);
}

export const toolCount = tools.length;
export const liveToolCount = tools.filter((t) => t.live).length;
