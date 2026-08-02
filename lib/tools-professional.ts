import type { Tool } from './tools';

/**
 * Meslek gruplarına yönelik araçlar: klinik skorlar ve meslek hesaplayıcıları.
 *
 * `tools.ts` içindeki ana dizinin sonuna eklenir. Ayrı dosyada durmasının
 * sebebi yalnızca dosya boyutu değil: bu araçların çoğu mevzuata veya klinik
 * kılavuzlara bağlıdır ve kılavuz güncellendiğinde tek bir yerde gözden
 * geçirilebilmeleri gerekir.
 */

const EKLENDI = '2026-08-02';

export const healthTools: Tool[] = [
  {
    slug: 'bmi-hesaplama',
    name: 'BKİ Hesaplama',
    category: 'health',
    description:
      'Boy ve kilodan vücut kitle indeksini hesaplayın; WHO sınıflamasına göre yorumunu ve boyunuza uygun kilo aralığını görün.',
    icon: 'Scale',
    keywords: ['bmi hesaplama', 'vücut kitle indeksi', 'bki hesapla', 'ideal kilo', 'body mass index'],
    popularity: 78,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Vücut kitle indeksi, kilonun boyun karesine bölünmesiyle bulunur ve yetişkinlerde kilo durumunu sınıflamak için Dünya Sağlık Örgütü’nün kullandığı ölçüttür. Bu araç sonucu WHO aralıklarına göre yorumlar ve aynı boy için normal kabul edilen kilo aralığını gösterir.',
    useCases: [
      'Rutin muayenede kilo durumunu hızla sınıflamak',
      'Diyet takibinde hedef kilo aralığını belirlemek',
      'Obezite sınıfını (I, II, III) saptamak',
    ],
    faq: [
      {
        q: 'BKİ kaç olmalı?',
        a: 'Dünya Sağlık Örgütü yetişkinlerde 18,5–24,9 kg/m² aralığını normal kabul eder. 25 üzeri fazla kilolu, 30 üzeri obezite olarak sınıflanır.',
      },
      {
        q: 'BKİ herkes için doğru sonuç verir mi?',
        a: 'Hayır. BKİ kas kütlesi ile yağ kütlesini ayırt etmez; sporcularda yüksek, kas kaybı olan yaşlılarda düşük çıkabilir. Çocuklarda yaşa göre persentil eğrileri kullanılmalıdır.',
      },
      {
        q: 'Verilerim kaydediliyor mu?',
        a: 'Hayır. Hesaplama tamamen tarayıcınızda yapılır; girdiğiniz hiçbir değer sunucuya gönderilmez.',
      },
    ],
  },
  {
    slug: 'egfr-hesaplama',
    name: 'eGFR Hesaplama (CKD-EPI 2021)',
    category: 'health',
    description:
      'Serum kreatinin, yaş ve cinsiyetten tahmini glomerüler filtrasyon hızını CKD-EPI 2021 formülüyle hesaplayın ve KBH evresini görün.',
    icon: 'Droplets',
    keywords: ['egfr hesaplama', 'gfr hesaplama', 'ckd epi', 'kreatinin klirensi', 'böbrek fonksiyonu'],
    popularity: 74,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Tahmini glomerüler filtrasyon hızı, böbrek fonksiyonunu değerlendirmenin standart yoludur. Bu araç ırk katsayısı içermeyen CKD-EPI 2021 denklemini kullanır; NKF-ASN Ortak Görev Gücü 2021’de ırk değişkeninin kaldırılmasını önermiştir. Sonuç KDIGO evrelemesine (G1–G5) göre yorumlanır.',
    useCases: [
      'Kronik böbrek hastalığı evresini belirlemek',
      'Böbrekten atılan ilaçlarda doz ayarlaması öncesi fonksiyonu değerlendirmek',
      'Kontrastlı görüntüleme öncesi risk değerlendirmesi yapmak',
    ],
    faq: [
      {
        q: 'Hangi formül kullanılıyor?',
        a: 'CKD-EPI 2021 kreatinin denklemi. Bu sürüm ırk katsayısı içermez ve güncel kılavuzların önerdiği formüldür.',
      },
      {
        q: 'µmol/L cinsinden kreatinin girebilir miyim?',
        a: 'Evet. Birim seçeneğinden µmol/L seçebilirsiniz; araç 88,4 katsayısıyla mg/dL’ye çevirir.',
      },
      {
        q: 'Çocuklarda kullanılabilir mi?',
        a: 'Hayır. CKD-EPI yalnızca 18 yaş ve üzeri için geçerlidir; çocuklarda Schwartz formülü kullanılır.',
      },
    ],
  },
  {
    slug: 'chads-vasc-hesaplama',
    name: 'CHA₂DS₂-VASc Skoru',
    category: 'health',
    description:
      'Atriyal fibrilasyonda inme riskini CHA₂DS₂-VASc skoruyla hesaplayın; yıllık risk tahminini ve antikoagülasyon eşiklerini görün.',
    icon: 'HeartPulse',
    keywords: ['cha2ds2-vasc', 'chads vasc hesaplama', 'atriyal fibrilasyon inme riski', 'antikoagülasyon'],
    popularity: 80,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'CHA₂DS₂-VASc, valvüler olmayan atriyal fibrilasyonda iskemik inme riskini öngören ve oral antikoagülasyon kararına yön veren skordur. Araç her maddenin ağırlığını ayrı sorar, toplam puanı hesaplar ve ESC kılavuzunun eşik değerleriyle birlikte yıllık inme riski tahminini gösterir.',
    useCases: [
      'AF hastasında antikoagülasyon endikasyonunu değerlendirmek',
      'Hastaya yıllık inme riskini sayısal olarak anlatmak',
      'Poliklinik notuna standart skor eklemek',
    ],
    faq: [
      {
        q: 'Kaç puandan itibaren antikoagülasyon önerilir?',
        a: 'ESC kılavuzu erkeklerde 2 ve üzeri, kadınlarda 3 ve üzeri puanda oral antikoagülasyon önerir. Kadın cinsiyeti tek başına puan kaynağıysa risk artırıcı sayılmaz.',
      },
      {
        q: 'Kanama riski de hesaplanıyor mu?',
        a: 'Hayır. Kanama riski için HAS-BLED gibi ayrı bir skor kullanılır; antikoagülasyon kararı iki skorun birlikte değerlendirilmesini gerektirir.',
      },
      {
        q: 'Yıllık risk oranları nereden geliyor?',
        a: 'Friberg ve arkadaşlarının Eur Heart J 2012’de yayımladığı İsveç kohortundan alınmıştır.',
      },
    ],
  },
  {
    slug: 'wells-pe-skoru',
    name: 'Wells Skoru — Pulmoner Emboli',
    category: 'health',
    description:
      'Pulmoner emboli klinik olasılığını Wells kriterleriyle hesaplayın; iki ve üç kademeli yorumu birlikte görün.',
    icon: 'Wind',
    keywords: ['wells skoru', 'pulmoner emboli', 'wells pe', 'pe olasılık skoru', 'd-dimer'],
    popularity: 70,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Wells skoru, pulmoner emboli ön test olasılığını belirleyerek D-dimer ve görüntüleme kararına yön verir. Araç hem geleneksel iki kademeli (olası / olası değil) hem de üç kademeli (düşük / orta / yüksek) yorumu aynı anda gösterir.',
    useCases: [
      'Acil serviste PE ön test olasılığını belirlemek',
      'D-dimer istemenin anlamlı olup olmadığına karar vermek',
      'BT pulmoner anjiyografi endikasyonunu değerlendirmek',
    ],
    faq: [
      {
        q: 'Skor kaç olursa PE olası kabul edilir?',
        a: 'Geleneksel iki kademeli yorumda 4 puanın üzeri “PE olası” kabul edilir. Üç kademeli yorumda 2 altı düşük, 2–6 orta, 6 üstü yüksek olasılıktır.',
      },
      {
        q: 'Yüksek olasılıkta D-dimer yeterli mi?',
        a: 'Hayır. Yüksek klinik olasılıkta negatif D-dimer PE’yi dışlamak için yeterli değildir; doğrudan görüntüleme önerilir.',
      },
      {
        q: 'DVT için ayrı skor var mı?',
        a: 'Evet. Derin ven trombozu için Wells DVT skoru kullanılır ve sitede ayrı bir araç olarak bulunur.',
      },
    ],
  },
  {
    slug: 'wells-dvt-skoru',
    name: 'Wells Skoru — Derin Ven Trombozu',
    category: 'health',
    description:
      'Derin ven trombozu klinik olasılığını Wells DVT kriterleriyle hesaplayın ve ultrasonografi kararına yön verin.',
    icon: 'Activity',
    keywords: ['wells dvt', 'derin ven trombozu', 'dvt skoru', 'bacak şişliği', 'tromboz riski'],
    popularity: 64,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Wells DVT skoru, alt ekstremite derin ven trombozu ön test olasılığını sınıflar. Alternatif tanının en az DVT kadar olası olması skoru iki puan düşürür; araç bu negatif ağırlığı da doğru uygular.',
    useCases: [
      'Bacak ağrısı ve şişliğiyle başvuran hastada DVT olasılığını sınıflamak',
      'D-dimer ile dışlamanın güvenli olup olmadığına karar vermek',
      'Kompresyon ultrasonografi endikasyonunu belirlemek',
    ],
    faq: [
      {
        q: 'Skor kaç olursa yüksek risk?',
        a: '3 ve üzeri yüksek, 1–2 orta, 0 ve altı düşük olasılık kabul edilir.',
      },
      {
        q: 'Alternatif tanı maddesi neden eksi puan?',
        a: 'Bacak şişliğini açıklayabilecek başka bir tanı en az DVT kadar olasıysa DVT olasılığı düşer. Bu madde skordan 2 puan düşürür.',
      },
      {
        q: 'Düşük olasılıkta ne yapılır?',
        a: 'Düşük olasılık ve negatif yüksek duyarlıklı D-dimer birlikteliğinde DVT büyük ölçüde dışlanabilir.',
      },
    ],
  },
  {
    slug: 'apgar-skoru',
    name: 'APGAR Skoru',
    category: 'health',
    description:
      'Yenidoğanın 1. ve 5. dakika APGAR skorunu beş parametre üzerinden hesaplayın ve yorumunu görün.',
    icon: 'Baby',
    keywords: ['apgar skoru', 'apgar hesaplama', 'yenidoğan değerlendirme', 'doğum skoru'],
    popularity: 62,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'APGAR skoru, yenidoğanın doğum sonrası genel durumunu görünüm, nabız, refleks, aktivite ve solunum üzerinden değerlendirir. Her parametre 0–2 puan alır; toplam 0–10 arasında değişir ve genellikle 1. ile 5. dakikada ayrı ayrı hesaplanır.',
    useCases: [
      'Doğum salonunda yenidoğanın durumunu standart biçimde kaydetmek',
      'Resüsitasyon ihtiyacını hızla belirlemek',
      'Doğum tutanağına skor işlemek',
    ],
    faq: [
      {
        q: 'APGAR kaç olmalı?',
        a: '7–10 arası normal kabul edilir. 4–6 orta derecede düşük, 0–3 ciddi düzeyde düşüktür ve acil müdahale gerektirir.',
      },
      {
        q: 'Skor ne zaman ölçülür?',
        a: 'Standart olarak doğumun 1. ve 5. dakikasında. 5. dakika skoru 7’nin altındaysa 20. dakikaya kadar her 5 dakikada bir tekrarlanır.',
      },
      {
        q: 'APGAR uzun vadeli sonucu öngörür mü?',
        a: 'Tek başına öngörmez. Düşük 1. dakika skoru sıktır ve çoğu bebek hızla düzelir; nörolojik sonuç tahmininde tek başına kullanılmamalıdır.',
      },
    ],
  },
  {
    slug: 'child-pugh-skoru',
    name: 'Child-Pugh Skoru',
    category: 'health',
    description:
      'Kronik karaciğer hastalığında Child-Pugh sınıfını (A, B, C) hesaplayın ve bildirilen sağkalım oranlarını görün.',
    icon: 'Layers',
    keywords: ['child pugh', 'child pugh skoru', 'siroz evreleme', 'karaciğer yetmezliği'],
    popularity: 60,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Child-Pugh skoru, sirozda karaciğer fonksiyon rezervini bilirubin, albümin, INR, asit ve ensefalopati üzerinden sınıflar. Toplam 5–15 puan arasında değişir; A, B ve C sınıflarına ayrılır ve cerrahi risk değerlendirmesinde yaygın kullanılır.',
    useCases: [
      'Sirozda prognozu sınıflamak',
      'Elektif cerrahi öncesi karaciğer rezervini değerlendirmek',
      'Transplantasyon değerlendirmesine veri sağlamak',
    ],
    faq: [
      {
        q: 'Child-Pugh sınıfları ne anlama gelir?',
        a: 'A (5–6 puan) iyi kompanse, B (7–9) anlamlı fonksiyonel bozulma, C (10–15) dekompanse hastalığı gösterir.',
      },
      {
        q: 'Child-Pugh mu MELD mi kullanılmalı?',
        a: 'İkisi farklı amaçlara hizmet eder. MELD organ tahsisinde objektif sıralama için, Child-Pugh ise cerrahi risk ve genel prognoz değerlendirmesinde yaygındır.',
      },
      {
        q: 'Asit ve ensefalopati nasıl derecelendirilir?',
        a: 'Asit yok, diüretikle kontrol altında veya dirençli olarak; ensefalopati yok, evre 1–2 veya evre 3–4 olarak puanlanır.',
      },
    ],
  },
  {
    slug: 'meld-skoru',
    name: 'MELD ve MELD-Na Skoru',
    category: 'health',
    description:
      'Bilirubin, INR ve kreatininden MELD skorunu; sodyum girilirse MELD-Na skorunu UNOS kurallarıyla hesaplayın.',
    icon: 'Calculator',
    keywords: ['meld skoru', 'meld na', 'karaciğer nakli skoru', 'meld hesaplama'],
    popularity: 66,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'MELD skoru, son dönem karaciğer hastalığında üç aylık mortaliteyi öngörür ve nakil bekleme listesinde önceliklendirmede kullanılır. Araç UNOS kurallarını uygular: 1’in altındaki değerler 1’e yuvarlanır, kreatinin en fazla 4,0 alınır, diyaliz işaretlenirse kreatinin 4,0 kabul edilir ve skor 6–40 aralığına kırpılır.',
    useCases: [
      'Karaciğer nakli önceliklendirmesinde skor hesaplamak',
      'Sirozda üç aylık mortalite riskini tahmin etmek',
      'Girişimsel işlem öncesi risk değerlendirmesi yapmak',
    ],
    faq: [
      {
        q: 'MELD ile MELD-Na farkı nedir?',
        a: 'MELD-Na, hiponatreminin bağımsız mortalite etkisini hesaba katar. OPTN 2016 kuralına göre yalnızca MELD 11’in üzerindeyken uygulanır ve sodyum 125–137 aralığına kırpılır.',
      },
      {
        q: 'Diyaliz seçeneği neyi değiştirir?',
        a: 'Son bir hafta içinde en az iki kez hemodiyaliz veya 24 saatlik CVVHD uygulandıysa kreatinin 4,0 mg/dL kabul edilir; bu bir UNOS kuralıdır.',
      },
      {
        q: 'Çocuklarda kullanılır mı?',
        a: 'Hayır. 12 yaş altında MELD yerine PELD skoru kullanılır.',
      },
    ],
  },
  {
    slug: 'glasgow-koma-skalasi',
    name: 'Glasgow Koma Skalası',
    category: 'health',
    description:
      'Göz, sözel ve motor yanıtlardan Glasgow Koma Skalası puanını hesaplayın ve bilinç düzeyi yorumunu görün.',
    icon: 'Brain',
    keywords: ['glasgow koma skalası', 'gks hesaplama', 'gcs', 'bilinç değerlendirme', 'kafa travması'],
    popularity: 72,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Glasgow Koma Skalası, bilinç düzeyini göz açma, sözel yanıt ve motor yanıt üzerinden 3–15 arasında puanlar. Kafa travmasında şiddet sınıflamasının ve takipte değişimi izlemenin standart aracıdır.',
    useCases: [
      'Kafa travmasında şiddeti sınıflamak',
      'Yoğun bakımda bilinç düzeyini seri olarak izlemek',
      'Entübasyon kararına veri sağlamak',
    ],
    faq: [
      {
        q: 'GKS kaç olursa koma kabul edilir?',
        a: '8 ve altı koma olarak kabul edilir ve hava yolu güvenliği için entübasyon endikasyonu değerlendirilir.',
      },
      {
        q: 'Skorun alt sınırı neden 3?',
        a: 'Her bileşenin en düşük puanı 1 olduğu için toplam en az 3 olur; 0 puan mümkün değildir.',
      },
      {
        q: 'Entübe hastada sözel yanıt nasıl puanlanır?',
        a: 'Sözel yanıt değerlendirilemez; genellikle “T” harfiyle işaretlenir ve toplam skor bu kısıtla birlikte raporlanır.',
      },
    ],
  },
  {
    slug: 'curb-65-skoru',
    name: 'CURB-65 Skoru',
    category: 'health',
    description:
      'Toplum kökenli pnömonide CURB-65 skorunu hesaplayın; 30 günlük mortalite tahminini ve yatış kararını görün.',
    icon: 'Stethoscope',
    keywords: ['curb 65', 'curb-65 hesaplama', 'pnömoni şiddet skoru', 'pnömoni yatış kriteri'],
    popularity: 68,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'CURB-65, toplum kökenli pnömonide 30 günlük mortaliteyi öngörerek ayaktan tedavi, servise yatış veya yoğun bakım kararına yön verir. Konfüzyon, üre, solunum sayısı, kan basıncı ve 65 yaş sınırı olmak üzere beş maddeden oluşur.',
    useCases: [
      'Pnömonide yatış kararını nesnel ölçütle vermek',
      'Yoğun bakım gereksinimini erken saptamak',
      'Ayaktan tedaviye uygun hastaları belirlemek',
    ],
    faq: [
      {
        q: 'CURB-65 kaç olursa hastaneye yatış gerekir?',
        a: '0–1 puan genellikle ayaktan tedaviye uygundur. 2 puanda kısa yatış veya yakın gözlem, 3 ve üzerinde hastaneye yatış; 4–5 puanda yoğun bakım değerlendirilir.',
      },
      {
        q: 'Üre değeri hangi birimde girilmeli?',
        a: 'Kriter 7 mmol/L üzeridir; mg/dL cinsinden BUN kullanıyorsanız karşılığı yaklaşık 19 mg/dL’dir.',
      },
      {
        q: 'CRB-65 ile farkı nedir?',
        a: 'CRB-65 üre maddesi olmadan hesaplanır ve laboratuvar imkânı olmayan birinci basamakta kullanılır.',
      },
    ],
  },
  {
    slug: 'timi-skoru',
    name: 'TIMI Risk Skoru (UA/NSTEMI)',
    category: 'health',
    description:
      'Kararsız angina ve NSTEMI’de TIMI risk skorunu hesaplayın; 14 günlük olay riskini ve invaziv strateji eşiğini görün.',
    icon: 'HeartCrack',
    keywords: ['timi skoru', 'timi risk score', 'nstemi risk', 'kararsız angina skoru'],
    popularity: 58,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'TIMI risk skoru, kararsız angina ve ST yükselmesiz miyokard enfarktüsünde 14 günlük ölüm, miyokard enfarktüsü veya acil revaskülarizasyon riskini öngörür. Yedi maddeden oluşur ve her madde 1 puandır.',
    useCases: [
      'NSTEMI’de erken invaziv strateji kararına veri sağlamak',
      'Acil serviste göğüs ağrısı riskini sınıflamak',
      'Hastaya olay riskini sayısal olarak anlatmak',
    ],
    faq: [
      {
        q: 'TIMI skoru kaç olursa yüksek risk?',
        a: '5 ve üzeri yüksek risk kabul edilir; 14 günlük olay riski %26’nın üzerindedir ve erken invaziv strateji önerilir.',
      },
      {
        q: 'STEMI için de kullanılabilir mi?',
        a: 'Hayır. Bu skor kararsız angina ve NSTEMI içindir; STEMI için ayrı bir TIMI risk skoru tanımlanmıştır.',
      },
      {
        q: 'Risk oranları neye dayanıyor?',
        a: 'Antman ve arkadaşlarının JAMA 2000’de yayımladığı TIMI 11B ve ESSENCE çalışma verilerine dayanır.',
      },
    ],
  },
];

