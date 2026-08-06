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
      'Bir PDF’i asıl büyüten şey metin değil, içindeki görsellerdir. Kaliteden ödün vermeden hangi yöntemin ne kadar kazandırdığını adım adım inceliyoruz.',
    date: '2025-03-18',
    readingTime: 9,
    category: 'PDF',
    tools: ['compress-pdf', 'split-pdf', 'merge-pdf', 'image-compressor'],
    body: `Bir PDF’i e-posta ile göndermeye çalışıp “ek boyutu çok büyük” uyarısıyla karşılaştıysanız, sorunun kaynağı büyük olasılıkla belgedeki metin değildir. On sayfalık yoğun bir metin belgesi genelde 200-300 kilobayt yer kaplar. Aynı on sayfa tarayıcıdan geçirildiğinde 30 megabaytı bulabilir. Aradaki bu yüz katlık fark, PDF sıkıştırmayı anlamanın başlangıç noktasıdır: küçültme çabası neredeyse tamamen görsellerle ilgilidir.

Bu yazıda hangi yöntemin hangi durumda ne kadar kazandırdığını, hangisinin ne pahasına geldiğini tek tek ele alacağız.

## Önce teşhis: dosyanız neden büyük?

Küçültmeye başlamadan önce belgenin hangi türden olduğunu belirleyin, çünkü doğru yöntem buna göre değişir.

**Dijital olarak üretilmiş belgeler.** Word, Excel veya bir muhasebe programından “PDF olarak kaydet” ile çıkmış belgelerdir. İçlerinde gerçek metin katmanı vardır; fareyle yazıyı seçebilirsiniz. Bu belgeler zaten küçüktür ve sıkıştırmadan elde edeceğiniz kazanç sınırlıdır — çünkü sıkıştırılacak fazla bir şey yoktur.

**Taranmış belgeler.** Bir tarayıcı ya da telefon kamerasıyla üretilmiştir. Her sayfa aslında tam sayfa boyutunda bir fotoğraftır; metni seçemezsiniz. Boyutun tamamı görsel verisidir ve en büyük kazanç burada elde edilir.

**Karma belgeler.** Metin katmanı vardır ama içine yüksek çözünürlüklü fotoğraf, grafik ya da logo gömülmüştür. Sunumlar, kataloglar ve raporlar genelde bu gruba girer.

Belgede metni fareyle seçebiliyorsanız dijital, seçemiyorsanız taranmış bir belgeyle karşı karşıyasınız. Bu tek kontrol, hangi yöntemin işe yarayacağını büyük ölçüde belirler.

## 1. Görsel çözünürlüğünü hedefe göre düşürün

En büyük kazanç buradadır ve çoğu kişi gereğinden yüksek çözünürlükle çalışır.

Çözünürlük DPI (inç başına nokta) ile ölçülür. Kritik nokta şudur: gereken DPI, belgenin nasıl kullanılacağına bağlıdır, ne kadar “iyi” istediğinize değil.

- **72-96 DPI** — Yalnızca ekranda okunacak, yazdırılmayacak belgeler için yeterlidir.
- **150 DPI** — Ekranda okunacak ve gerektiğinde ofis yazıcısından çıkabilecek belgeler için dengeli seçimdir. Çoğu durumda doğru cevap budur.
- **300 DPI** — Matbaa baskısı için standarttır. Belge basılmayacaksa bu değeri kullanmak, hiç görmeyeceğiniz ayrıntı için dosya boyutu ödemek demektir.

Bir tarayıcı varsayılan olarak 600 DPI’da tarama yapıyorsa, aynı belgeyi 150 DPI’a indirmek dosya boyutunu genellikle onda birine düşürür. Görsel verisi çözünürlüğün karesiyle büyür: çözünürlüğü yarıya indirdiğinizde dosya dörtte bire iner.

Pratik yaklaşım şudur: belgeyi 150 DPI’a indirin, en küçük punto ile yazılmış bölümü ekranda %100 yakınlaştırmada okuyun. Rahat okunuyorsa iş bitmiştir.

## 2. Gereksiz sayfaları çıkarın

Bu yöntem teknik değildir ama sıklıkla en hızlı kazancı verir. Belgelerde şaşırtıcı miktarda gereksiz sayfa birikir: taramadan çıkan boş arka yüzler, tekrarlanan kapaklar, artık geçerli olmayan ekler, imza sayfasının ikinci kopyası.

Yirmi sayfalık bir belgeden altı boş sayfayı çıkarmak dosyayı doğrudan yaklaşık üçte bir küçültür ve hiçbir kalite kaybı yaratmaz — çünkü hiçbir şey yeniden işlenmemiştir. [PDF Böl](/tools/split-pdf/) aracıyla yalnızca ihtiyacınız olan sayfa aralığını ayırabilirsiniz.

Sıkıştırmaya başlamadan önce bu adımı yapın. Atacağınız sayfaları sıkıştırmak boşa harcanmış işlemdir.

## 3. Görselleri PDF’e eklemeden önce hazırlayın

Bu, sonradan yapılan her sıkıştırmadan daha iyi sonuç verir ve sebebi önemlidir.

Bir görseli PDF’e yüksek çözünürlükte gömüp sonra tüm belgeyi sıkıştırdığınızda, görsel iki kez kayıplı işlemden geçer: önce PDF’e eklenirken, sonra sıkıştırılırken. Her kayıplı işlem bir öncekinin hatalarını da yeniden kodlar. Sonuç, tek adımda aynı boyuta indirilmiş bir görselden gözle görülür biçimde daha kötüdür.

Doğru sıra şudur: görseli önce hedef ölçüsüne indirin ve sıkıştırın, sonra belgeye ekleyin. [Görsel Sıkıştırma](/tools/image-compressor/) ve [Görsel Boyutlandırma](/tools/image-resizer/) araçları bu adım için yeterlidir.

## 4. Ekran görüntülerini doğru biçimde kaydedin

Rapor ve dokümantasyonlarda sık yapılan bir hata: ekran görüntülerini PNG olarak kaydetmek.

PNG kayıpsızdır ve keskin kenarları mükemmel korur; bu yüzden arayüz görüntüleri, logolar ve çizgi grafikleri için doğru tercihtir. Ancak fotoğraf içeren ya da yumuşak renk geçişleri olan bir ekran görüntüsünde PNG, aynı görselin JPEG hâlinden üç dört kat büyük olur.

Basit kural: görüntü ağırlıklı olarak düz renk ve keskin kenarlardan oluşuyorsa PNG, fotoğraf veya renk geçişi içeriyorsa JPEG kullanın.

## 5. Fontları ve gereksiz gömülü verileri sadeleştirin

Bu, kazancı en küçük ama tamamen risksiz olan yöntemdir.

PDF’ler yazı tiplerini belge içine gömer; böylece dosya, o fontun kurulu olmadığı bir bilgisayarda da doğru görünür. Sorun, bazı üreticilerin fontun tamamını — kullanılmayan tüm karakter ve varyantlarıyla birlikte — gömmesidir. Yalnızca belgede geçen karakterleri gömmek (buna alt küme gömme denir) birkaç yüz kilobayt kazandırabilir.

Aynı şekilde belgede biriken görünmez veriler de yer kaplar: silinmiş nesnelerin artıkları, düzenleme geçmişi, gömülü küçük resimler, doldurulmuş form alanlarının eski değerleri. Belgeyi yeniden kaydetmek bu artıkları temizler.

## Hangi sırayla uygulamalı?

Yöntemleri en çok kazandırandan en aza doğru değil, en az riskli olandan başlayarak uygulayın:

1. Gereksiz sayfaları çıkarın (kayıp yok).
2. Belgeyi yeniden kaydedip artık verileri temizleyin (kayıp yok).
3. Görselleri hedef ölçüye indirin (kontrollü kayıp).
4. Çözünürlüğü kullanım amacına göre düşürün (kontrollü kayıp).
5. Gerekiyorsa genel sıkıştırma uygulayın.

[PDF Sıkıştır](/tools/compress-pdf/) aracı 3, 4 ve 5. adımları tek işlemde yapar; metin katmanına dokunmadığı için belge sıkıştırma sonrasında da aranabilir kalır.

## Ne zaman durmalı?

Sıkıştırmada bir doyum noktası vardır. Belge zaten çoğunlukla metinden oluşuyorsa daha fazla sıkıştırma neredeyse hiçbir şey kazandırmaz ama görselleri belirgin biçimde bozar.

Şu üç durumda daha fazla ilerlemeyin:

- Metin, ekranda %100 yakınlaştırmada bulanık görünmeye başladıysa.
- Belge resmî bir başvuruya gidecekse ve okunaklılık şartı varsa.
- İkinci sıkıştırma turunda kazanç %5’in altına düştüyse — bu, sıkıştırılabilir verinin tükendiğini gösterir.

Boyut hâlâ çok büyükse doğru çözüm daha agresif sıkıştırma değil, belgeyi bölmektir. İki ayrı 8 MB dosya, okunamayacak hale gelmiş tek bir 15 MB dosyadan her zaman daha kullanışlıdır.`,
  },
  {
    slug: 'core-web-vitals-gorsel-optimizasyonu',
    title: 'Core Web Vitals için Görsel Optimizasyonu',
    excerpt:
      'LCP puanınızı düşüren en büyük neden genelde görsellerdir. Format, boyut ve yükleme sırası kararlarının ölçülebilir etkisini inceliyoruz.',
    date: '2025-03-10',
    readingTime: 11,
    category: 'Performans',
    tools: ['image-compressor', 'image-resizer', 'image-converter', 'crop-image'],
    body: `Core Web Vitals, Google’ın sayfa deneyimini ölçmek için kullandığı üç metrikten oluşur. Bunlardan ikisi doğrudan görsellerden etkilenir ve çoğu sitede kötü puanın asıl sebebi budur.

Bu yazıda hangi kararın hangi metriği ne kadar etkilediğini ve düzeltmeleri hangi sırayla yapmanız gerektiğini ele alacağız.

## Üç metrik ve görsellerle ilişkisi

**LCP (Largest Contentful Paint)** ekrandaki en büyük içerik öğesinin ne kadar sürede göründüğünü ölçer. İyi kabul edilen değer 2,5 saniyenin altıdır. Çoğu sayfada bu en büyük öğe bir kapak görselidir — yani LCP puanınız pratikte “kapak görseliniz ne kadar hızlı yükleniyor” sorusunun cevabıdır.

**CLS (Cumulative Layout Shift)** sayfa yüklenirken içeriğin ne kadar kaydığını ölçer. İyi değer 0,1’in altıdır. Görseller burada da başrol oynar: boyutu belirtilmemiş bir görsel yüklendiğinde altındaki metni aşağı iter ve okumakta olan kullanıcının satırını kaydırır.

**INP (Interaction to Next Paint)** kullanıcı etkileşimine verilen yanıt süresini ölçer ve ağırlıklı olarak JavaScript ile ilgilidir. Görsellerin buradaki etkisi dolaylıdır: aşırı büyük görseller ana iş parçacığını kod çözme işlemiyle meşgul ederek yanıt süresini uzatır.

## En büyük kazanç: gerçek gösterim boyutunda sunmak

Sahadaki en yaygın hata budur ve düzeltmesi de en kolayıdır.

Bir görseli 600 piksel genişliğinde bir alanda gösteriyorsanız, tarayıcıya 2400 piksellik dosyayı indirtmenin hiçbir faydası yoktur. Kullanıcı aradaki farkı göremez ama dört kat veri indirir. Görsel verisi genişliğin karesiyle büyüdüğü için 2400 pikselden 600 piksele inmek, dosyayı yaklaşık on altıda birine düşürür.

Yüksek yoğunluklu ekranlar için bir pay bırakmak makuldür: gösterim genişliğinin iki katını hedefleyin. 600 piksellik bir alan için 1200 piksellik bir görsel fazlasıyla yeterlidir. [Görsel Boyutlandırma](/tools/image-resizer/) aracıyla bu indirimi tek adımda yapabilirsiniz.

Görselin gerçekte kaç piksellik alanda gösterildiğini öğrenmek için tarayıcının geliştirici araçlarında görselin üzerine gelin; hem gerçek dosya boyutu hem gösterim boyutu birlikte görünür.

## Format seçimi: WebP artık varsayılan olmalı

Üç format arasındaki fark net:

- **JPEG** — Fotoğraflar için kayıplı sıkıştırma. Evrensel destek, ama en verimsizi.
- **PNG** — Kayıpsız, şeffaflığı destekler. Logo, ikon ve arayüz görüntüleri için doğru tercih; fotoğraf için gereksiz büyük.
- **WebP** — Aynı algılanan kalitede JPEG’den ortalama %25-35 daha küçük dosya üretir, hem kayıplı hem kayıpsız çalışır ve şeffaflığı destekler.

WebP güncel tüm masaüstü ve mobil tarayıcılarda destekleniyor. Uyumluluk kaygısıyla JPEG’de kalmak bugün için gereksiz bir maliyettir.

Fotoğraflarınızı JPEG’den WebP’ye çevirmek, hiçbir görsel değişiklik yapmadan sayfa ağırlığını dörtte bir azaltır. [Görsel Dönüştürücü](/tools/image-converter/) ile bu dönüşümü yapabilirsiniz.

## Kalite ayarını deneyerek bulun

Kayıplı sıkıştırmada kalite değeri ile dosya boyutu arasındaki ilişki doğrusal değildir. %100’den %90’a inmek dosyayı genelde yarıya düşürür ve fark gözle ayırt edilemez. %90’dan %80’e inmek belirgin bir kazanç daha verir. %60’ın altına inildiğinde ise kazanç yavaşlarken bozulma hızla artar.

Pratik başlangıç noktaları:

- **Fotoğraflar:** %80. Çoğu durumda yan yana karşılaştırma yapılmadan fark edilmez.
- **Keskin kenar içeren görseller** (ekran görüntüsü, metin içeren grafik): %90 veya PNG. Kayıplı sıkıştırma keskin kenarların çevresinde belirgin izler bırakır.
- **Arka plan görselleri:** %70. Üzerinde içerik olduğu için ayrıntı zaten görünmez.

Bir görseli iki kez kayıplı sıkıştırmayın. Zaten %80 kalitede kaydedilmiş bir JPEG’i tekrar %80’de kaydetmek dosyayı belirgin biçimde küçültmez ama kaliteyi bir kat daha düşürür. [Görsel Sıkıştırma](/tools/image-compressor/) aracında önizlemeye bakarak kalite değerini test edebilirsiniz.

## CLS’i düzeltmek: boyutu her zaman belirtin

Bu, tek satırlık bir düzeltmeyle ölçülebilir puan kazandıran nadir durumlardan biridir.

Tarayıcı bir görselin ölçülerini bilmiyorsa, dosya inene kadar o alana sıfır yükseklik ayırır. Görsel geldiğinde birden yer kaplar ve altındaki her şeyi aşağı iter. Kullanıcı tam o sırada okuyor ya da bir bağlantıya tıklamak üzereyse, bu kayma doğrudan rahatsız edicidir.

Çözüm, img etiketine width ve height özniteliklerini yazmaktır. Bunlar CSS ile ölçeklendirmeyi engellemez; tarayıcının en boy oranını baştan hesaplayıp alanı ayırmasını sağlar. Yer tutucu doğru boyutta ayrıldığı için görsel geldiğinde hiçbir şey kaymaz.

## Yükleme sırası: neyi ertelemeli, neyi ertelememeli

Buradaki iki hatanın da bedeli vardır.

Ekranın altında kalan görsellere \`loading="lazy"\` eklemek doğrudur; bunlar sayfa açılışında indirilmez, kullanıcı yaklaştığında yüklenir. Uzun bir sayfada bu, ilk yükte inen veriyi belirgin biçimde azaltır.

Ancak **LCP öğesine lazy loading uygulamak, düzeltmeye çalıştığınız metriği doğrudan bozar.** Kapak görseline \`loading="lazy"\` eklemek tarayıcıya “bu acele değil” demektir; oysa LCP puanınızı belirleyen tam olarak o görseldir. İlk ekranda görünen görselleri her zaman istekli yükleyin, hatta \`fetchpriority="high"\` ile öne alın.

Basit kural: ilk ekranda görünen görseller öncelikli, geri kalan her şey lazy.

## Doğru sıra

Düzeltmeleri kazanç/emek oranına göre şu sırayla yapın:

1. **Görselleri gerçek gösterim boyutuna indirin.** En büyük kazanç, en az risk.
2. **width ve height özniteliklerini ekleyin.** CLS’i genelde tek başına çözer.
3. **WebP’ye geçin.** Görsel değişiklik olmadan yaklaşık %30 kazanç.
4. **Kalite değerini ayarlayın.** Format ve boyut düzeltildikten sonra ince ayar.
5. **Lazy loading uygulayın** — LCP öğesi hariç.

## Ölçmeden değiştirmeyin

Son bir uyarı: sahadaki gerçek kullanıcı verisiyle laboratuvar testi farklı sonuç verir. PageSpeed Insights size iki bölüm gösterir; üstteki saha verisi gerçek ziyaretçilerinizden toplanır ve Google’ın sıralamada kullandığı veri budur. Alttaki laboratuvar testi ise tek bir simüle edilmiş yüklemedir.

Bir değişikliğin saha verisine yansıması 28 günlük ölçüm penceresi nedeniyle haftalar alır. Laboratuvar puanınız düzeldiği halde saha verisi değişmediyse, sabırlı olun — henüz yeterli veri birikmemiş olabilir.`,
  },
  {
    slug: 'guclu-parola-nasil-olusturulur',
    title: 'Güçlü Parola Nasıl Oluşturulur? Uzunluk mu, Karmaşıklık mı?',
    excerpt:
      'Yıllardır dayatılan “büyük harf, rakam, sembol” kuralı aslında yanlış bir öncelik. Parola güvenliğinde gerçekten işe yarayan şeyi rakamlarla inceliyoruz.',
    date: '2025-02-28',
    readingTime: 10,
    category: 'Güvenlik',
    tools: ['password-generator', 'hash-generator', 'uuid-generator'],
    body: `Parola kuralları yıllardır aynı şeyi söylüyor: en az bir büyük harf, bir rakam, bir sembol. Bu kuralın arkasındaki mantık makul görünüyor ama önceliği yanlış yere koyuyor — ve sonuçta insanları hatırlaması zor, kırılması ise şaşırtıcı derecede kolay parolalara yönlendiriyor.

## Neden uzunluk karmaşıklıktan önemli?

Bir parolanın gücü, saldırganın denemesi gereken olasılık sayısıyla ölçülür. Bu sayı iki şeye bağlıdır: kullanılan karakter havuzunun büyüklüğü ve parolanın uzunluğu.

Kritik nokta şu: **havuzu büyütmek olasılık sayısını çarparken, uzunluğu artırmak üsse ekler.**

Yalnızca küçük harf kullanan 8 karakterlik bir parolada havuz 26 karakterdir; olasılık sayısı 26⁸, yani yaklaşık 209 milyar. Sembol ve rakam ekleyerek havuzu 95 karaktere çıkardığınızda 95⁸ elde edersiniz — yaklaşık 6,6 katrilyon. Kayda değer bir artış.

Şimdi karmaşıklığı hiç artırmadan yalnızca uzunluğu ikiye katlayın: 26¹⁶, yani yaklaşık 43 sektilyon. Bu, karmaşık 8 karakterlik parolanın yaklaşık **altı buçuk milyar katıdır.**

Sonuç açıktır: 16 karakterlik sade bir parola, 8 karakterlik karmaşık bir paroladan kıyaslanamayacak kadar güçlüdür.

## Karmaşıklık kuralının asıl zararı

Sorun yalnızca yanlış öncelik değil. Karmaşıklık zorunluluğu insanları öngörülebilir davranışlara itiyor.

“Büyük harf, rakam ve sembol içermeli” denildiğinde insanların ezici çoğunluğu aynı üç şeyi yapar: baş harfi büyütür, sonuna bir rakam ekler, en sona da ünlem işareti koyar. \`Parola\` isteniyorsa \`Parola1!\` ortaya çıkar.

Saldırganlar bunu biliyor. Parola kırma yazılımları bu dönüşümleri kural setleri olarak içerir: baş harfi büyüt, sonuna 1-9999 arası sayı ekle, \`a\` yerine \`@\`, \`e\` yerine \`3\`, \`s\` yerine \`$\` dene. \`P@ro1a!\` gibi bir parola insana karmaşık görünür ama sözlük tabanlı bir saldırı için ham \`parola\` kelimesinden yalnızca birkaç kat daha zordur.

Karmaşıklık kuralı, gerçek entropi eklemek yerine tahmin edilebilir bir kalıp yaratmıştır.

## Parola cümlesi yaklaşımı

Uzunluğu artırmanın hatırlanabilir yolu, rastgele seçilmiş kelimeleri birleştirmektir.

Burada “rastgele” kelimesi belirleyicidir. Kendi seçtiğiniz dört kelime rastgele değildir; birbirleriyle anlamlı biçimde ilişkilidir ve tahmin edilebilir. Gerçek güvenlik, kelimelerin geniş bir listeden bağımsız olarak seçilmesinden gelir.

Yaklaşık 7.800 kelimelik bir listeden gerçekten rastgele seçilen dört kelime, kabaca 51 bitlik entropi verir. Altı kelime bunu 77 bite çıkarır ve bu, pratikte kırılamaz kabul edilen bir eşiktir.

Bu yaklaşımın avantajı, güvenliği insan hafızasıyla uzlaştırmasıdır: \`kavun-teleskop-mandal-yosun\` hem 26 karakter uzunluğundadır hem de gözünüzde canlandırarak hatırlayabileceğiniz bir şeydir.

## Asıl mesele: parolayı tekrar kullanmamak

Buraya kadar anlattığımız her şeyden daha önemli bir kural var.

Pratikte hesaplar çoğunlukla parolası kırıldığı için değil, **başka bir sitede sızdığı için** ele geçirilir. Bir alışveriş sitesi veri ihlaline uğradığında, saldırganlar oradan elde ettikleri e-posta ve parola çiftlerini otomatik olarak onlarca başka serviste dener. Aynı parolayı e-postanızda da kullanıyorsanız, alışveriş sitesinin ihlali sizin e-postanızın da ihlali olur.

Bu yönteme kimlik doldurma (credential stuffing) denir ve son derece yaygındır. Parolanızın ne kadar güçlü olduğu burada hiç fark etmez; saldırgan onu tahmin etmiyor, doğrudan biliyor.

Bu yüzden tek ve en önemli kural şudur: **her hesap için farklı bir parola kullanın.** Yüz farklı parola ezberlemek mümkün olmadığına göre, bu ancak bir parola yöneticisiyle uygulanabilir.

## Parola yöneticisi ve tek zayıf halka

Parola yöneticisi tüm parolalarınızı şifreli bir kasada tutar ve sizin yalnızca tek bir ana parolayı hatırlamanızı gerektirir.

“Hepsini tek yere koymak riskli değil mi?” sorusu makuldür ama karşılaştırma yanlış yapılıyor. Alternatif, tüm parolaları tek yere koymamak değil; hepsini aynı yapmak ya da bir yere not etmektir. Parola yöneticisi bu ikisinden de belirgin biçimde güvenlidir.

Bu modelde ana parola tek zayıf halka haline gelir, dolayısıyla ona ayrı davranın: uzun bir parola cümlesi seçin, başka hiçbir yerde kullanmayın ve kasaya iki faktörlü doğrulama ekleyin.

Geri kalan parolaları hatırlamanız gerekmediği için onları en uzun ve en rastgele hâlde üretebilirsiniz. [Parola Üretici](/tools/password-generator/) aracı bunu tarayıcınızın kriptografik rastgelelik kaynağıyla yapar; üretilen değer hiçbir sunucuya gönderilmez.

## İki faktörlü doğrulama parolanın önüne geçer

Güçlü ve benzersiz bir parolanın bile koruyamadığı bir durum vardır: parolayı siz kendiniz sahte bir siteye girerseniz.

İki faktörlü doğrulama (2FA) bu boşluğu kapatır. Parola bilinse bile ikinci faktör olmadan giriş yapılamaz. Yöntemler arasında da fark vardır:

- **SMS kodu** — En zayıfı, ancak hiç yoktan iyidir. SIM kart devralma saldırılarına açıktır.
- **Uygulama tabanlı kod** (Google Authenticator, Authy) — Belirgin biçimde daha güvenlidir; kod cihazınızda üretilir, ağdan geçmez.
- **Donanım anahtarı** (FIDO2/WebAuthn) — En güçlüsü. Kimlik avına karşı yapısal olarak dirençlidir, çünkü anahtar hangi siteye bağlandığını kriptografik olarak doğrular ve sahte bir adrese yanıt vermez.

E-posta hesabınızda mutlaka 2FA açın. E-posta, diğer tüm hesapların parola sıfırlama adresi olduğu için ele geçirildiğinde geri kalan her şeye kapı açar.

## Özetle

- Uzunluk karmaşıklıktan önemlidir; en az 16 karakter hedefleyin.
- Hatırlamanız gereken parolalar için rastgele seçilmiş kelimelerden oluşan cümleler kullanın.
- Hiçbir parolayı iki yerde kullanmayın — bu, listedeki en kritik maddedir.
- Parola yöneticisi kullanın ve ana parolaya ayrı özen gösterin.
- Kritik hesaplarda iki faktörlü doğrulamayı açın.
- Parolanızı düzenli aralıklarla zorunlu olarak değiştirmeyin; bu eski öneri, insanları küçük ve tahmin edilebilir değişikliklere ittiği için terk edilmiştir. Yalnızca bir ihlal şüphesi varsa değiştirin.`,
  },
  {
    slug: 'json-hatalari-ve-cozumleri',
    title: 'En Sık Yapılan 7 JSON Hatası ve Çözümleri',
    excerpt:
      'Sondaki virgülden kodlama sorunlarına, API entegrasyonlarını bozan klasik JSON hataları ve her birinin nasıl teşhis edileceği.',
    date: '2025-02-14',
    readingTime: 9,
    category: 'Geliştirme',
    tools: ['json-formatter', 'json-validator', 'jwt-decoder', 'base64-encode-decode'],
    body: `JSON şaşırtıcı derecede sade bir formattır; tüm spesifikasyonu birkaç sayfa tutar. Ama tam da bu sadelik yüzünden katıdır: JavaScript’te sorun çıkarmayan pek çok yazım, JSON’da doğrudan hata verir.

Aşağıda pratikte en sık karşılaşılan yedi hata, her birinin neden olduğu ve nasıl teşhis edileceği var.

## 1. Sondaki virgül

En yaygın hata budur.

JavaScript nesne ve dizi değişmezlerinde son öğeden sonra virgül bırakmak serbesttir; kod düzenleyicileri ve biçimlendiriciler bunu hatta teşvik eder, çünkü satır ekleyip çıkarmayı kolaylaştırır ve sürüm karşılaştırmalarını temiz tutar.

JSON’da ise bu bir sözdizimi hatasıdır. \`{"ad": "Ali", "yas": 30,}\` geçersizdir.

Hata genellikle elle düzenleme sırasında ortaya çıkar: bir alan silinir, öncesindeki virgül kalır. Teşhisi kolaydır çünkü ayrıştırıcı hatayı tam doğru yerde bildirir — kapanış parantezinin konumunu gösteren bir hata alıyorsanız, önce bir önceki satırın sonuna bakın.

## 2. Tek tırnak

JSON yalnızca çift tırnak kabul eder. Hem değerler hem de **anahtarlar** için.

Bu, Python veya JavaScript’ten kopyalanan veride sık görülür, çünkü her iki dilde de tek tırnak geçerlidir. \`{'ad': 'Ali'}\` bir Python sözlüğü olarak doğrudur ama JSON olarak geçersizdir.

Aynı şekilde tırnaksız anahtarlar da geçersizdir: \`{ad: "Ali"}\` JavaScript’te sorunsuz çalışır, JSON’da çalışmaz.

## 3. Yorum satırları

JSON standardında yorum yoktur. \`//\` veya \`/* */\` eklediğiniz an dosya geçersiz hale gelir.

Bu, özellikle yapılandırma dosyalarında can sıkıcıdır — bir ayarın ne işe yaradığını not etmek isteyen herkes bu duvara çarpar. Formatın tasarımcısı yorumları bilinçli olarak dışarıda bırakmıştır; gerekçesi, yorumların ayrıştırıcıya yönelik direktifler taşımak için kötüye kullanılmasını engellemekti.

Pratik çözümler: yoruma ihtiyaç duyduğunuz yapılandırma dosyaları için JSON5, YAML veya TOML kullanın. Formatı değiştiremiyorsanız, açıklamayı \`"_yorum"\` gibi bir alan olarak veriye ekleyin — çirkindir ama geçerlidir.

VS Code gibi araçların kabul ettiği “JSONC” biçimi standart JSON değildir; o dosyaları bir API’ye gönderemezsiniz.

## 4. Kaçırılmamış özel karakterler

Bir metin değerinin içinde çift tırnak veya ters eğik çizgi geçiyorsa kaçırılmalıdır.

Bu hata en çok Windows dosya yollarında görülür. \`"yol": "C:\kullanici\belge"\` geçersizdir, çünkü \`\k\` ve \`\b\` tanımsız kaçış dizileridir. Doğrusu ters eğik çizgiyi ikilemektir: \`"C:\\kullanici\\belge"\`.

Satır sonları da doğrudan yazılamaz. JSON metin değerlerinde gerçek bir satır sonu karakteri bulunamaz; \`\n\` olarak kodlanmalıdır. Çok satırlı bir metni JSON’a elle yapıştırmak bu yüzden çalışmaz.

## 5. Sayı biçimi hataları

JSON’un sayı tanımı dar bir tanımdır ve birkaç yaygın yazım dışarıda kalır:

- **Baştaki sıfır** geçersizdir: \`007\` hata verir. Bu, posta kodu ve telefon numarası gibi alanlarda sık görülür — bunlar zaten sayı değil metin olarak tutulmalıdır.
- **Baştaki artı** geçersizdir: \`+5\` hata verir, \`5\` yazın.
- **Sondaki nokta** geçersizdir: \`5.\` hata verir, \`5.0\` yazın.
- **NaN ve Infinity** JSON’da yoktur. JavaScript bunları \`null\` olarak serileştirir.
- **Onaltılık gösterim** desteklenmez: \`0xFF\` geçersizdir.

Ayrı bir tuzak: JSON sayı için bir hassasiyet sınırı tanımlamaz ama JavaScript’in \`JSON.parse\` fonksiyonu değerleri 64 bitlik kayan noktalı sayıya çevirir. Bu da 2⁵³’ten büyük tam sayıların sessizce bozulması demektir. Büyük kimlik numaralarını (örneğin veritabanı ID’leri veya Twitter/X gönderi kimlikleri) **metin olarak** taşıyın; aksi halde son basamakları değişir ve hata hiçbir uyarı vermeden ortaya çıkar.

## 6. Kodlama ve görünmez karakterler

Dosya geçerli görünüyor ama ayrıştırıcı ilk karakterde hata veriyorsa, muhtemel sebep BOM’dur (Byte Order Mark).

Bazı Windows düzenleyicileri UTF-8 dosyaların başına görünmez bir işaret ekler. Metin düzenleyicide hiçbir şey görünmez ama ayrıştırıcı dosyanın \`{\` ile başlamadığını söyler. Çözüm, dosyayı “BOM’suz UTF-8” olarak kaydetmektir.

Benzer biçimde web sayfalarından kopyalanan metinlerde kırılmasız boşluk (U+00A0) bulunabilir. Ekranda normal boşluktan ayırt edilemez ama JSON ayrıştırıcısı için geçersiz bir karakterdir.

JSON her zaman UTF-8 olmalıdır. Türkçe karakterler bu kodlamada sorunsuz taşınır; \`\u00e7\` gibi kaçış dizileri kullanmak geçerlidir ama gerekli değildir.

## 7. Geçerli ama yanlış JSON

Son ve en sinsi kategori: dosya sözdizimsel olarak kusursuzdur, ayrıştırıcı hata vermez, ama veri beklenen biçimde değildir.

Tipik örnekler:

- Sayı beklenen alanda metin gelmesi: \`{"fiyat": "100"}\` ile \`{"fiyat": 100}\` ikisi de geçerli JSON’dur, ama tüketen kod için farklıdır.
- Tek öğeli listenin dizi yerine tek nesne olarak dönmesi. Bazı API’ler bunu yapar ve döngü kuran kod beklenmedik biçimde kırılır.
- \`null\` ile alanın hiç bulunmaması arasındaki farkın karıştırılması. Bunlar aynı şey değildir: biri “değer bilinmiyor”, diğeri “böyle bir alan yok” anlamına gelir.
- Boolean değerlerin \`"true"\` metni olarak gelmesi. JSON’da boolean tırnaksızdır ve yalnızca küçük harfle yazılır; \`True\` geçersizdir.

Sözdizimi doğrulaması bu hataların hiçbirini yakalamaz. Yakalamak için verinin yapısını tanımlayan bir JSON Schema doğrulaması gerekir.

## Teşhis için pratik yöntem

Bir JSON hatasıyla karşılaştığınızda şu sırayı izleyin:

1. **Önce biçimlendirin.** Tek satıra sıkışmış JSON’da hata bulmak neredeyse imkânsızdır. [JSON Formatlayıcı](/tools/json-formatter/) girintili hâle getirir; yapı bozukluğu genelde gözle görünür hale gelir.
2. **Hata konumuna bakın, bir önceki satırı kontrol edin.** Ayrıştırıcılar hatayı fark ettikleri yeri bildirir, hatanın başladığı yeri değil. Sondaki virgül hataları neredeyse her zaman bildirilen satırın bir üstündedir.
3. **Küçültme yöntemiyle daraltın.** Büyük bir dosyada hata bulamıyorsanız yarısını silip test edin; hangi yarıda olduğunu ikiye bölerek birkaç adımda bulursunuz.
4. **Sözdizimi doğruysa veriye bakın.** [JSON Doğrulayıcı](/tools/json-validator/) geçerli diyorsa sorun 7. kategoridedir: tür uyuşmazlığı arayın.

Son bir not: JSON’u elle birleştirmeyin. Metin birleştirerek JSON üretmek yukarıdaki hataların çoğunun kaynağıdır; her dilde mevcut olan serileştirme fonksiyonlarını kullanın — kaçırma işlemlerini onlar doğru yapar.`,
  },
  {
    slug: 'meta-etiketleri-2025-rehberi',
    title: 'Meta Etiketleri: Hangileri Hâlâ Önemli?',
    excerpt:
      'Onlarca meta etiketinden yalnızca birkaçı gerçekten sonuç değiştiriyor. Hangisinin ne işe yaradığını ve hangilerinin yok sayıldığını netleştiriyoruz.',
    date: '2025-01-30',
    readingTime: 10,
    category: 'SEO',
    tools: ['meta-tag-generator', 'opengraph-generator', 'schema-generator', 'slug-generator'],
    body: `Meta etiketleri konusunda dolaşan bilginin önemli bir kısmı on yıl öncesinden kalma. Bazı etiketler hâlâ doğrudan sonuç değiştiriyor, bazıları uzun süredir hiçbir işe yaramıyor, bazıları ise yanlış kullanıldığında sayfanızı arama sonuçlarından tamamen çıkarabiliyor.

Bu yazıda etiketleri üç gruba ayırıyoruz: gerçekten önemli olanlar, koşullu olanlar ve artık yok sayılanlar.

## Gerçekten önemli olanlar

### Title etiketi

Sayfa başına en çok fark yaratan tek etikettir. Hem sıralamada doğrudan kullanılır hem de arama sonucunda kullanıcının gördüğü tıklanabilir başlıktır.

Uzunluk konusunda karakter sayısı aslında yaklaşık bir ölçüdür; Google başlığı piksel genişliğine göre keser ve sınır 600 piksel civarındadır. Bu pratikte 55-60 karaktere denk gelir, ancak geniş harfler (M, W) dar harflerden (i, l) daha fazla yer kaplar. Türkçe metinlerde bu farkı hesaba katmak zordur, bu yüzden 55 karakteri güvenli hedef kabul edin.

Etkili bir başlık için:

- **Anahtar bilgiyi başa koyun.** Başlık kesilirse sondaki kaybolur, ayrıca kullanıcılar ilk kelimeleri okur.
- **Her sayfaya benzersiz bir başlık yazın.** Aynı başlığı taşıyan sayfalar birbirinin kopyası izlenimi verir.
- **Marka adını sona koyun**, ayraçla ayırarak. Ana sayfa dışında başa almak yer israfıdır.
- **Anahtar kelime yığmayın.** Birbiri ardına dizilmiş kelimeler tıklanma oranını düşürür ve Google başlığı kendi yazdığıyla değiştirebilir.

Son nokta önemli: Google, sayfanın gerçek içeriğiyle uyuşmadığını düşündüğü başlıkları arama sonuçlarında kendi ürettiği bir metinle değiştirir. Başlığınızın kullanılması, dürüst olmasına bağlıdır.

### Meta description

Doğrudan bir sıralama faktörü değildir — Google bunu açıkça belirtmiştir. Ama arama sonucunda başlığın altında görünen metin olduğu için tıklanma oranını belirler, o da performansı dolaylı olarak etkiler.

150-160 karakter arası idealdir. Açıklamayı sayfanın özeti gibi değil, sonuç listesindeki bir reklam metni gibi düşünün: kullanıcının aradığı şeyin bu sayfada olduğunu somut biçimde söylemeli.

Açıklama yazmazsanız Google sayfadan bir bölüm seçer. Bu bazen iyi sonuç verir, ama seçilen bölüm çoğu zaman çerez uyarısı veya menü metni olur.

### Canonical etiketi

Aynı içeriğe birden fazla adresten ulaşılabiliyorsa, hangisinin asıl adres olduğunu bu etiket bildirir.

Bu durum sanıldığından çok daha yaygındır. \`siteniz.com/urun\`, \`siteniz.com/urun?renk=mavi\`, \`siteniz.com/urun?utm_source=eposta\` — üçü de aynı sayfayı gösterir ama arama motoru için üç ayrı adrestir. Canonical olmadan sıralama gücü bu adresler arasında bölünür.

Kritik uyarı: canonical etiketini her sayfada aynı adrese yönlendirmeyin. Bu yaygın yapılandırma hatası, tüm sitenizin tek bir sayfa olarak değerlendirilmesine ve geri kalan sayfaların sonuçlardan düşmesine yol açar.

### Viewport etiketi

Teknik olarak bir SEO etiketi değildir ama etkisi doğrudandır. Bu etiket olmadan mobil tarayıcılar sayfayı masaüstü genişliğinde işleyip küçültür; sonuç, okunamayan bir sayfadır.

Google mobil öncelikli dizinleme kullandığı için sayfanızı mobil sürümüyle değerlendirir. Viewport etiketi eksikse sayfa mobil uyumsuz sayılır. Tek satırlık, tartışmasız gerekli bir eklemedir.

### Robots etiketi

Sayfanın dizine eklenip eklenmeyeceğini ve bağlantılarının takip edilip edilmeyeceğini belirler.

Bir sayfayı arama sonuçlarından çıkarmak istiyorsanız doğru araç budur — robots.txt değil. Aradaki fark kritiktir: robots.txt taramayı engeller, noindex ise dizine eklemeyi engeller. Bir sayfayı robots.txt ile engellerseniz robot sayfayı hiç okuyamaz, dolayısıyla içindeki noindex etiketini de göremez ve sayfa sonuçlarda kalmaya devam edebilir.

Doğru sıra: sayfayı taramaya açık bırakın, noindex ekleyin, Google okuyup düşürdükten sonra dilerseniz taramayı da engelleyin.

## Koşullu olanlar: sosyal paylaşım etiketleri

OpenGraph ve Twitter Card etiketleri sıralamayı etkilemez. Ama bağlantınız WhatsApp, LinkedIn veya X’te paylaşıldığında görünen kartı bunlar belirler.

Etiketler yoksa platform sayfadan rastgele bir metin ve görsel seçer; sonuç genellikle boş bir kutu ya da alakasız bir logodur. Tıklanma oranı farkı belirgindir, dolayısıyla içeriğinizin paylaşılmasını bekliyorsanız bu etiketler zorunlu sayılmalıdır.

Pratik notlar:

- Görsel için 1200×630 piksel kullanın; tüm büyük platformlarda düzgün görünen ölçü budur.
- Görsel adresini **mutlak** verin. Göreli adresler çoğu platformda çalışmaz.
- Platformlar önizlemeleri önbelleğe alır. Etiketi değiştirdikten sonra eski kart görünmeye devam ediyorsa, ilgili platformun hata ayıklama aracıyla bağlantıyı yeniden taratmanız gerekir.

[OpenGraph Oluşturucu](/tools/opengraph-generator/) bu etiketleri önizlemeyle birlikte üretir.

## Artık yok sayılanlar

**Meta keywords.** Google bu etiketi 2009’dan beri sıralamada kullanmadığını açıkça duyurdu. Sebebi basit: etiket tamamen site sahibinin kontrolündeydi ve kitlesel olarak kötüye kullanıldı. Eklemek zarar vermez ama hiçbir fayda da sağlamaz.

**Meta author, revisit-after, distribution, rating.** Hiçbiri arama motorları tarafından kullanılmıyor. \`revisit-after\` özellikle yaygın bir yanılgıdır; hiçbir arama motoru böyle bir talimatı hiç desteklemedi.

**Anahtar kelime yoğunluğu hedefleri.** Bir meta etiketi olmasa da aynı dönemden kalma bir alışkanlıktır. Google’ın açıkladığı bir hedef yoğunluk değeri yoktur ve aşırı tekrar bugün fayda değil spam sinyali üretir.

## Etiketlerin ötesi: yapılandırılmış veri

Meta etiketleri sayfa hakkında temel bilgi verir. Yapılandırılmış veri (JSON-LD) ise sayfadaki bilginin ne anlama geldiğini tarif eder: bu bir tarif mi, bir ürün mü, bir etkinlik mi; fiyatı, süresi, tarihi ne?

Somut karşılığı arama sonuçlarındaki zengin görünümlerdir — SSS açılır listeleri, ürün fiyatı, etkinlik tarihi. Ancak iki noktayı unutmayın: işaretleme zengin sonuç için önkoşuldur, garanti değildir; ve sayfada kullanıcının göremediği bilgiyi işaretlemek politika ihlalidir. [Schema Oluşturucu](/tools/schema-generator/) ile geçerli JSON-LD üretebilirsiniz.

## Kontrol listesi

Her sayfa için:

- Benzersiz, 55 karakteri aşmayan, anahtar bilgisi başta bir title.
- 150-160 karakter arası, tıklamayı hedefleyen bir description.
- Doğru adresi gösteren bir canonical.
- Viewport etiketi (site genelinde).
- OpenGraph başlık, açıklama ve 1200×630 görsel.
- İçerik tipine uygun JSON-LD işaretlemesi.

Bu altı madde, meta etiketlerinden alınabilecek faydanın neredeyse tamamını kapsar. Geri kalanı büyük ölçüde tarihî meraktır. [Meta Etiket Oluşturucu](/tools/meta-tag-generator/) ile bu setin tamamını karakter sayacıyla birlikte hazırlayabilirsiniz.`,
  },
  {
    slug: 'qr-kod-kullanim-alanlari',
    title: 'QR Kodların İşletmeler İçin 10 Kullanım Alanı',
    excerpt:
      'QR kod ucuz bir köprü ama her senaryoda işe yaramıyor. Gerçekten dönüşüm getiren kullanımları ve baskı öncesi teknik gereklilikleri ele alıyoruz.',
    date: '2025-01-18',
    readingTime: 9,
    category: 'Pazarlama',
    tools: ['qr-code-generator', 'qr-scanner', 'slug-generator'],
    body: `QR kod, fiziksel bir yüzey ile dijital bir içerik arasındaki en ucuz köprüdür: üretmesi bedava, basması bir mürekkep lekesi kadar maliyetli. Ama ucuz olması her yere konması gerektiği anlamına gelmiyor. Kodun işe yaraması, kullanıcının o anda telefonunu çıkarmak için bir sebebi olmasına bağlı.

Aşağıda gerçekten sonuç veren kullanım alanları ve baskıya göndermeden önce bilmeniz gereken teknik ayrıntılar var.

## Gerçekten işe yarayan on senaryo

**1. Dijital menü.** Restoranlarda en yaygın kullanım. Asıl faydası basılı menü maliyetinden tasarruf değil, fiyat ve stok değişikliğini anında yansıtabilmektir. Sezonluk menü değiştiren işletmelerde tek başına maliyeti karşılar.

**2. Wi-Fi paylaşımı.** Misafirlere uzun ve karışık parolayı yazdırmak yerine kodu okutmaları yeterlidir. QR kod içine ağ adı, şifreleme türü ve parolayı doğrudan gömebilirsiniz; telefon bağlantıyı kendisi kurar. Otel, kafe ve ofis resepsiyonlarında sürtünmeyi tamamen kaldırır.

**3. Etkinlik kaydı ve bilet.** Davetiye ya da afiş üzerindeki kod katılımcıyı doğrudan kayıt formuna götürür. Girişte okutulan biletlerde ise kod, doğrulamayı saniyeler içinde yapar.

**4. Ürün ambalajında kullanım kılavuzu.** Ambalaja on dile çevrilmiş kılavuz sığdırmak yerine kodla çevrimiçi kılavuza yönlendirmek hem yer kazandırır hem de kılavuzu güncellenebilir kılar. Kullanıcı, ürünü satın aldıktan sonra gerçekten ihtiyaç duyduğu anda okutur.

**5. Kartvizit.** vCard biçiminde bir kod, kişinin telefon, e-posta ve adres bilgilerini tek okutmayla rehbere ekler. Elle yazma adımını ortadan kaldırdığı için bilginin gerçekten kaydedilme oranını belirgin biçimde artırır.

**6. Fatura ve ödeme.** Fatura üzerindeki kod ödeme sayfasına yönlendirir. Tutar ve referans numarası önceden doldurulduğunda hem tahsilat hızlanır hem de yanlış tutar/eksik referans kaynaklı hatalar azalır.

**7. Vitrin ve tabela.** Kapalı bir dükkânın vitrinindeki kod, mesai dışında gelen müşteriyi çevrimiçi kataloğa yönlendirir. Kaçırılan ziyaretin bir kısmını geri kazanır.

**8. Ekipman bakım kaydı.** Makine veya cihaz üzerindeki kod, bakım geçmişi ve arıza bildirim formuna açılır. Teknisyenin sahada seri numarası aramasını ve elle kayıt tutmasını ortadan kaldırır.

**9. Müşteri geri bildirimi.** Kasa fişi veya masa üstündeki kod, kısa bir değerlendirme formuna yönlendirir. Kritik nokta, formun gerçekten kısa olmasıdır — üç sorudan uzun formlarda tamamlanma oranı hızla düşer.

**10. Basılı reklamdan ölçümlenebilir yönlendirme.** Basılı reklamın klasik zayıflığı ölçülememesidir. Kampanyaya özel bir adres ve etiketlenmiş bağlantı kullanan bir kod, hangi afişten kaç kişinin geldiğini görünür kılar.

## Ne zaman işe yaramaz?

Aynı ölçüde önemli olan, kodun kullanılmayacağı durumları bilmektir:

- **Hareket hâlindeki yüzeylerde.** Otobüs giydirmesi veya araç reklamı üzerindeki kod okutulamaz.
- **Erişilemeyecek yükseklikte.** Bina cephesindeki dev kod, telefon kamerasının odaklanamayacağı mesafededir.
- **Kullanıcının elinin dolu olduğu anlarda.** Market rafında iki elinde ürün taşıyan biri telefon çıkarmaz.
- **Zaten dijital ortamda.** Bir web sayfasına QR kod koymak anlamsızdır; kullanıcı zaten tıklayabilecek durumdadır.
- **Sebep verilmediğinde.** Kodun yanında ne olduğu yazmıyorsa okutulmaz. "Menü için okutun" ile çıplak bir kare arasındaki fark büyüktür.

## Baskı öncesi teknik gereklilikler

Sahada kod okutulamamasının sebepleri neredeyse her zaman aynı birkaç hatadır.

**Sessiz alan.** Kodun dört bir yanında, kodun bir modülünün (en küçük karesinin) yaklaşık dört katı genişliğinde boş bir çerçeve bırakılmalıdır. Tasarımcıların bu boşluğu "fazlalık" görüp kırpması, okuma başarısızlığının en yaygın sebebidir.

**Boyut.** Basılı kodun kenar uzunluğu için pratik kural: okuma mesafesinin onda biri. Masa üstünde 30 cm'den okunacak bir kod için 3 cm yeterlidir; iki metreden okunacak bir afiş kodunun 20 cm olması gerekir. Alt sınır olarak 2 cm'nin altına inmeyin.

**Kontrast.** Koyu kod, açık zemin. Bu sıralamayı tersine çevirmek (açık kod, koyu zemin) bazı okuyucularda çalışmaz. Kodu fotoğraf üzerine yerleştirmeyin; düz bir zemin kullanın.

**Hata düzeltme seviyesi.** QR standardı dört seviye sunar: L (%7), M (%15), Q (%25), H (%30). Yüzde, kodun ne kadarı zarar görse bile okunabileceğini gösterir. Ortasına logo koyacaksanız veya kod açık havada yıpranacaksa H seviyesini seçin. Ekranda görünecek temiz bir kod için M yeterlidir; daha yüksek seviye kodu gereksiz yere yoğunlaştırır.

**Baskı çözünürlüğü.** Kodu vektör (SVG) olarak alın veya en az 300 DPI'da basın. Ekran çözünürlüğünde bir PNG'yi büyüterek basmak modül kenarlarını bulanıklaştırır ve okuma hatasına yol açar.

## Statik ve dinamik kod farkı

Bu ayrım kararınızı doğrudan etkiler.

**Statik kod**, hedef adresi doğrudan desenin içine yazar. Aradan geçen bir servis yoktur, dolayısıyla süresi dolmaz, ücret gerektirmez ve kimse ölçüm yapamaz. Karşılığında adresi sonradan değiştiremezsiniz — kod basıldıktan sonra hedefi sabittir.

**Dinamik kod**, bir yönlendirme servisinin adresini içerir; asıl hedef panelden değiştirilebilir ve okuma sayısı ölçülebilir. Bedeli ise bağımlılıktır: servis kapanır ya da abonelik biterse basılmış tüm kodlarınız ölü bağlantıya döner.

Uzun ömürlü ve değişmeyecek hedefler için (Wi-Fi bilgisi, kartvizit, sabit menü adresi) statik kod kullanın. Kampanya ölçümü gereken durumlarda dinamik kodun riskini kabul edin — ya da ara yol olarak statik bir kodu kendi kontrolünüzdeki bir yönlendirme adresine yönlendirin. Böylece hem hedefi değiştirebilir hem de üçüncü bir servise bağımlı kalmazsınız.

[QR Kod Oluşturucu](/tools/qr-code-generator/) statik kod üretir: veri doğrudan desene yazılır, hiçbir aracı servis yoktur ve kod hiçbir zaman devre dışı kalmaz.

## Basmadan önce mutlaka test edin

Son ve en önemli adım. Kodu gerçek baskı boyutunda çıktı alın ve şu koşullarda deneyin:

- En az üç farklı telefonla (biri eski model olsun).
- Gerçek okuma mesafesinden.
- Kullanılacağı ortamın ışığında — özellikle loş restoran aydınlatması ve doğrudan güneş ışığı altında.

On bin adet basılmış bir broşürdeki okunmayan kod, baskı öncesi beş dakikalık testin karşılığıdır. [QR Kod Okuyucu](/tools/qr-scanner/) ile kodun içerdiği adresi de doğrulayabilirsiniz.`,
  },
];

export const postMap = new Map(posts.map((p) => [p.slug, p]));

export function getPost(slug: string) {
  return postMap.get(slug);
}

export function postsForTool(slug: string, limit = 3) {
  return posts.filter((p) => p.tools.includes(slug)).slice(0, limit);
}
