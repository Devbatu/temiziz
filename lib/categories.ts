export type CategoryId =
  | 'pdf'
  | 'image'
  | 'seo'
  | 'developer'
  | 'utility'
  | 'website'
  | 'health'
  | 'business'
  | 'engineering';

export interface Category {
  id: CategoryId;
  slug: string;
  name: string;
  short: string;
  description: string;
  /** Tailwind gradient stops used across cards, headers and icons. */
  gradient: string;
  accent: string;
  icon: string;
  /**
   * Kategori sayfasının altına konan uzun tanıtım paragrafları. Kategori
   * sayfaları yalnızca araç kartlarından oluşunca çok ince kalıyor ve arama
   * motoru bunları "soft 404" veya zayıf içerik sayabiliyor. Her paragraf o
   * kategorinin ne işe yaradığını ve nasıl kullanıldığını anlatır.
   */
  intro?: string[];
}

export const categories: Category[] = [
  {
    id: 'pdf',
    slug: 'pdf',
    name: 'PDF Araçları',
    short: 'PDF',
    description:
      'PDF birleştirme, bölme, sıkıştırma, dönüştürme ve koruma işlemlerini tarayıcıdan saniyeler içinde yapın.',
    gradient: 'from-rose-500 to-orange-500',
    accent: '#f43f5e',
    icon: 'FileText',
    intro: [
      'PDF, belgeyi hangi cihazda açarsanız açın aynı görünmesi için tasarlanmış bir sayfa biçimidir; tam da bu yüzden düzenlemesi zordur. Buradaki araçlar, bir masaüstü programı kurmadan en sık ihtiyaç duyulan PDF işlemlerini tarayıcınızda yapmanızı sağlar: birleştirme, bölme, sıkıştırma, döndürme, görsele ve görselden dönüştürme, parola ile koruma ve kaldırma.',
      'Hepsinin ortak yanı, dosyanızın cihazınızdan hiç çıkmamasıdır. İşlem WebAssembly ile tarayıcının içinde çalışır; sözleşme, bordro, kimlik veya sağlık raporu gibi belgeleri bir sunucuya yüklemeden düzenleyebilirsiniz. Bu, hem gizlilik hem de KVKK sorumluluğu açısından belirleyici bir farktır.',
    ],
  },
  {
    id: 'image',
    slug: 'image',
    name: 'Görsel Araçları',
    short: 'Görsel',
    description:
      'Görsel sıkıştırma, boyutlandırma, format dönüştürme, kırpma ve düzenleme araçları.',
    gradient: 'from-violet-500 to-fuchsia-500',
    accent: '#8b5cf6',
    icon: 'Image',
    intro: [
      'Görsel araçları, bir fotoğrafı web’de yayınlamaya, e-postayla göndermeye veya pazaryerine yüklemeye hazır hale getirmenin tüm adımlarını kapsar: sıkıştırma, yeniden boyutlandırma, format dönüştürme, kırpma, filigran ekleme ve arka plan silme. Doğru araç çoğu zaman dosya boyutunu yarıya indirip görsel kaliteyi koruyabilir.',
      'Sık karşılaşılan bir hata, yüksek çözünürlüklü bir fotoğrafı olduğu gibi web sayfasına koymaktır; bu, sayfa hızını ve Core Web Vitals puanını doğrudan düşürür. Bu kategorideki araçlar tam da bu israfı önlemek için tasarlandı ve tümü görselinizi cihazınızdan çıkarmadan işler.',
    ],
  },
  {
    id: 'seo',
    slug: 'seo',
    name: 'SEO Araçları',
    short: 'SEO',
    description:
      'Meta etiket, schema, sitemap ve içerik analizi araçlarıyla sitenizi arama motorlarına hazırlayın.',
    gradient: 'from-emerald-500 to-teal-500',
    accent: '#10b981',
    icon: 'TrendingUp',
    intro: [
      'SEO araçları, sayfanızın arama motorlarında nasıl göründüğünü ve indekslendiğini kontrol etmenizi sağlar: meta etiketleri, Open Graph, yapısal veri (schema), site haritası, robots.txt ve kanonik denetimi. Bu unsurlar doğru kurulduğunda sıralama garantisi vermez ama yanlış kurulduğunda sıralamayı doğrudan engelleyebilir.',
      'Özellikle yeni sitelerde en sık yapılan hatalar burada toplanır: ana sayfayla aynı başlığı taşıyan sayfalar, 404 veren adresleri listeleyen site haritaları ve yanlış yazılmış robots.txt kuralları. Bu araçlar, sorunu yayına almadan önce görmenizi sağlar.',
    ],
  },
  {
    id: 'developer',
    slug: 'developer',
    name: 'Geliştirici',
    short: 'Kod',
    description:
      'JSON, XML, HTML, SQL biçimlendiriciler, minifier’lar, hash ve encode/decode araçları.',
    gradient: 'from-cyan-500 to-blue-500',
    accent: '#06b6d4',
    icon: 'Code2',
    intro: [
      'Geliştirici araçları, günlük yazılım işinde tekrar tekrar ihtiyaç duyulan biçimlendirme ve dönüştürme işlemlerini tek yerde toplar: JSON, XML, HTML, SQL biçimlendirme; CSS ve JavaScript küçültme; Base64, hash, UUID, JWT çözme ve düzenli ifade sınama. Hepsi tarayıcıda çalışır, hiçbir veri sunucuya gönderilmez.',
      'Bu ayrım önemlidir: API yanıtı, yapılandırma dosyası veya token gibi hassas veriyi çevrimiçi bir araca yapıştırdığınızda, o araç veriyi kendi sunucusuna gönderiyor olabilir. Buradaki araçlar veriyi cihazınızda işlediği için API anahtarı veya kişisel veri içeren içerikleri güvenle kullanabilirsiniz.',
    ],
  },
  {
    id: 'utility',
    slug: 'utility',
    name: 'Günlük Araçlar',
    short: 'Pratik',
    description:
      'QR kod, parola üreteci, hesap makineleri, renk araçları ve zamanlayıcılar.',
    gradient: 'from-amber-500 to-yellow-500',
    accent: '#f59e0b',
    icon: 'Wrench',
    intro: [
      'Günlük araçlar, belirli bir uzmanlık gerektirmeyen ama sık ihtiyaç duyulan pratik işleri kapsar: QR kod üretme, güçlü parola oluşturma, birim ve para birimi dönüştürme, renk seçme, geri sayım ve kronometre, yaş hesaplama ve rastgele veri üretme. Kurulum ve üyelik gerektirmez.',
      'Bu araçların çoğu tarayıcının kriptografik rastgelelik ve yüksek çözünürlüklü zamanlayıcı gibi yerleşik yeteneklerini kullanır; bu da örneğin üretilen parolanın gerçekten tahmin edilemez, ölçülen sürenin gerçekten hassas olması demektir.',
    ],
  },
  {
    id: 'health',
    slug: 'saglik',
    name: 'Sağlık Hesaplayıcıları',
    short: 'Sağlık',
    description:
      'Sağlık profesyonelleri için klinik skor ve hesaplama araçları: BKİ, eGFR, CHA₂DS₂-VASc, Wells, MELD, Child-Pugh, Glasgow, CURB-65 ve TIMI.',
    gradient: 'from-red-500 to-pink-600',
    accent: '#ef4444',
    icon: 'HeartPulse',
    intro: [
      'Sağlık hesaplayıcıları, sağlık profesyonellerinin klinik pratikte kullandığı yayımlanmış skorları ve formülleri bir araya getirir: BKİ, eGFR, CHA₂DS₂-VASc, Wells, MELD, Child-Pugh, Glasgow Koma Skalası, CURB-65 ve TIMI. Her araç, hesabın dayandığı kaynağı ve eşik değerlerini birlikte gösterir.',
      'Bu araçlar bir hesaplama yardımcısıdır; tanı koymaz, tedavi önermez ve klinik değerlendirmenin yerine geçmez. Girilen hiçbir hasta verisi cihazınızdan çıkmaz. İlaç dozu, prospektüs ve etkileşim hesabı bilinçli olarak yer almaz, çünkü bunlar sürekli güncellenen lisanslı veri tabanları gerektirir.',
    ],
  },
  {
    id: 'business',
    slug: 'meslek',
    name: 'Meslek Araçları',
    short: 'Meslek',
    description:
      'Muhasebeci, mali müşavir, avukat, öğretmen ve inşaatçılar için KDV, kâr marjı, kredi, tazminat, not ortalaması ve keşif hesaplayıcıları.',
    gradient: 'from-indigo-500 to-blue-600',
    accent: '#6366f1',
    icon: 'Briefcase',
    intro: [
      'Meslek araçları, muhasebeci, mali müşavir, avukat, öğretmen, öğrenci ve inşaatçıların sık tekrarladığı hesapları kapsar: KDV, kâr marjı, kredi taksiti, kıdem ve ihbar tazminatı, not ortalaması, inşaat demiri ağırlığı, beton keşfi ve gecikme faizi. Her hesap örnekle ve formülüyle açıklanır.',
      'Mevzuata bağlı katsayılar (kıdem tavanı, faiz oranları, KDV oranları) yıl içinde değiştiği için hiçbiri koda gömülü değildir; ekranda düzenlenebilir alan olarak durur, güncel değeri kendiniz girersiniz. Böylece araç, aylar sonra bile yanlış bir sabit yüzünden hatalı sonuç üretmez.',
    ],
  },
  {
    id: 'engineering',
    slug: 'muhendislik',
    name: 'Mühendislik Araçları',
    short: 'Mühendislik',
    description:
      'Elektrik ve genel mühendislik hesapları: Ohm yasası, üç fazlı güç, direnç renk kodu, kablo gerilim düşümü ve dBm dönüşümü.',
    gradient: 'from-amber-600 to-orange-700',
    accent: '#d97706',
    icon: 'Cpu',
    intro: [
      'Mühendislik araçları, elektrik ve elektronik alanında sık tekrarlanan hesapları tarayıcıda yapmanızı sağlar: Ohm yasası, üç fazlı güç, direnç renk kodu okuma, kablo gerilim düşümü ve dBm–watt dönüşümü. Her araç kullandığı formülü ve geçerlilik sınırını birlikte gösterir.',
      'Hesaplar dirençsel yük ve standart koşullar varsayar; kesin proje hesabı sıcaklık, döşeme biçimi, eş zamanlılık ve güç faktörü gibi etkenleri de içermeli ve yetkili bir mühendis tarafından onaylanmalıdır. Bu araçlar hızlı ön hesap ve doğrulama içindir.',
    ],
  },
  {
    id: 'website',
    slug: 'website',
    name: 'Site & Alan Adı',
    short: 'Web',
    description:
      'WHOIS, DNS, IP, SSL ve erişilebilirlik kontrolleriyle alan adlarını ve sunucuları analiz edin.',
    gradient: 'from-slate-500 to-zinc-600',
    accent: '#64748b',
    icon: 'Globe',
    intro: [
      'Site ve alan adı araçları, bir alan adının veya sunucunun teknik durumunu dışarıdan sorgulamanızı sağlar: WHOIS ile kayıt bilgisi, DNS kayıtları, IP konumu, SSL sertifikası geçerliliği, port ve erişilebilirlik denetimi. Bir site açılmadığında ya da e-posta gitmediğinde sorunun nerede olduğunu bu araçlarla bulabilirsiniz.',
      'Sorgular sunucumuz üzerinden gerçek zamanlı yapılır; örneğin SSL kontrolü sertifikanın kaç gün sonra dolacağını gösterir, DNS sorgusu panelde kaydettiğiniz bir değişikliğin dünyaya yayılıp yayılmadığını doğrular. Bunlar, teknik bir sorunu tahmin etmek yerine ölçmenizi sağlar.',
    ],
  },
];

export const categoryMap = new Map(categories.map((c) => [c.id, c]));

export function getCategory(id: string) {
  return categories.find((c) => c.id === id || c.slug === id);
}