export const businessTools: Tool[] = [
  {
    slug: 'kdv-hesaplama',
    name: 'KDV Hesaplama',
    category: 'business',
    description:
      'KDV dahil veya hariç tutardan matrahı, KDV tutarını ve genel toplamı %1, %10 ve %20 oranlarıyla hesaplayın.',
    icon: 'Receipt',
    keywords: ['kdv hesaplama', 'kdv dahil hariç', 'katma değer vergisi', 'kdv ayırma', 'matrah'],
    popularity: 82,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'KDV hesaplama aracı, girdiğiniz tutarın KDV dahil mi hariç mi olduğunu seçerek matrahı, vergi tutarını ve genel toplamı ayrı ayrı gösterir. Türkiye’de yürürlükteki %1, %10 ve %20 oranlarını destekler.',
    useCases: [
      'Fatura keserken matrah ve KDV’yi ayırmak',
      'KDV dahil fiyattan vergi tutarını geri hesaplamak',
      'Teklif hazırlarken genel toplamı bulmak',
    ],
    faq: [
      {
        q: 'KDV dahil tutardan KDV nasıl ayrılır?',
        a: 'Tutar (1 + oran) değerine bölünerek matrah bulunur, aradaki fark KDV tutarıdır. %20 için tutarı 1,20’ye bölmek yeterlidir.',
      },
      {
        q: 'Türkiye’de KDV oranları kaçtır?',
        a: 'Yürürlükte %1, %10 ve %20 olmak üzere üç oran vardır. Hangi malın hangi orana girdiği Cumhurbaşkanı kararıyla değişebilir.',
      },
      {
        q: 'Sonuç fatura için bağlayıcı mı?',
        a: 'Hayır, bu bir yardımcı hesaptır. Resmî belgede yer alacak tutarlar için muhasebe kaydınızı esas alın.',
      },
    ],
  },
  {
    slug: 'kar-marji-hesaplama',
    name: 'Kâr Marjı Hesaplama',
    category: 'business',
    description:
      'Maliyet ve satış fiyatından kâr marjını, maliyet üzerine kârlılığı ve hedef marj için gereken satış fiyatını hesaplayın.',
    icon: 'TrendingUp',
    keywords: ['kar marjı hesaplama', 'karlılık hesaplama', 'markup', 'satış fiyatı belirleme'],
    popularity: 76,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Kâr marjı aracı, sık karıştırılan iki oranı birlikte gösterir: kârın satış fiyatına oranı (marj) ve maliyete oranı (kârlılık). Ayrıca hedeflediğiniz marja ulaşmak için satış fiyatının kaç olması gerektiğini hesaplar.',
    useCases: [
      'Ürün fiyatlandırırken hedef marja göre satış fiyatı belirlemek',
      'Mevcut fiyatın gerçek kâr marjını görmek',
      'E-ticarette komisyon sonrası kârlılığı kontrol etmek',
    ],
    faq: [
      {
        q: 'Kâr marjı ile kârlılık aynı şey mi?',
        a: 'Hayır. Marj kârı satış fiyatına, kârlılık ise maliyete böler. Maliyetin üzerine %50 eklemek %33 kâr marjı demektir.',
      },
      {
        q: 'Hedef marj için satış fiyatı nasıl bulunur?',
        a: 'Maliyet, (1 − marj) değerine bölünür. %35 marj hedefleyen 750 TL maliyetli ürünün satış fiyatı 750 / 0,65 ≈ 1.154 TL olur.',
      },
      {
        q: 'KDV dahil mi hesaplanmalı?',
        a: 'Kâr marjı KDV hariç tutarlar üzerinden hesaplanmalıdır; aksi halde vergi kâr gibi görünür.',
      },
    ],
  },
  {
    slug: 'kredi-taksit-hesaplama',
    name: 'Kredi Taksit Hesaplama',
    category: 'business',
    description:
      'Kredi tutarı, aylık faiz oranı ve vadeden eşit taksit tutarını, toplam geri ödemeyi ve toplam faizi hesaplayın.',
    icon: 'Landmark',
    keywords: ['kredi hesaplama', 'taksit hesaplama', 'kredi faiz hesaplama', 'ödeme planı'],
    popularity: 80,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Eşit taksitli (anüite) kredilerde aylık ödemeyi hesaplar. Formül, anaparayı ve faizi vade boyunca eşit taksitlere yayan standart anüite denklemidir; toplam geri ödeme ve toplam faiz yükü ayrıca gösterilir.',
    useCases: [
      'Kredi çekmeden önce aylık yükü görmek',
      'Farklı vadelerin toplam faiz farkını karşılaştırmak',
      'Taksitli satışta vade farkını hesaplamak',
    ],
    faq: [
      {
        q: 'Hesaplanan taksit bankadakiyle neden farklı?',
        a: 'Bu hesap yalnızca anapara ve faizi kapsar. Bankalar ayrıca BSMV ve KKDF, dosya masrafı ve sigorta ekler; gerçek ödeme daha yüksek olur.',
      },
      {
        q: 'Aylık faiz oranını nereden bulurum?',
        a: 'Bankaların ilan ettiği oran genellikle aylıktır. Yıllık oran verilmişse 12’ye bölerek yaklaşık aylık orana ulaşabilirsiniz.',
      },
      {
        q: 'Erken kapatma hesaplanıyor mu?',
        a: 'Hayır. Erken kapamada kalan anapara ve yasal indirim ayrı hesaplanır; bankanızdan kapama tutarı talep etmelisiniz.',
      },
    ],
  },
  {
    slug: 'kidem-tazminati-hesaplama',
    name: 'Kıdem ve İhbar Tazminatı Hesaplama',
    category: 'business',
    description:
      'Çalışma süresi ve giydirilmiş brüt ücretten kıdem tazminatını, damga vergisini ve ihbar tazminatını hesaplayın.',
    icon: 'FileSignature',
    keywords: ['kıdem tazminatı hesaplama', 'ihbar tazminatı', 'kıdem tavanı', 'iş kanunu'],
    popularity: 84,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Kıdem tazminatı, her tam çalışma yılı için 30 günlük giydirilmiş brüt ücret üzerinden hesaplanır ve yasal tavanı aşamaz. İhbar tazminatı ise kıdeme bağlı olarak 2 ile 8 hafta arasında değişir. Araç ikisini birlikte hesaplar ve kıdemden kesilen damga vergisini ayrıca gösterir.',
    useCases: [
      'İşten ayrılırken hak edilen tazminatı önceden görmek',
      'İnsan kaynaklarında çıkış hesabı hazırlamak',
      'İhbar süresini kıdeme göre belirlemek',
    ],
    faq: [
      {
        q: 'Kıdem tazminatı tavanı nedir?',
        a: 'Kıdem tazminatının bir yıllık tutarına konan yasal üst sınırdır ve her yıl ocak ile temmuz aylarında güncellenir. Araçtaki değeri kendi döneminize göre değiştirebilirsiniz.',
      },
      {
        q: 'Kıdem tazminatından hangi kesintiler yapılır?',
        a: 'Yalnızca damga vergisi kesilir (binde 7,59). Gelir vergisi ve SGK primi kesilmez.',
      },
      {
        q: 'İhbar süresi nasıl belirlenir?',
        a: '4857 sayılı İş Kanunu md.17’ye göre kıdeme bağlıdır: 6 aydan az 2 hafta, 6 ay–1,5 yıl 4 hafta, 1,5–3 yıl 6 hafta, 3 yıldan fazla 8 hafta.',
      },
      {
        q: 'Her ayrılışta kıdem tazminatı alınır mı?',
        a: 'Hayır. İstifa gibi bazı durumlarda hak doğmaz. Hak kazanma koşulları hukuki değerlendirme gerektirir.',
      },
    ],
  },
  {
    slug: 'not-ortalamasi-hesaplama',
    name: 'Not Ortalaması (AGNO) Hesaplama',
    category: 'business',
    description:
      'Ders kredilerinden ve harf notlarından ağırlıklı genel not ortalamanızı 4’lük sistemde hesaplayın.',
    icon: 'GraduationCap',
    keywords: ['not ortalaması hesaplama', 'agno hesaplama', 'gano', 'harf notu', 'ortalama'],
    popularity: 72,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Ağırlıklı genel not ortalaması, her dersin harf notu katsayısının kredisiyle çarpılıp toplam krediye bölünmesiyle bulunur. Araç istediğiniz kadar ders ekleyerek 4’lük sistemde ortalamanızı hesaplar.',
    useCases: [
      'Dönem sonunda ortalamayı önceden hesaplamak',
      'Mezuniyet ortalamasını takip etmek',
      'Burs veya onur listesi eşiğine ne kadar kaldığını görmek',
    ],
    faq: [
      {
        q: 'AGNO nasıl hesaplanır?',
        a: 'Her dersin katsayısı kredisiyle çarpılır, çıkan değerler toplanır ve toplam krediye bölünür. Kredisi yüksek dersler ortalamayı daha çok etkiler.',
      },
      {
        q: 'Harf notu katsayıları her üniversitede aynı mı?',
        a: 'Hayır. Burada yaygın kullanılan ölçek esas alınmıştır; kendi yönetmeliğinizdeki katsayılar farklıysa sonuç değişir.',
      },
      {
        q: 'Kaç ders ekleyebilirim?',
        a: 'Sınır yok. “Ders ekle” düğmesiyle istediğiniz kadar satır ekleyebilirsiniz.',
      },
    ],
  },
  {
    slug: 'demir-agirlik-hesaplama',
    name: 'İnşaat Demiri Ağırlık Hesaplama',
    category: 'business',
    description:
      'Nervürlü inşaat çeliğinin çapına, boyuna ve adedine göre metre başına ve toplam ağırlığını hesaplayın.',
    icon: 'Ruler',
    keywords: ['demir ağırlık hesaplama', 'inşaat demiri kg', 'nervürlü çelik', 'metraj'],
    popularity: 56,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'İnşaat çeliğinin birim ağırlığı, çapın karesinin 162,28’e bölünmesiyle bulunur; bu değer çeliğin 7850 kg/m³ yoğunluğundan türetilir. Araç seçtiğiniz çap için metre başına ağırlığı ve toplam tonajı hesaplar.',
    useCases: [
      'Şantiyede demir siparişi için tonaj hesaplamak',
      'Metraj ve keşif hazırlamak',
      'Nakliye ağırlığını önceden belirlemek',
    ],
    faq: [
      {
        q: 'Demir ağırlığı nasıl hesaplanır?',
        a: 'Birim ağırlık (kg/m) = çap² ÷ 162,28. Örneğin Ø12 için 144 ÷ 162,28 ≈ 0,888 kg/m’dir.',
      },
      {
        q: 'Gerçek ağırlık neden farklı çıkıyor?',
        a: 'TS 708 belirli bir tolerans tanır; ince çaplarda ±%6’ya, kalın çaplarda ±%4,5’e kadar sapma normaldir.',
      },
      {
        q: 'Hangi çelik sınıfı için geçerli?',
        a: 'Nervürlü betonarme çeliği (B420C, B500C) için geçerlidir. Profil ve lama gibi ürünler farklı hesaplanır.',
      },
    ],
  },
  {
    slug: 'beton-hesaplama',
    name: 'Beton ve Harç Hesaplama',
    category: 'business',
    description:
      'Döşeme ölçülerinden beton hacmini ve beton sınıfına göre çimento, kum, çakıl ve su miktarını hesaplayın.',
    icon: 'Blocks',
    keywords: ['beton hesaplama', 'harç hesaplama', 'm3 beton', 'çimento hesabı', 'şap'],
    popularity: 54,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Girilen en, boy ve kalınlıktan beton hacmini hesaplar; seçtiğiniz beton sınıfının yaklaşık dozajına göre çimento, ince ve kaba agrega ile su miktarını gösterir. Keşif ve malzeme siparişi için yaklaşık değer üretir.',
    useCases: [
      'Döşeme veya temel için beton hacmi hesaplamak',
      'Malzeme siparişi öncesi çimento ve agrega miktarını bulmak',
      'Yaklaşık maliyet keşfi çıkarmak',
    ],
    faq: [
      {
        q: '1 m³ betonda ne kadar çimento var?',
        a: 'Beton sınıfına bağlıdır. C20/25 için yaklaşık 300 kg, C25/30 için 350 kg, C30/37 için 400 kg dozaj kullanılır.',
      },
      {
        q: 'Bu değerlerle beton dökebilir miyim?',
        a: 'Taşıyıcı elemanlarda hayır. Bunlar keşif amaçlı yaklaşık oranlardır; yapısal betonda TS EN 206’ya uygun santral reçetesi kullanılmalıdır.',
      },
      {
        q: 'Fire payı eklenmeli mi?',
        a: 'Evet. Kalıp kaçakları ve zemin düzensizliği için genellikle %5–10 fire payı eklenir.',
      },
    ],
  },
  {
    slug: 'gecikme-faizi-hesaplama',
    name: 'Gecikme Faizi ve Vade Farkı Hesaplama',
    category: 'business',
    description:
      'Anapara, yıllık faiz oranı ve gecikme gününden işleyen faizi, günlük faizi ve toplam borcu hesaplayın.',
    icon: 'Clock',
    keywords: ['gecikme faizi hesaplama', 'vade farkı', 'yasal faiz', 'temerrüt faizi'],
    popularity: 58,
    added: EKLENDI,
    badges: ['new'],
    live: true,
    about:
      'Gecikmiş bir alacağın üzerine işleyen faizi basit veya bileşik yöntemle hesaplar. Yasal faiz, ticari avans faizi ve gecikme zammı oranları dönemsel değiştiği için oran koda gömülü değildir; güncel oranı kendiniz girersiniz.',
    useCases: [
      'Vadesi geçmiş faturaya işleyen faizi hesaplamak',
      'İhtarname öncesi alacak tutarını belirlemek',
      'Vade farklı satışta fiyat farkını bulmak',
    ],
    faq: [
      {
        q: 'Hangi faiz oranını kullanmalıyım?',
        a: 'Alacağın türüne göre değişir: adi işlerde yasal faiz, ticari işlerde avans faizi, kamu alacaklarında gecikme zammı uygulanır. Güncel oranları Merkez Bankası ve Hazine yayımlar.',
      },
      {
        q: 'Basit faiz mi bileşik faiz mi?',
        a: 'Türk hukukunda kural olarak bileşik faiz yasaktır; ticari işlerde istisnaları vardır. Tereddüt halinde basit faiz seçilmelidir.',
      },
      {
        q: 'Yıl kaç gün kabul ediliyor?',
        a: 'Hesapta yıl 365 gün alınmıştır.',
      },
    ],
  },
];
