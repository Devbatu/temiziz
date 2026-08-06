import type { FaqItem } from './tools';

/**
 * Araç sayfalarının yazılı içeriği.
 *
 * `tools.ts` bir dizindir: her aracın adı, kategorisi ve arama anahtarları orada
 * durur. Sayfada okunan metin ise buradadır. İkisini ayırmanın sebebi şu: dizin
 * satırları kısa ve makine tarafından tüketiliyor (sitemap, arama, kategori),
 * metin ise uzun ve insan tarafından okunuyor. Aynı dosyada tutulunca dizin
 * gözden geçirilemez hale geliyordu.
 *
 * Buradaki alanlar yalnızca `tools.ts` içinde tanımlı DEĞİLSE devreye girer;
 * dizinde yazılmış bir `about` bu dosyadakinin önüne geçer.
 */
export interface ToolContent {
  /** Aracın ne yaptığını ve neden işe yaradığını anlatan giriş paragrafı. */
  about?: string;
  useCases?: string[];
  faq?: FaqItem[];
  /** Araca özgü kullanım adımları. */
  steps?: string[];
}

export const toolContent: Record<string, ToolContent> = {
  // ─────────────────────────────── PDF ───────────────────────────────
  'split-pdf': {
    about:
      'PDF Böl, tek bir belgeden istediğiniz sayfa aralığını ayrı dosya olarak çıkarmanızı sağlar. Sayfalar yeniden çizilmez; özgün metin katmanı, yazı tipleri ve görsel çözünürlüğü olduğu gibi korunur, dolayısıyla ayrılan bölüm kaynak belgeyle birebir aynı kalitede olur. Tüm işlem tarayıcınızın belleğinde yürür.',
    faq: [
      {
        q: 'Sayfa aralığını nasıl yazmalıyım?',
        a: 'Tek sayfa için “5”, aralık için “3-8”, birden fazla parça için “1-2, 7, 10-12” biçimini kullanabilirsiniz. Aralıklar belge sırasına göre değil, yazdığınız sırayla işlenir.',
      },
      {
        q: 'Bölünen dosyanın kalitesi düşer mi?',
        a: 'Hayır. Sayfalar yeniden sıkıştırılmaz, kaynak belgeden olduğu gibi kopyalanır. Çıkan dosyanın boyutu yalnızca içerdiği sayfa sayısı kadar küçülür.',
      },
      {
        q: 'Parolalı PDF’i bölebilir miyim?',
        a: 'Açılış parolası olan belgeleri bölmek için önce parolayı kaldırmanız gerekir. Yalnızca düzenleme kısıtlaması olan dosyalarda işlem sorunsuz çalışır.',
      },
    ],
    steps: [
      'PDF dosyanızı sürükleyip bırakın veya seçin.',
      'Ayırmak istediğiniz sayfa aralığını yazın (örn. 2-5).',
      '“Böl” düğmesine basıp çıkan dosyaları indirin.',
    ],
  },
  'compress-pdf': {
    about:
      'PDF Sıkıştır, belgenin boyutunu büyüten asıl unsuru — gömülü görselleri — yeniden örnekleyerek dosyayı küçültür. Metin katmanına ve yazı tiplerine dokunulmaz, bu yüzden belge sıkıştırıldıktan sonra da aranabilir ve seçilebilir kalır. E-posta eklerinde sık karşılaşılan 10 MB ve 25 MB sınırlarının altına inmek için tasarlanmıştır.',
    useCases: [
      'E-posta eki boyut sınırına takılan sözleşme ve teklifleri göndermek',
      'Taranmış kimlik, diploma veya fatura yüklemelerinde başvuru formlarının boyut limitini karşılamak',
      'Görsel ağırlıklı sunum ve katalogları web sitesinde yayımlanabilir hale getirmek',
    ],
    faq: [
      {
        q: 'Sıkıştırma sonrası metin seçilebilir kalır mı?',
        a: 'Evet. Yalnızca görseller yeniden örneklenir; metin katmanı ve yazı tipleri değiştirilmediği için belge aranabilir ve kopyalanabilir kalır.',
      },
      {
        q: 'Dosyam ne kadar küçülür?',
        a: 'Kazanç, belgenin içeriğine bağlıdır. Fotoğraf veya tarama ağırlıklı belgelerde %50-80 küçülme olağandır; ağırlıklı olarak metinden oluşan bir belgede kazanç sınırlı kalır çünkü metin zaten çok az yer kaplar.',
      },
      {
        q: 'Baskı kalitesi bozulur mu?',
        a: 'Ekranda okunacak belgeler için varsayılan ayar yeterlidir. Matbaa baskısı planlıyorsanız 300 DPI altına inen bir sıkıştırma önerilmez; bu durumda daha düşük bir sıkıştırma seviyesi seçin.',
      },
    ],
    steps: [
      'Küçültmek istediğiniz PDF’i yükleyin.',
      'Sıkıştırma seviyesini seçin; kuşkulandığınızda dengeli seçenekle başlayın.',
      'Sonucu indirmeden önce boyut farkını ve önizlemeyi kontrol edin.',
    ],
  },
  'rotate-pdf': {
    about:
      'PDF Döndür, yanlış yönde taranmış veya yatay hazırlanmış sayfaları kalıcı olarak çevirir. Görüntüleyicideki geçici döndürme düğmesinden farkı şudur: burada yapılan değişiklik dosyanın kendisine yazılır, dolayısıyla belgeyi kim açarsa açsın ve nereye yüklenirse yüklensin sayfalar doğru yönde görünür.',
    useCases: [
      'Otomatik besleyicili tarayıcıdan ters çıkan sayfaları düzeltmek',
      'Yatay hazırlanmış tablo ve çizimleri dikey bir rapora eklemeden önce hizalamak',
      'Telefonla çekilip PDF’e çevrilmiş belgelerin yönünü sabitlemek',
    ],
    faq: [
      {
        q: 'Yalnızca belirli sayfaları döndürebilir miyim?',
        a: 'Evet. Sayfaları tek tek seçebilir veya bir aralık belirterek yalnızca o sayfaları çevirebilirsiniz; diğerleri olduğu gibi kalır.',
      },
      {
        q: 'Döndürme kalıcı mı?',
        a: 'Evet. Yön bilgisi dosyaya yazılır; belgeyi başka bir bilgisayarda veya telefonda açtığınızda da aynı şekilde görünür.',
      },
      {
        q: 'Dosya boyutu değişir mi?',
        a: 'Hayır denecek kadar az. Sayfa içeriği yeniden işlenmez, yalnızca yön özelliği güncellenir.',
      },
    ],
    steps: [
      'PDF’i yükleyip sayfa önizlemelerini görün.',
      'Döndürmek istediğiniz sayfaları seçin ve 90°, 180° veya 270° uygulayın.',
      'Değişikliği kaydedip yeni dosyayı indirin.',
    ],
  },
  'jpg-to-pdf': {
    about:
      'JPG’den PDF’e aracı, tek tek duran görselleri sırası belli tek bir belgeye dönüştürür. Bunun pratik değeri şudur: çoğu kurum, başvuru ve e-posta akışı birden fazla fotoğraf yerine tek PDF bekler. Araç her görseli seçtiğiniz sayfa boyutuna yerleştirir, en boy oranını bozmadan ölçekler ve kenar boşluklarını eşitler.',
    useCases: [
      'Telefonla çekilmiş belge fotoğraflarını tek dosyada resmî başvuruya eklemek',
      'Fatura veya fiş fotoğraflarını muhasebeye tek belge olarak iletmek',
      'Ürün fotoğraflarından basit bir katalog PDF’i hazırlamak',
    ],
    faq: [
      {
        q: 'Hangi görsel biçimlerini yükleyebilirim?',
        a: 'JPG ve JPEG’in yanı sıra PNG ve WebP dosyaları da kabul edilir. Farklı biçimleri aynı belgede karıştırabilirsiniz.',
      },
      {
        q: 'Sayfa sırasını belirleyebilir miyim?',
        a: 'Evet. Görseller listeye eklendikten sonra sürükleyerek sıralayabilirsiniz; belge bu sırayla oluşturulur.',
      },
      {
        q: 'Görsel kalitesi düşer mi?',
        a: 'Görseller sayfaya yerleştirilirken yeniden sıkıştırılmaz. Yalnızca seçtiğiniz sayfa boyutundan büyük görseller sayfaya sığacak şekilde ölçeklenir.',
      },
    ],
    steps: [
      'Görselleri yükleyin ve istediğiniz sayfa sırasına dizin.',
      'Sayfa boyutunu (A4, Letter) ve kenar boşluğunu seçin.',
      'PDF’i oluşturup indirin.',
    ],
  },

  // ────────────────────────────── Görsel ─────────────────────────────
  'image-compressor': {
    faq: [
      {
        q: 'Hangi kalite değerini seçmeliyim?',
        a: '%75-85 aralığı fotoğrafların büyük çoğunluğunda gözle fark edilmeyen bir kayıpla belirgin boyut kazancı verir. Keskin kenarlı grafiklerde ve ekran görüntülerinde daha yüksek bir değer tercih edin, çünkü bu tür görsellerde sıkıştırma izleri daha çabuk belli olur.',
      },
      {
        q: 'Görselim sunucuya yükleniyor mu?',
        a: 'Hayır. Sıkıştırma tarayıcınızın canvas motoruyla cihazınızda yapılır; dosya hiçbir sunucuya gönderilmez.',
      },
      {
        q: 'Şeffaflık korunur mu?',
        a: 'PNG ve WebP çıktılarında şeffaf arka plan korunur. JPEG biçimi şeffaflığı desteklemediği için bu biçime dönüştürdüğünüzde şeffaf alanlar beyaza döner.',
      },
    ],
    steps: [
      'Görselinizi sürükleyip bırakın.',
      'Kalite değerini ayarlayıp önizlemedeki değişimi izleyin.',
      'Kazandığınız boyutu görün ve sıkıştırılmış dosyayı indirin.',
    ],
  },
  'image-resizer': {
    about:
      'Görsel Boyutlandırma, bir görselin piksel ölçülerini değiştirir. Sıkıştırmadan farkı önemlidir: sıkıştırma dosyanın ağırlığını azaltır, boyutlandırma ise görselin gerçek genişlik ve yüksekliğini değiştirir. 4000 piksellik bir fotoğrafı 800 piksellik bir alanda göstermek ziyaretçiye gereksiz veri indirtir; doğru çözüm görseli baştan hedef ölçüye indirmektir.',
    useCases: [
      'Web sayfasında kullanılacak görselleri gerçek gösterim genişliğine indirmek',
      'Sosyal medya profil ve kapak görsellerini platformun istediği ölçüye getirmek',
      'Yükleme formlarının dayattığı maksimum piksel sınırını karşılamak',
    ],
    faq: [
      {
        q: 'En boy oranı korunur mu?',
        a: 'Varsayılan olarak evet; yalnızca genişliği yazdığınızda yükseklik orantılı hesaplanır. Oranı kilidi açarak serbest de girebilirsiniz, ancak bu görselin gerilmesine yol açar.',
      },
      {
        q: 'Görseli büyütebilir miyim?',
        a: 'Teknik olarak evet, fakat küçük bir görseli büyütmek olmayan ayrıntıyı geri getirmez; sonuç bulanıklaşır. Mümkün olduğunda kaynağın yüksek çözünürlüklü hâlinden başlayın.',
      },
      {
        q: 'Toplu boyutlandırma yapabilir miyim?',
        a: 'Birden fazla görseli aynı anda yükleyip hepsine aynı hedef ölçüyü uygulayabilirsiniz.',
      },
    ],
    steps: [
      'Görseli yükleyin; mevcut ölçüleri otomatik görünür.',
      'Hedef genişlik veya yüksekliği girin, oran kilidini ihtiyacınıza göre ayarlayın.',
      'Yeniden boyutlandırılmış görseli indirin.',
    ],
  },
  'image-converter': {
    about:
      'Görsel Dönüştürücü, bir görseli JPG, PNG ve WebP biçimleri arasında çevirir. Biçim seçimi keyfi değildir: PNG kayıpsızdır ve şeffaflığı destekler, bu yüzden logo ve arayüz öğeleri için uygundur; JPG fotoğraflarda çok daha küçük dosya üretir; WebP ise aynı görsel kalitede JPG’ye göre ortalama dörtte bir daha az yer kaplar ve günümüzdeki tüm güncel tarayıcılarda desteklenir.',
    useCases: [
      'Site hızını artırmak için JPG ve PNG görselleri WebP’ye çevirmek',
      'WebP kabul etmeyen eski sistem ve belge şablonları için JPG üretmek',
      'Şeffaf arka plan gerektiren tasarım öğelerini PNG’ye dönüştürmek',
    ],
    faq: [
      {
        q: 'WebP mi JPG mi kullanmalıyım?',
        a: 'Web sitesi için WebP’yi tercih edin; belirgin biçimde daha küçük dosya üretir. Dosyayı bir başkasına gönderecekseniz veya eski bir yazılıma yükleyecekseniz JPG daha güvenli bir ortak paydadır.',
      },
      {
        q: 'PNG’den JPG’ye çevirince ne kaybederim?',
        a: 'Şeffaflığı. JPG şeffaf alan tutamaz, bu bölgeler düz bir arka plan rengiyle doldurulur. Ayrıca JPG kayıplı bir biçimdir, keskin kenarlarda hafif bozulma görülebilir.',
      },
      {
        q: 'EXIF bilgileri korunur mu?',
        a: 'Dönüştürme sırasında konum ve cihaz bilgisi gibi EXIF verileri çıkarılır. Görseli herkese açık paylaşacaksanız bu gizlilik açısından bir avantajdır.',
      },
    ],
    steps: [
      'Dönüştürmek istediğiniz görseli yükleyin.',
      'Hedef biçimi (WebP, JPG, PNG) ve kalite değerini seçin.',
      'Dönüştürülmüş dosyayı indirin.',
    ],
  },
  'crop-image': {
    about:
      'Görsel Kırpma, bir görselin yalnızca ihtiyaç duyduğunuz bölümünü ayırır. Kırpmanın iki ayrı faydası vardır: çerçevedeki gereksiz alanı atarak asıl konuyu öne çıkarır ve görselin en boy oranını hedef alana tam oturtur. Sabit oran seçenekleri (1:1, 16:9, 4:3) sayesinde profil fotoğrafı ya da kapak görseli hazırlarken ölçü hesabı yapmanız gerekmez.',
    useCases: [
      'Kare profil fotoğrafı için yüzü ortalayarak 1:1 kırpmak',
      'Ekran görüntüsünden yalnızca ilgili arayüz bölümünü ayırmak',
      'Ürün fotoğraflarını mağaza şablonunun istediği orana getirmek',
    ],
    faq: [
      {
        q: 'Kırpma görsel kalitesini düşürür mü?',
        a: 'Hayır. Kalan bölge özgün piksellerini korur; yalnızca dışarıda kalan alan atıldığı için dosya boyutu küçülür.',
      },
      {
        q: 'Sabit oranla nasıl kırparım?',
        a: 'Oran listesinden 1:1, 4:3 veya 16:9 seçin. Seçim yaptığınızda kırpma çerçevesi bu orana kilitlenir ve sürüklerken oran bozulmaz.',
      },
      {
        q: 'Kırptıktan sonra geri alabilir miyim?',
        a: 'İndirmeden önce çerçeveyi istediğiniz kadar değiştirebilirsiniz. Özgün dosyanız değiştirilmez; araç her zaman yeni bir kopya üretir.',
      },
    ],
    steps: [
      'Görseli yükleyin.',
      'Kırpma çerçevesini sürükleyin veya hazır bir en boy oranı seçin.',
      'Kırpılmış görseli indirin.',
    ],
  },
  'blur-image': {
    about:
      'Görsel Bulanıklaştırma, bir fotoğrafın seçtiğiniz bölgesini okunamaz hale getirir. Asıl kullanım amacı estetik değil gizliliktir: ekran görüntüsü veya belge fotoğrafı paylaşırken ad, adres, hesap numarası ya da yüz gibi kişisel verilerin görünmesini engeller. Bulanıklık doğrudan görsel verisine uygulanır, yani üzerine konan bir katman değildir ve kaldırılamaz.',
    useCases: [
      'Ekran görüntüsündeki e-posta adresi, telefon ve hesap numaralarını gizlemek',
      'Paylaşılacak fotoğraflarda üçüncü kişilerin yüzlerini tanınmaz hale getirmek',
      'Destek talebine eklenecek belgede hassas alanları kapatmak',
    ],
    faq: [
      {
        q: 'Bulanıklaştırılan yazı geri okunabilir mi?',
        a: 'Yeterli yoğunlukta uygulandığında hayır; piksel verisi kalıcı olarak değiştirilir. Yine de çok düşük bir bulanıklık seviyesi kısa metinlerde tahmin edilebilir kalabilir, bu yüzden hassas bilgilerde yüksek seviye kullanın.',
      },
      {
        q: 'Tüm görseli mi bulanıklaştırmam gerekiyor?',
        a: 'Hayır. Yalnızca seçtiğiniz dikdörtgen alanlara uygulanır; birden fazla bölge işaretleyebilirsiniz.',
      },
      {
        q: 'Görselim yüklenip saklanıyor mu?',
        a: 'Hayır. İşlem tarayıcınızda yapılır. Gizlilik amaçlı bir araçta bunun tersi zaten anlamsız olurdu.',
      },
    ],
    steps: [
      'Görseli yükleyin.',
      'Gizlemek istediğiniz alanların üzerine dikdörtgen çizin ve bulanıklık seviyesini ayarlayın.',
      'Sonucu kontrol edip indirin.',
    ],
  },
  'watermark-image': {
    about:
      'Filigran Ekleme, görsellerinize metin ya da logo tabanlı bir işaret yerleştirir. Filigranın işlevi izinsiz kullanımı teknik olarak engellemek değil, görselin kaynağını görselin kendisine bağlamaktır; böylece dosya kopyalanıp yeniden yayımlandığında da kime ait olduğu görünür kalır. Konum, saydamlık ve boyut ayarlarıyla işaretin içeriği örtmeden fark edilir olmasını sağlayabilirsiniz.',
    useCases: [
      'Portfolyo ve ürün fotoğraflarına marka adı eklemek',
      'Taslak olarak paylaşılan görselleri “ÖRNEK” ibaresiyle işaretlemek',
      'Fotoğrafçılık işlerinde teslim öncesi önizleme kopyaları üretmek',
    ],
    faq: [
      {
        q: 'Logo ile filigran ekleyebilir miyim?',
        a: 'Evet. Metin yerine PNG bir logo yükleyebilirsiniz; şeffaf arka planlı bir dosya kullanmak en temiz sonucu verir.',
      },
      {
        q: 'Saydamlık kaç olmalı?',
        a: '%25-40 aralığı genelde dengeli sonuç verir: işaret okunur ama görselin içeriğini bastırmaz. Koyu görsellerde açık renkli, açık görsellerde koyu renkli bir filigran seçin.',
      },
      {
        q: 'Filigran kaldırılabilir mi?',
        a: 'İşaret görselin piksellerine işlenir, ayrı bir katman olarak durmaz. Bu da kaldırılmasını zorlaştırır ancak imkânsız kılmaz; telif koruması için tek başına yeterli sayılmamalıdır.',
      },
    ],
    steps: [
      'Görselinizi yükleyin.',
      'Filigran metnini yazın veya logo dosyanızı ekleyin; konum, boyut ve saydamlığı ayarlayın.',
      'İşaretlenmiş görseli indirin.',
    ],
  },
  'meme-generator': {
    about:
      'Mizah Görseli Oluşturucu, bir görselin üstüne ve altına klasik beyaz-konturlu yazı yerleştirir. Bu görünüm bir tercih değil, okunabilirlik çözümüdür: siyah kontur sayesinde yazı hem açık hem koyu arka planlarda seçilebilir kalır. Yazı boyutu, konumu ve satır sayısı ayarlanabilir; çıktı doğrudan paylaşılabilecek bir PNG dosyasıdır.',
    useCases: [
      'Sosyal medya paylaşımları için hızlı görsel içerik üretmek',
      'Sunum ve eğitim materyallerine açıklayıcı yazılı görsel eklemek',
      'Topluluk ve ekip içi iletişimde esprili görsel hazırlamak',
    ],
    faq: [
      {
        q: 'Kendi görselimi kullanabilir miyim?',
        a: 'Evet. Herhangi bir JPG veya PNG dosyasını yükleyip üzerine yazı ekleyebilirsiniz.',
      },
      {
        q: 'Türkçe karakterler düzgün görünüyor mu?',
        a: 'Evet. Ş, ğ, İ, ı ve diğer Türkçe karakterler doğru işlenir.',
      },
      {
        q: 'Telif hakkına dikkat etmeli miyim?',
        a: 'Evet. Başkasına ait bir fotoğrafı kullanırken kaynağın kullanım koşullarına uymak sizin sorumluluğunuzdadır; kendi çektiğiniz ya da lisansı uygun görselleri tercih edin.',
      },
    ],
    steps: [
      'Bir görsel yükleyin.',
      'Üst ve alt yazıları girin, yazı boyutunu ayarlayın.',
      'Görseli PNG olarak indirin.',
    ],
  },

  // ─────────────────────────────── SEO ───────────────────────────────
  'meta-tag-generator': {
    about:
      'Meta Etiket Oluşturucu, bir sayfanın arama sonuçlarında ve sosyal medyada nasıl görüneceğini belirleyen HTML etiketlerini üretir. Etiketlerin hepsi eşit ağırlıkta değildir: title etiketi hem sıralamayı hem tıklanmayı doğrudan etkiler, meta description sıralama faktörü olmasa da sonuç listesindeki tıklanma oranını belirler, meta keywords ise Google tarafından uzun süredir yok sayılır. Araç bu ayrımı gözeterek gereken etiketleri hazırlar.',
    useCases: [
      'Yeni yayımlanacak sayfalar için title ve description etiketlerini hazırlamak',
      'Karakter sınırlarını aşan başlıkları kesilmeden önce düzeltmek',
      'Canonical ve robots etiketlerini elle yazmadan doğru biçimde üretmek',
    ],
    faq: [
      {
        q: 'Title etiketi kaç karakter olmalı?',
        a: 'Google başlıkları yaklaşık 580 piksel genişliğe kadar gösterir; bu pratikte 55-60 karaktere denk gelir. Daha uzun başlıklar sonuç sayfasında kesilir, bu yüzden anahtar bilgiyi başa koyun.',
      },
      {
        q: 'Meta description sıralamayı etkiler mi?',
        a: 'Doğrudan bir sıralama faktörü değildir. Ancak arama sonucunda kullanıcının gördüğü metin olduğu için tıklanma oranını belirler, o da dolaylı olarak performansı etkiler. 150-160 karakter arası idealdir.',
      },
      {
        q: 'Meta keywords eklemeli miyim?',
        a: 'Gerekmez. Google 2009’dan bu yana bu etiketi sıralamada kullanmadığını açıkça belirtiyor. Eklemek zarar vermez ama fayda da sağlamaz.',
      },
    ],
    steps: [
      'Sayfa başlığını, açıklamasını ve adresini girin.',
      'Karakter sayacına bakarak metinleri önerilen sınırlar içine çekin.',
      'Üretilen HTML bloğunu kopyalayıp sayfanızın <head> bölümüne yapıştırın.',
    ],
  },
  'schema-generator': {
    about:
      'Schema (JSON-LD) Oluşturucu, sayfanızdaki bilgiyi arama motorlarının makine olarak okuyabileceği yapılandırılmış veriye çevirir. Bunun somut karşılığı arama sonuçlarındaki zengin görünümlerdir: yıldızlı değerlendirme, SSS açılır listesi, tarif süresi, etkinlik tarihi. Araç geçerli JSON-LD üretir, ancak zengin sonucun görünmesi her zaman Google’ın kararına bağlıdır.',
    useCases: [
      'İşletme sayfası için LocalBusiness verisi hazırlamak',
      'Blog yazılarına Article ve BreadcrumbList işaretlemesi eklemek',
      'SSS bölümü olan sayfalara FAQPage işaretlemesi tanımlamak',
    ],
    faq: [
      {
        q: 'JSON-LD kodunu nereye eklemeliyim?',
        a: 'Sayfanın <head> bölümüne <script type="application/ld+json"> etiketi içinde ekleyin. Body içine koymak da geçerlidir ancak head daha yaygın ve güvenli tercihtir.',
      },
      {
        q: 'İşaretleme eklersem zengin sonuç garanti mi?',
        a: 'Hayır. Yapılandırılmış veri zengin sonuç için bir önkoşuldur, garanti değildir. Google sayfanın kalitesine ve sorguya göre gösterip göstermemeye karar verir.',
      },
      {
        q: 'Sayfada olmayan bilgiyi işaretleyebilir miyim?',
        a: 'Hayır. Kullanıcının sayfada göremediği bilgiyi işaretlemek Google’ın yapılandırılmış veri politikalarına aykırıdır ve manuel işleme yol açabilir.',
      },
    ],
    steps: [
      'İşaretleme türünü seçin (Article, FAQPage, LocalBusiness…).',
      'İlgili alanları doldurun.',
      'Üretilen JSON-LD kodunu kopyalayıp sayfanıza ekleyin.',
    ],
  },
  'opengraph-generator': {
    about:
      'OpenGraph Etiket Oluşturucu, bağlantınız WhatsApp, LinkedIn, Facebook veya X üzerinde paylaşıldığında görünecek başlık, açıklama ve görseli belirleyen etiketleri üretir. Bu etiketler tanımlanmazsa platformlar sayfadan rastgele bir metin ve görsel seçer; sonuç genellikle boş bir kutu ya da alakasız bir resim olur ve tıklanma oranı belirgin biçimde düşer.',
    useCases: [
      'Blog yazılarının sosyal medyada düzgün önizlemeyle paylaşılmasını sağlamak',
      'Kampanya sayfaları için özel paylaşım görseli tanımlamak',
      'X (Twitter) kartlarını büyük görselli biçimde ayarlamak',
    ],
    faq: [
      {
        q: 'OG görseli hangi ölçüde olmalı?',
        a: '1200×630 piksel (1,91:1 oranı) tüm büyük platformlarda sorunsuz görünen ölçüdür. Daha küçük görseller küçük kart biçiminde gösterilir, çok büyük dosyalar ise bazı platformlarda hiç yüklenmez.',
      },
      {
        q: 'Twitter için ayrı etiket gerekir mi?',
        a: 'X, OpenGraph etiketlerini de okur; ancak twitter:card etiketini eklemek büyük görselli kart görünümünü garanti eder. Araç ikisini birlikte üretir.',
      },
      {
        q: 'Görseli değiştirdim ama önizleme eski görünüyor.',
        a: 'Platformlar önizlemeleri önbelleğe alır. Facebook Sharing Debugger veya LinkedIn Post Inspector gibi araçlarla bağlantıyı yeniden taratmanız gerekir.',
      },
    ],
    steps: [
      'Sayfa başlığı, açıklaması, adresi ve görsel bağlantısını girin.',
      'Önizlemede kartın nasıl görüneceğini kontrol edin.',
      'Etiketleri kopyalayıp sayfanızın <head> bölümüne ekleyin.',
    ],
  },
  'keyword-density-checker': {
    about:
      'Anahtar Kelime Yoğunluğu aracı, bir metinde hangi kelime ve kelime öbeklerinin ne sıklıkta geçtiğini sayar. Bu ölçüm bir sıralama hedefi değil, bir teşhis aracıdır: metnin gerçekten konusu hakkında mı yazıldığını, yoksa aynı ifadenin doğal olmayan biçimde mi tekrarlandığını gösterir. Aşırı tekrar bugün fayda sağlamaz, spam sinyali üretir.',
    useCases: [
      'Yazının hedeflenen konuyu gerçekten kapsayıp kapsamadığını doğrulamak',
      'Devralınan eski içeriklerde aşırı anahtar kelime tekrarını tespit etmek',
      'Rakip metinlerdeki baskın kelime öbeklerini çıkarmak',
    ],
    faq: [
      {
        q: 'İdeal anahtar kelime yoğunluğu kaçtır?',
        a: 'Google’ın açıkladığı bir hedef değer yoktur. Pratikte %1-2 aralığı doğal yazılmış metinlerde kendiliğinden ortaya çıkar. Bir sayıyı tutturmaya çalışmak yerine metnin akıcı okunmasına odaklanın.',
      },
      {
        q: 'İki ve üç kelimelik öbekleri de görüyor muyum?',
        a: 'Evet. Tek kelimelerin yanında iki ve üç kelimelik öbeklerin sıklığı da listelenir; asıl faydalı sinyal genelde buradadır.',
      },
      {
        q: 'Bağlaçlar ve edatlar sayıma dahil mi?',
        a: '“ve”, “ile”, “bir” gibi çok sık geçen işlev kelimeleri liste anlamlı kalsın diye ayıklanır.',
      },
    ],
    steps: [
      'Metni kutuya yapıştırın veya sayfa adresini girin.',
      'Tekli ve çoklu kelime öbeklerinin sıklık listesini inceleyin.',
      'Doğal olmayan tekrarları metinde düzeltin.',
    ],
  },
  'robots-txt-generator': {
    about:
      'robots.txt Oluşturucu, arama motoru robotlarının sitenizde nereleri tarayabileceğini bildiren dosyayı hazırlar. Yaygın bir yanlış anlamayı baştan belirtmek gerekir: robots.txt tarama kontrolüdür, gizlilik ya da dizine ekleme kontrolü değildir. Engellenen bir adres başka sayfalardan bağlantı alıyorsa yine de arama sonuçlarında görünebilir; dizinden çıkarmak için noindex kullanılır.',
    useCases: [
      'Yönetim paneli ve arama sonucu sayfalarını taramadan çıkarmak',
      'Sitemap adresini robotlara bildirmek',
      'Belirli botlar için ayrı tarama kuralları tanımlamak',
    ],
    faq: [
      {
        q: 'robots.txt dosyası nereye konur?',
        a: 'Alan adının kök dizinine, yani https://siteniz.com/robots.txt adresine. Alt klasörlerdeki dosyalar dikkate alınmaz.',
      },
      {
        q: 'Disallow ile noindex farkı nedir?',
        a: 'Disallow robotun sayfayı taramasını engeller; noindex ise sayfanın arama sonuçlarına eklenmesini engeller. Bir sayfayı sonuçlardan çıkarmak istiyorsanız robots.txt ile engellemeyin — çünkü engellerseniz robot noindex etiketini okuyamaz.',
      },
      {
        q: 'Her siteye robots.txt gerekir mi?',
        a: 'Zorunlu değildir. Dosya yoksa robotlar her yeri tarayabilir varsayar. Yine de sitemap adresini bildirmek için eklemek faydalıdır.',
      },
    ],
    steps: [
      'İzin verilecek ve engellenecek yolları belirtin.',
      'Sitemap adresinizi ekleyin.',
      'Üretilen dosyayı indirip sitenizin kök dizinine yükleyin.',
    ],
  },
  'sitemap-generator': {
    about:
      'Sitemap Oluşturucu, sitenizdeki adresleri arama motorlarına toplu olarak bildiren XML dosyasını üretir. Site haritası sıralama avantajı sağlamaz; işlevi keşfedilebilirliktir. Özellikle iç bağlantısı zayıf, yeni yayımlanmış ya da çok sayıda sayfası olan sitelerde robotların hiçbir adresi atlamamasını sağlar.',
    useCases: [
      'Yeni kurulan bir siteyi Search Console’a hızlıca tanıtmak',
      'Yayımlanan yeni sayfaların keşfini hızlandırmak',
      'İç bağlantısı olmayan kampanya sayfalarını robotlara bildirmek',
    ],
    faq: [
      {
        q: 'Sitemap dosyasını nasıl bildiririm?',
        a: 'İki yol vardır: robots.txt içine “Sitemap: https://siteniz.com/sitemap.xml” satırını eklemek ve Google Search Console’un Site Haritaları bölümünden göndermek. İkisini birden yapmak en sağlıklısıdır.',
      },
      {
        q: 'Bir sitemap kaç adres içerebilir?',
        a: 'Tek dosyada en fazla 50.000 adres ve 50 MB sınırı vardır. Daha büyük siteler birden fazla dosya üretip bunları bir sitemap dizininde toplar.',
      },
      {
        q: 'lastmod tarihi önemli mi?',
        a: 'Evet, ancak doğru olması şartıyla. Her sayfaya bugünün tarihini yazmak sinyali değersizleştirir; gerçekten güncellenen sayfalarda güncel tarih kullanın.',
      },
    ],
    steps: [
      'Site adresinizi ve dahil edilecek sayfaları girin.',
      'Değişim sıklığı ve öncelik değerlerini ayarlayın.',
      'XML dosyasını indirip kök dizine yükleyin ve Search Console’a bildirin.',
    ],
  },
  'slug-generator': {
    about:
      'Slug Oluşturucu, bir başlığı adres satırında kullanılabilecek temiz bir biçime çevirir. Türkçe metinlerde bu işlem özel dikkat gerektirir: ş, ğ, ü, ö, ç ve özellikle noktalı İ harfi doğrudan URL’de kullanıldığında yüzde işaretli kaçış dizilerine dönüşür ve adres hem okunmaz hem paylaşılmaz hale gelir. Araç bu harfleri ASCII karşılıklarına çevirir, boşlukları tire yapar ve tekrar eden ayraçları temizler.',
    useCases: [
      'Blog yazısı başlıklarından okunabilir URL üretmek',
      'Ürün adlarını mağaza adres yapısına uygun hale getirmek',
      'Dosya adlarını sunucuya yüklemeden önce güvenli biçime çevirmek',
    ],
    faq: [
      {
        q: 'Türkçe karakterler nasıl dönüştürülüyor?',
        a: 'ş→s, ğ→g, ü→u, ö→o, ç→c, ı→i ve İ→i biçiminde ASCII karşılıklarına çevrilir. Bu, adresin her sistemde aynı görünmesini sağlar.',
      },
      {
        q: 'Slug ne kadar uzun olmalı?',
        a: 'Kısa ve anlamlı olması yeterlidir; 3-6 kelime çoğu durumda idealdir. Başlığın tamamını slug’a taşımak gereksizdir.',
      },
      {
        q: 'Yayımlanmış bir sayfanın slug’ını değiştirebilir miyim?',
        a: 'Değiştirebilirsiniz ama eski adresten yenisine 301 yönlendirme kurmadan yapmayın; aksi halde mevcut bağlantılar ve arama sıralaması kaybolur.',
      },
    ],
    steps: [
      'Başlığı veya metni kutuya yazın.',
      'Ayraç tercihini ve küçük harfe çevirme seçeneğini ayarlayın.',
      'Üretilen slug’ı kopyalayın.',
    ],
  },

  // ───────────────────────────── Geliştirici ─────────────────────────
  'json-formatter': {
    faq: [
      {
        q: 'Çok büyük JSON dosyalarını işleyebilir mi?',
        a: 'Birkaç megabaytlık dosyalar sorunsuz işlenir. İşlem tarayıcıda çalıştığı için üst sınır cihazınızın belleğidir; çok büyük dosyalarda sayfa yavaşlayabilir.',
      },
      {
        q: 'Verim sunucuya gönderiliyor mu?',
        a: 'Hayır. Ayrıştırma ve biçimlendirme tamamen tarayıcınızda yapılır. API yanıtları ve token içeren veriler cihazınızdan çıkmaz.',
      },
      {
        q: 'Girinti boyutunu değiştirebilir miyim?',
        a: 'Evet. 2 veya 4 boşluk seçebilir, ayrıca tüm boşlukları kaldıran sıkıştırılmış (minify) çıktı da alabilirsiniz.',
      },
    ],
    steps: [
      'JSON metnini kutuya yapıştırın.',
      'Girinti biçimini seçin; hata varsa satır numarasıyla gösterilir.',
      'Biçimlendirilmiş çıktıyı kopyalayın veya indirin.',
    ],
  },
  'json-validator': {
    about:
      'JSON Doğrulayıcı, bir metnin geçerli JSON olup olmadığını denetler ve değilse hatanın tam olarak hangi satır ve karakterde başladığını gösterir. Pratikteki değeri budur: JSON hataları neredeyse her zaman aynı birkaç sebepten kaynaklanır — sondaki fazladan virgül, çift yerine tek tırnak, tırnaksız anahtar veya standartta yeri olmayan yorum satırı — ve hatanın yerini görmek çözümü saniyeler meselesi yapar.',
    useCases: [
      'API yanıtının bozuk olup olmadığını hızlıca ayırt etmek',
      'Yapılandırma dosyalarını dağıtım öncesi denetlemek',
      'Elle düzenlenen büyük JSON verilerinde sözdizimi hatası aramak',
    ],
    faq: [
      {
        q: 'JSON’da yorum satırı kullanabilir miyim?',
        a: 'Hayır. JSON standardında yorum yoktur; // veya /* */ eklerseniz dosya geçersiz olur. Yoruma ihtiyacınız varsa JSON5 ya da YAML gibi bir biçim düşünün.',
      },
      {
        q: 'Sondaki virgül neden hata veriyor?',
        a: 'JavaScript nesne değişmezlerinde son öğeden sonra virgül bırakmak serbesttir, JSON’da ise sözdizimi hatasıdır. En sık karşılaşılan JSON hatası budur.',
      },
      {
        q: 'Şemaya göre doğrulama yapıyor mu?',
        a: 'Bu araç sözdizimi doğrulaması yapar; alanların beklenen türde olup olmadığını denetleyen JSON Schema doğrulaması ayrı bir işlemdir.',
      },
    ],
    steps: [
      'Denetlemek istediğiniz JSON’u yapıştırın.',
      'Hata varsa gösterilen satır ve karakter konumundan düzeltin.',
      'Geçerli çıktıyı kopyalayın.',
    ],
  },
  'xml-formatter': {
    about:
      'XML Biçimlendirici, tek satıra sıkışmış ya da düzensiz girintili XML belgelerini okunabilir bir ağaç yapısına döker. XML hâlâ SOAP servislerinde, RSS akışlarında, site haritalarında ve çok sayıda kurumsal entegrasyonda kullanılır; bu belgeler genelde makine tarafından üretildiği için insan gözüyle incelenmeden önce biçimlendirilmeleri gerekir.',
    useCases: [
      'SOAP servis isteklerini ve yanıtlarını incelemek',
      'RSS ve sitemap dosyalarındaki yapı hatalarını bulmak',
      'Kurumsal entegrasyonlarda gelen XML yükünü okunabilir hale getirmek',
    ],
    faq: [
      {
        q: 'Bozuk XML’i düzeltir mi?',
        a: 'Hayır, biçimlendirici yapıyı onarmaz. Kapanmamış etiket gibi hatalarda hatanın konumu bildirilir; düzeltme size aittir.',
      },
      {
        q: 'XML’i sıkıştırabilir miyim?',
        a: 'Evet. Girintileri ve satır sonlarını kaldıran sıkıştırma seçeneği, aktarım boyutunu düşürmek istediğinizde kullanışlıdır.',
      },
      {
        q: 'CDATA blokları korunur mu?',
        a: 'Evet. CDATA içeriğine dokunulmaz; yalnızca çevresindeki yapı yeniden girintilenir.',
      },
    ],
    steps: [
      'XML içeriğini yapıştırın.',
      'Girintileme veya sıkıştırma seçeneğini belirleyin.',
      'Sonucu kopyalayın.',
    ],
  },
  'html-formatter': {
    about:
      'HTML Biçimlendirici, iç içe geçmiş etiketleri hiyerarşiyi yansıtan bir girintiyle yeniden düzenler. Bu, yalnızca görsel bir düzeltme değildir: düzgün girintilenmiş bir belgede kapanmayan ya da yanlış yere kapanmış etiketler gözle anında fark edilir. CMS panellerinden, e-posta şablonlarından veya sayfa kaynağından kopyalanan HTML’i incelemenin en hızlı yolu budur.',
    useCases: [
      'Sayfa kaynağından kopyalanan HTML’i okunabilir hale getirmek',
      'E-posta şablonlarındaki iç içe tablo yapısını çözümlemek',
      'Kapanmayan etiketleri girinti bozulmasından tespit etmek',
    ],
    faq: [
      {
        q: 'Inline CSS ve script blokları da biçimlenir mi?',
        a: '<style> ve <script> içerikleri korunur; kendi içlerindeki biçimlendirme için CSS ve JavaScript araçlarını kullanmanız daha iyi sonuç verir.',
      },
      {
        q: 'HTML’i küçültebilir miyim?',
        a: 'Evet. Sıkıştırma seçeneği gereksiz boşluk ve satır sonlarını kaldırarak dosya boyutunu düşürür.',
      },
      {
        q: 'Kodum sunucuya gönderiliyor mu?',
        a: 'Hayır. Tüm işlem tarayıcınızda yapılır.',
      },
    ],
    steps: [
      'HTML kodunu yapıştırın.',
      'Girinti genişliğini seçin.',
      'Biçimlendirilmiş kodu kopyalayın.',
    ],
  },
  'css-minifier': {
    about:
      'CSS Küçültücü, stil dosyanızdan yorumları, gereksiz boşlukları ve satır sonlarını temizleyerek aktarılan bayt sayısını düşürür. Kazanç yazım biçimine göre değişir ama tipik olarak %20-30 civarındadır. CSS sayfanın işlemesini engelleyen bir kaynak olduğu için — tarayıcı stil dosyasını indirip çözümlemeden ilk boyamayı yapmaz — bu küçülme doğrudan algılanan yükleme hızına yansır.',
    useCases: [
      'Yayına almadan önce stil dosyalarının boyutunu düşürmek',
      'Derleme aracı bulunmayan projelerde elle küçültme yapmak',
      'Sayfa hızı raporlarındaki “CSS’i küçültün” uyarısını gidermek',
    ],
    faq: [
      {
        q: 'Küçültme stilleri bozar mı?',
        a: 'Hayır. Yalnızca anlamı etkilemeyen boşluk, satır sonu ve yorumlar kaldırılır; seçiciler ve değerler değiştirilmez.',
      },
      {
        q: 'Küçültülmüş CSS’i geri açabilir miyim?',
        a: 'Biçimlendirme geri getirilebilir ancak silinen yorumlar geri gelmez. Bu yüzden okunabilir kaynak dosyanızı her zaman ayrıca saklayın.',
      },
      {
        q: 'Kullanılmayan kuralları da siler mi?',
        a: 'Hayır. Kullanılmayan CSS’i temizlemek sayfa içeriğinin analiz edilmesini gerektirir ve bu araç bunu yapmaz.',
      },
    ],
    steps: [
      'CSS kodunuzu yapıştırın.',
      'Küçült düğmesine basın ve kazanılan boyutu görün.',
      'Çıktıyı kopyalayıp yayın dosyanızda kullanın.',
    ],
  },
  'javascript-minifier': {
    about:
      'JavaScript Küçültücü, betiğinizdeki yorumları ve gereksiz boşlukları kaldırarak dosya boyutunu azaltır. JavaScript’te bu kazanç özellikle önemlidir, çünkü tarayıcı betiği yalnızca indirmez, aynı zamanda ayrıştırıp derler; daha küçük dosya hem daha kısa indirme hem daha kısa işleme süresi demektir.',
    useCases: [
      'Derleme adımı olmayan sitelerde betikleri yayına hazırlamak',
      'Tek dosyalık widget ve gömülü betikleri hafifletmek',
      'Sayfa hızı raporlarındaki “JavaScript’i küçültün” uyarısını gidermek',
    ],
    faq: [
      {
        q: 'Kodum çalışmaz hale gelir mi?',
        a: 'Küçültme davranışı değiştirmez. Yine de küçültülmüş dosyayı yayına almadan önce test etmek, özellikle noktalı virgül kullanımı gevşek yazılmış kodlarda iyi bir alışkanlıktır.',
      },
      {
        q: 'Değişken adları kısaltılıyor mu?',
        a: 'Bu araç güvenli küçültme yapar: boşluk ve yorumları temizler, kapsam analizi gerektiren değişken adı kısaltmasına girmez.',
      },
      {
        q: 'Source map üretiyor mu?',
        a: 'Hayır. Hata ayıklama için kaynak eşlemesine ihtiyacınız varsa esbuild veya terser gibi bir derleme aracı kullanın.',
      },
    ],
    steps: [
      'JavaScript kodunu yapıştırın.',
      'Küçült düğmesine basın.',
      'Çıktıyı test edip yayın dosyanızda kullanın.',
    ],
  },
  'sql-formatter': {
    about:
      'SQL Biçimlendirici, uzun sorguları anahtar sözcükleri hizalayarak okunabilir bir düzene sokar. Bunun somut faydası incelemede ortaya çıkar: JOIN’ler alt alta dizildiğinde eksik bir birleştirme koşulu, WHERE koşulları ayrıldığında yanlış yerleştirilmiş bir OR anında görünür hale gelir. Uygulama günlüklerinden tek satır olarak çıkan sorguları çözümlemek için kullanışlıdır.',
    useCases: [
      'Uygulama günlüğünden tek satır çıkan sorguları incelemek',
      'Çok tablolu JOIN sorgularında eksik koşul aramak',
      'Ekip içi kod incelemesi öncesi sorguları standart biçime getirmek',
    ],
    faq: [
      {
        q: 'Hangi SQL lehçelerini destekliyor?',
        a: 'MySQL, PostgreSQL, SQL Server ve SQLite’ın ortak sözdizimi desteklenir. Lehçeye özgü ileri düzey ifadeler biçimlendirilir ancak doğrulanmaz.',
      },
      {
        q: 'Sorgumu çalıştırıyor mu?',
        a: 'Hayır. Araç yalnızca metni yeniden düzenler; hiçbir veritabanına bağlanmaz ve sorgu çalıştırmaz.',
      },
      {
        q: 'Sorgumdaki veriler güvende mi?',
        a: 'Evet, işlem tarayıcınızda yapılır. Yine de sorgu içindeki gerçek parola ve kişisel verileri yapıştırmadan önce temizlemeniz iyi bir alışkanlıktır.',
      },
    ],
    steps: [
      'SQL sorgunuzu yapıştırın.',
      'Anahtar sözcük büyük/küçük harf tercihinizi seçin.',
      'Biçimlendirilmiş sorguyu kopyalayın.',
    ],
  },
  'regex-tester': {
    about:
      'Regex Test Aracı, yazdığınız düzenli ifadeyi örnek metin üzerinde anında çalıştırır ve eşleşen bölümleri vurgular. Düzenli ifadeler yazarken asıl zorluk sözdizimi değil, ifadenin gerçek veride ne yakalayıp ne kaçırdığını görememektir; anlık geri bildirim bu belirsizliği ortadan kaldırır. Yakalama gruplarının içeriği de ayrıca listelenir.',
    useCases: [
      'Form doğrulama ifadelerini yayına almadan önce sınamak',
      'Günlük dosyalarından belirli desenleri ayıklamak',
      'Metin içinde toplu bul-değiştir işlemi öncesi deseni doğrulamak',
    ],
    faq: [
      {
        q: 'Hangi regex ağzı kullanılıyor?',
        a: 'JavaScript (ECMAScript) düzenli ifade motoru. PCRE’ye özgü bazı ileri özellikler burada desteklenmez.',
      },
      {
        q: 'Bayrakları nasıl kullanırım?',
        a: 'g tüm eşleşmeleri bulur, i büyük-küçük harf ayrımını kaldırır, m ^ ve $ işaretlerini her satır için geçerli kılar, s ise nokta karakterinin satır sonlarını da eşleştirmesini sağlar.',
      },
      {
        q: 'Yakalama gruplarını görebilir miyim?',
        a: 'Evet. Her eşleşmenin altında grup numarasına ve varsa grup adına göre yakalanan değerler listelenir.',
      },
    ],
    steps: [
      'Düzenli ifadenizi ve bayrakları girin.',
      'Test metnini yapıştırın; eşleşmeler anında vurgulanır.',
      'Grup çıktılarını inceleyip ifadeyi düzeltin.',
    ],
  },
  'base64-encode-decode': {
    about:
      'Base64 Kodlayıcı/Çözücü, ikili veriyi yalnızca metin taşıyabilen kanallardan geçirilebilecek bir karakter dizisine çevirir ve tersini yapar. Önemli bir noktayı belirtmek gerekir: Base64 bir şifreleme değil, bir kodlamadır. Kimse anahtar olmadan çözemesin diye değil, veri bozulmadan aktarılsın diye kullanılır ve herkes tarafından geri çözülebilir.',
    useCases: [
      'Küçük görselleri CSS veya HTML içine data URI olarak gömmek',
      'API başlıklarındaki Base64 değerlerini okumak',
      'E-posta ve yapılandırma dosyalarındaki kodlanmış alanları çözmek',
    ],
    faq: [
      {
        q: 'Base64 şifreleme midir?',
        a: 'Hayır. Anahtar gerektirmeyen, tersine çevrilebilir bir kodlamadır. Parola veya gizli anahtar saklamak için asla kullanılmamalıdır.',
      },
      {
        q: 'Veri boyutu neden artıyor?',
        a: 'Base64 her 3 baytı 4 karakterle temsil eder; bu da yaklaşık %33 büyüme demektir. Bu yüzden yalnızca küçük dosyaları gömmek mantıklıdır.',
      },
      {
        q: 'Türkçe karakterler doğru çevriliyor mu?',
        a: 'Evet. Metin önce UTF-8 olarak kodlandığı için Türkçe karakterler kayıpsız dönüştürülür.',
      },
    ],
    steps: [
      'Metni veya Base64 dizisini kutuya yapıştırın.',
      'Kodlama mı çözme mi yapacağınızı seçin.',
      'Sonucu kopyalayın.',
    ],
  },
  'uuid-generator': {
    about:
      'UUID Üretici, çakışma olasılığı pratikte sıfır kabul edilen 128 bitlik benzersiz tanımlayıcılar üretir. UUID’nin asıl avantajı merkezî bir sayaca ihtiyaç duymamasıdır: birbirinden habersiz iki sistem aynı anda kimlik üretebilir ve yine de çakışmazlar. Bu, dağıtık sistemlerde ve çevrimdışı çalışabilen istemcilerde otomatik artan sayılara göre belirleyici bir üstünlüktür.',
    useCases: [
      'Veritabanı kayıtları için tahmin edilemeyen birincil anahtar üretmek',
      'Dağıtık servislerde istek izleme kimliği (trace id) oluşturmak',
      'Dosya adlarını çakışma riski olmadan benzersizleştirmek',
    ],
    faq: [
      {
        q: 'v4 ile v7 arasındaki fark nedir?',
        a: 'v4 tamamen rastgeledir. v7 ise başına zaman damgası koyar, böylece üretim sırasına göre sıralanabilir; bu da veritabanı dizinlerinde belirgin biçimde daha iyi performans verir.',
      },
      {
        q: 'Aynı UUID iki kez üretilebilir mi?',
        a: 'Teorik olasılık sıfır değildir ama pratikte yok sayılabilir düzeydedir. v4 için çakışma yaşanması, milyarlarca kimlik üretilse dahi beklenmeyen bir olaydır.',
      },
      {
        q: 'Toplu üretim yapabilir miyim?',
        a: 'Evet. Adet belirterek tek seferde çok sayıda UUID üretip listeyi kopyalayabilirsiniz.',
      },
    ],
    steps: [
      'UUID sürümünü seçin (v4 rastgele, v7 sıralanabilir).',
      'Üretilecek adedi belirtin.',
      'Listeyi kopyalayın.',
    ],
  },
  'hash-generator': {
    about:
      'Hash Üretici, girdiğiniz metnin SHA-256, SHA-512 veya MD5 özetini hesaplar. Özet fonksiyonları tek yönlüdür: aynı girdi her zaman aynı çıktıyı verir ama çıktıdan girdiye dönülemez. Bu yüzden hash, şifreleme değil doğrulama aracıdır — bir dosyanın veya mesajın aktarım sırasında değişip değişmediğini kanıtlamak için kullanılır.',
    useCases: [
      'İndirilen bir dosyanın yayıncının duyurduğu özetle eşleştiğini doğrulamak',
      'İki metnin birebir aynı olup olmadığını hızlıca karşılaştırmak',
      'API imzası doğrulama akışlarını geliştirirken beklenen özeti üretmek',
    ],
    faq: [
      {
        q: 'MD5 hâlâ kullanılabilir mi?',
        a: 'Güvenlik amaçlı kullanılmamalıdır; çakışma üretmek uzun süredir mümkün. Yalnızca dosya bütünlüğü kontrolü gibi saldırgan varsayımı olmayan durumlarda kabul edilebilir. Güvenlik gerektiren her yerde SHA-256 kullanın.',
      },
      {
        q: 'Parolaları hash’lemek için kullanabilir miyim?',
        a: 'Hayır. Parolalar bcrypt, scrypt veya Argon2 gibi kasıtlı olarak yavaş ve tuzlu algoritmalarla saklanmalıdır. SHA-256 bu iş için fazla hızlıdır ve kaba kuvvet saldırısını kolaylaştırır.',
      },
      {
        q: 'Girdiğim metin sunucuya gidiyor mu?',
        a: 'Hayır. Hesaplama tarayıcınızın Web Crypto API’siyle cihazınızda yapılır.',
      },
    ],
    steps: [
      'Özetini almak istediğiniz metni girin.',
      'Algoritmayı seçin (SHA-256 önerilir).',
      'Üretilen özeti kopyalayın veya beklediğiniz değerle karşılaştırın.',
    ],
  },
  'jwt-decoder': {
    about:
      'JWT Çözücü, bir JSON Web Token’ın başlık ve yük bölümlerini okunabilir JSON olarak açar. Kritik bir ayrımı vurgulamak gerekir: JWT’nin yükü şifrelenmiş değil, yalnızca Base64 ile kodlanmıştır — token’ı ele geçiren herkes içeriğini okuyabilir. Bu yüzden token içine parola veya kişisel veri konulmamalı, çözülen içerik de yalnızca hata ayıklama amacıyla incelenmelidir.',
    useCases: [
      'Kimlik doğrulama hatalarında token’ın hangi talepleri (claims) taşıdığını görmek',
      'Süresi dolmuş token’ları exp alanından tespit etmek',
      'Yetki hatalarında rol ve kapsam alanlarını doğrulamak',
    ],
    faq: [
      {
        q: 'İmza doğrulanıyor mu?',
        a: 'Hayır. Bu araç token’ın içeriğini çözer; imza doğrulaması gizli anahtar gerektirir ve sunucu tarafında yapılmalıdır. Çözülebilen bir token’ın geçerli olduğu anlamına gelmez.',
      },
      {
        q: 'exp ve iat alanları ne anlama geliyor?',
        a: 'exp token’ın geçerlilik bitiş zamanı, iat ise üretilme zamanıdır. İkisi de Unix zaman damgası olarak saniye cinsinden tutulur; araç bunları okunabilir tarihe çevirir.',
      },
      {
        q: 'Token’ım sunucuya gönderiliyor mu?',
        a: 'Hayır. Çözme işlemi tamamen tarayıcınızda yapılır; token cihazınızdan çıkmaz.',
      },
    ],
    steps: [
      'JWT dizesini kutuya yapıştırın.',
      'Başlık ve yük bölümlerini inceleyin.',
      'exp alanından geçerlilik süresini kontrol edin.',
    ],
  },
  'markdown-editor': {
    about:
      'Markdown Düzenleyici, yazdığınız metnin işlenmiş halini yan tarafta anlık gösterir ve karşılığı olan HTML’i verir. Markdown’ın yaygınlaşma sebebi sadeliğidir: biçimlendirme, metnin okunmasını engellemeyen birkaç işaretle yapılır, dolayısıyla kaynak dosya ham haliyle de okunabilir kalır. README dosyaları, dokümantasyon ve blog taslakları için standart haline gelmiştir.',
    useCases: [
      'README ve dokümantasyon dosyalarını yazarken sonucu anlık görmek',
      'Blog taslaklarını hazırlayıp HTML çıktısını CMS’e aktarmak',
      'Markdown sözdizimini öğrenirken denemeler yapmak',
    ],
    faq: [
      {
        q: 'Tablo ve kod bloğu destekleniyor mu?',
        a: 'Evet. Başlık, liste, bağlantı, görsel, alıntı, tablo ve üç ters tırnaklı kod blokları işlenir.',
      },
      {
        q: 'HTML çıktısını alabilir miyim?',
        a: 'Evet. Önizlemenin karşılığı olan HTML’i tek tıkla kopyalayabilirsiniz.',
      },
      {
        q: 'Yazdıklarım kaydediliyor mu?',
        a: 'Metin yalnızca tarayıcınızda tutulur, sunucuya gönderilmez. Sayfayı kapatmadan önce içeriğinizi kopyalamayı unutmayın.',
      },
    ],
    steps: [
      'Sol bölüme Markdown metninizi yazın.',
      'Sağdaki önizlemeden sonucu kontrol edin.',
      'Markdown veya HTML çıktısını kopyalayın.',
    ],
  },
  'cron-generator': {
    about:
      'Cron İfadesi Oluşturucu, zamanlanmış görevlerin çalışma takvimini belirleyen beş alanlı ifadeyi hazırlar ve ne anlama geldiğini düz Türkçe açıklar. Cron sözdizimi kısa olduğu kadar yanıltıcıdır: alanların sırası (dakika, saat, ayın günü, ay, haftanın günü) ve yıldız ile aralık işaretlerinin birlikte davranışı sık hataya yol açar. Araç ifadeyi yazarken sonraki çalışma zamanlarını da gösterir.',
    useCases: [
      'Yedekleme ve rapor görevlerinin çalışma saatini belirlemek',
      'Devraldığınız sistemlerdeki mevcut cron ifadelerini çözümlemek',
      'CI/CD ve zamanlanmış iş tanımlarını yazarken sözdizimini doğrulamak',
    ],
    faq: [
      {
        q: 'Alanların sırası nedir?',
        a: 'Soldan sağa: dakika (0-59), saat (0-23), ayın günü (1-31), ay (1-12), haftanın günü (0-7; hem 0 hem 7 pazar demektir).',
      },
      {
        q: '*/15 ne anlama gelir?',
        a: 'İlgili alanda “her 15 birimde bir” demektir. Dakika alanında yazıldığında görev saat başı, 15, 30 ve 45’te çalışır.',
      },
      {
        q: 'Cron hangi saat dilimini kullanır?',
        a: 'Görevi çalıştıran sunucunun sistem saat dilimini. Sunucu UTC ise ifadeyi UTC’ye göre yazmanız gerekir; yaz saati uygulaması olan dilimlerde bu ayrım önemlidir.',
      },
    ],
    steps: [
      'Çalışma sıklığını hazır seçeneklerden belirleyin veya alanları elle girin.',
      'Açıklama metninden ifadenin doğru okunduğunu doğrulayın.',
      'Cron ifadesini kopyalayıp görev tanımınıza ekleyin.',
    ],
  },

  // ─────────────────────────────── Araçlar ───────────────────────────
  'qr-code-generator': {
    faq: [
      {
        q: 'QR kodun süresi doluyor mu?',
        a: 'Hayır. Burada üretilen kodlar statiktir: veri doğrudan desenin içine yazılır, aradan geçen bir yönlendirme servisi yoktur. Kod hiçbir zaman devre dışı kalmaz.',
      },
      {
        q: 'Ticari olarak kullanabilir miyim?',
        a: 'Evet. Ürettiğiniz kodları menü, kartvizit, ambalaj ve tabelalarda serbestçe kullanabilirsiniz; herhangi bir atıf ya da ücret gerekmez.',
      },
      {
        q: 'Baskı için hangi boyutu seçmeliyim?',
        a: 'Baskıda PNG yerine yüksek çözünürlüklü çıktıyı tercih edin ve kodun basılı kenar uzunluğunu en az 2 cm tutun. Ayrıca kodun etrafındaki boş çerçeveyi kaldırmayın; okuyucular bu boşluğa ihtiyaç duyar.',
      },
    ],
    steps: [
      'Kodlanacak bağlantıyı veya metni girin.',
      'Boyut ve hata düzeltme seviyesini ayarlayın.',
      'Kodu indirin ve yazdırmadan önce telefonla test edin.',
    ],
  },
  'password-generator': {
    about:
      'Parola Üretici, tarayıcınızın kriptografik rastgelelik kaynağını kullanarak tahmin edilmesi pratikte imkânsız parolalar oluşturur. Parola güvenliğinde belirleyici etken karmaşıklıktan çok uzunluktur: 8 karakterlik karmaşık bir parola, 16 karakterlik daha sade bir parolaya göre çok daha hızlı kırılır, çünkü her ek karakter denenecek olasılık sayısını üstel olarak artırır.',
    useCases: [
      'Her hesap için farklı ve tekrar kullanılmayan parolalar üretmek',
      'Sunucu, veritabanı ve servis hesapları için uzun rastgele anahtar oluşturmak',
      'Wi-Fi ağı ve paylaşılan hesaplar için güçlü parola belirlemek',
    ],
    faq: [
      {
        q: 'Parola kaç karakter olmalı?',
        a: 'Kişisel hesaplar için en az 16, kritik hesaplar için 20 ve üzeri hedefleyin. Bir parola yöneticisi kullanıyorsanız uzunluğu ezberleme kaygısı olmadan artırabilirsiniz.',
      },
      {
        q: 'Ürettiğim parola kaydediliyor mu?',
        a: 'Hayır. Üretim tarayıcınızda crypto.getRandomValues ile yapılır; parola hiçbir sunucuya gönderilmez ve saklanmaz.',
      },
      {
        q: 'Aynı parolayı birden fazla yerde kullanabilir miyim?',
        a: 'Kullanmayın. Bir sitede sızan parola, aynı parolayı kullandığınız tüm hesapları riske atar; bu saldırı yöntemine kimlik doldurma (credential stuffing) denir ve çok yaygındır.',
      },
    ],
    steps: [
      'Parola uzunluğunu belirleyin.',
      'Büyük harf, rakam ve sembol seçeneklerini işaretleyin.',
      'Üretilen parolayı kopyalayıp parola yöneticinize kaydedin.',
    ],
  },
  'lorem-ipsum-generator': {
    about:
      'Lorem Ipsum Üretici, tasarım ve şablon çalışmalarında gerçek metnin yerine geçecek dolgu metin üretir. Anlamsız bir metnin tercih edilmesinin sebebi vardır: okunabilir bir metin, inceleyenin dikkatini içeriğe kaydırır ve tipografi, satır aralığı, sütun genişliği gibi asıl değerlendirilmesi gereken unsurlar gözden kaçar. Kelime, cümle veya paragraf sayısı belirleyerek üretim yapabilirsiniz.',
    useCases: [
      'Arayüz tasarımlarında metin alanlarının gerçekçi doluluğunu görmek',
      'Şablon ve tema geliştirirken taşma davranışını test etmek',
      'Baskı çalışmalarında sayfa düzenini içerik hazır olmadan kurmak',
    ],
    faq: [
      {
        q: 'Türkçe dolgu metin üretebilir miyim?',
        a: 'Klasik Latince metnin yanında Türkçe karakter yoğunluğunu yansıtan bir seçenek de bulunur; Türkçe arayüzlerde satır uzunluğunu daha gerçekçi test etmenizi sağlar.',
      },
      {
        q: 'Kaç paragraf üretebilirim?',
        a: 'İhtiyacınız kadar. Kelime, cümle veya paragraf birimlerinden birini seçip adet belirtebilirsiniz.',
      },
      {
        q: 'Dolgu metni yayına alabilir miyim?',
        a: 'Almayın. Yayındaki bir sayfada kalan dolgu metin hem kullanıcı için anlamsızdır hem de arama motorları tarafından değersiz içerik olarak değerlendirilir.',
      },
    ],
    steps: [
      'Birim seçin: kelime, cümle veya paragraf.',
      'Üretilecek adedi girin.',
      'Metni kopyalayıp tasarımınızda kullanın.',
    ],
  },
  'random-number-generator': {
    about:
      'Rastgele Sayı Üretici, belirlediğiniz aralıkta rastgele tamsayılar üretir. Aynı sayının tekrar etmesini istemediğiniz durumlar için benzersiz üretim seçeneği sunar — çekiliş ve kura gibi kullanımlarda asıl ihtiyaç duyulan budur. Üretim tarayıcının rastgelelik kaynağıyla yapılır ve hiçbir sonuç kaydedilmez.',
    useCases: [
      'Sosyal medya çekilişlerinde katılımcı sırası belirlemek',
      'Turnuva ve etkinliklerde kura çekmek',
      'Test verisi üretirken rastgele değerler oluşturmak',
    ],
    faq: [
      {
        q: 'Aynı sayının tekrarını engelleyebilir miyim?',
        a: 'Evet. Benzersiz üretim seçeneğini işaretlediğinizde her sayı yalnızca bir kez çıkar; bu durumda istenen adet, aralığın genişliğinden büyük olamaz.',
      },
      {
        q: 'Sonuçlar gerçekten rastgele mi?',
        a: 'Tarayıcının kriptografik rastgelelik kaynağı kullanılır. Çekiliş ve kura gibi kullanımlar için fazlasıyla yeterlidir.',
      },
      {
        q: 'Sonuçlar kaydediliyor mu?',
        a: 'Hayır. Üretilen sayılar hiçbir yere gönderilmez; sayfayı yenilediğinizde kaybolur. Kayıt tutmanız gerekiyorsa ekran görüntüsü alın.',
      },
    ],
    steps: [
      'Alt ve üst sınırı girin.',
      'Kaç sayı üretileceğini ve tekrar olup olmayacağını seçin.',
      'Sonuçları görüntüleyin veya kopyalayın.',
    ],
  },
  'random-name-generator': {
    about:
      'Rastgele İsim Üretici, test verisi ve tasarım çalışmaları için gerçekçi görünen ad-soyad kombinasyonları üretir. Geliştirme ortamlarında gerçek kişilerin adlarını kullanmak hem kişisel veri riski taşır hem de ekran görüntüsü paylaşımını zorlaştırır; üretilmiş adlar bu iki sorunu birden çözer.',
    useCases: [
      'Uygulama demolarında ve ekran görüntülerinde örnek kullanıcı listesi oluşturmak',
      'Veritabanı ve form testleri için sahte kayıt üretmek',
      'Tasarım şablonlarında gerçekçi isim alanları doldurmak',
    ],
    faq: [
      {
        q: 'Türkçe isimler üretebilir miyim?',
        a: 'Evet. Türkçe ad ve soyad havuzu ile uluslararası havuz arasında seçim yapabilirsiniz.',
      },
      {
        q: 'Üretilen isimler gerçek kişilere ait mi?',
        a: 'İsimler yaygın ad ve soyadların rastgele eşleştirilmesiyle oluşur. Rastlantı sonucu gerçek bir kişiyle örtüşebilir; bu yüzden üretilen adları gerçek kişi verisiymiş gibi kullanmayın.',
      },
      {
        q: 'Toplu üretim yapabilir miyim?',
        a: 'Evet. Adet belirterek liste üretebilir ve tamamını tek seferde kopyalayabilirsiniz.',
      },
    ],
    steps: [
      'İsim havuzunu ve cinsiyet tercihini seçin.',
      'Üretilecek adedi girin.',
      'Listeyi kopyalayın.',
    ],
  },
  'age-calculator': {
    about:
      'Yaş Hesaplama, iki tarih arasındaki farkı yıl, ay ve gün olarak ayrıştırır. Basit görünse de doğru hesaplaması inceliklidir: ayların gün sayısı eşit değildir ve artık yıllar araya girer, bu yüzden “toplam gün sayısını 365’e bölmek” yanlış sonuç verir. Araç takvim kurallarını uygulayarak hesaplar ve bir sonraki doğum gününe kalan süreyi de gösterir.',
    useCases: [
      'Resmî başvurularda yaş şartını gün gün doğrulamak',
      'İki tarih arasındaki kıdem veya süreyi hesaplamak',
      'Doğum günü ve yıldönümlerine kalan süreyi öğrenmek',
    ],
    faq: [
      {
        q: 'Artık yıllar hesaba katılıyor mu?',
        a: 'Evet. Hesaplama takvim kurallarına göre yapılır; 29 Şubat doğumlular dahil doğru sonuç verir.',
      },
      {
        q: 'Geçmiş dışında bir tarihe göre hesaplayabilir miyim?',
        a: 'Evet. Bitiş tarihini değiştirerek belirli bir tarihte kaç yaşında olacağınızı hesaplayabilirsiniz.',
      },
      {
        q: 'Doğum tarihim kaydediliyor mu?',
        a: 'Hayır. Hesaplama tarayıcınızda yapılır ve girdiğiniz tarih hiçbir yere gönderilmez.',
      },
    ],
    steps: [
      'Doğum tarihini girin.',
      'Gerekirse hesaplamanın yapılacağı bitiş tarihini değiştirin.',
      'Yıl, ay ve gün ayrıntısındaki sonucu görün.',
    ],
  },
  'unit-converter': {
    about:
      'Birim Dönüştürücü, uzunluk, ağırlık, sıcaklık, alan, hacim ve veri boyutu birimleri arasında çeviri yapar. Sıcaklık dönüşümü diğerlerinden farklı çalışır ve bu fark önemlidir: uzunluk veya ağırlıkta yalnızca bir katsayıyla çarpma yeterliyken, Celsius-Fahrenheit dönüşümünde ayrıca bir kayma değeri vardır, bu yüzden oranla hesaplamak yanlış sonuç verir.',
    useCases: [
      'Yurt dışı kaynaklı ölçüleri (inç, pound, Fahrenheit) metrik sisteme çevirmek',
      'Tarif ve teknik belgelerdeki hacim birimlerini dönüştürmek',
      'Dosya boyutu birimlerini (MB, GB, MiB) karşılaştırmak',
    ],
    faq: [
      {
        q: 'MB ile MiB arasındaki fark nedir?',
        a: 'MB 1.000.000 bayt, MiB ise 1.048.576 bayttır. İşletim sistemleri ve disk üreticileri farklı birim kullandığı için “1 TB disk neden 931 GB görünüyor” sorusunun cevabı budur.',
      },
      {
        q: 'Sonuçlar kaç basamak gösteriliyor?',
        a: 'Sonuçlar anlamlı basamak sayısına göre yuvarlanır; çok küçük veya çok büyük değerlerde bilimsel gösterime geçilir.',
      },
      {
        q: 'Para birimi çevirisi yapıyor mu?',
        a: 'Hayır. Döviz kurları anlık değiştiği için bu araç yalnızca sabit tanımlı fiziksel birimleri dönüştürür.',
      },
    ],
    steps: [
      'Dönüştürmek istediğiniz birim kategorisini seçin.',
      'Kaynak ve hedef birimleri belirleyip değeri girin.',
      'Sonucu okuyun veya kopyalayın.',
    ],
  },
  'timezone-converter': {
    about:
      'Saat Dilimi Dönüştürücü, bir tarih ve saatin farklı şehirlerdeki karşılığını gösterir. Elle hesaplamanın güvenilmez olmasının sebebi yaz saati uygulamasıdır: birçok ülke yılda iki kez saatini kaydırır ve bu geçişlerin tarihleri ülkeden ülkeye değişir, dolayısıyla iki şehir arasındaki fark yıl boyunca sabit kalmaz. Araç güncel saat dilimi verisini kullanarak bu kaymaları hesaba katar.',
    useCases: [
      'Farklı ülkelerdeki ekiplerle toplantı saati belirlemek',
      'Yurt dışı uçuş ve etkinlik saatlerini yerel saate çevirmek',
      'Uzaktan çalışmada mesai kesişim saatlerini bulmak',
    ],
    faq: [
      {
        q: 'Yaz saati uygulaması hesaba katılıyor mu?',
        a: 'Evet. Dönüşüm seçtiğiniz tarihe göre yapılır; o tarihte ilgili ülkede yaz saati uygulanıyorsa fark buna göre hesaplanır.',
      },
      {
        q: 'Türkiye hangi saat diliminde?',
        a: 'Türkiye 2016’dan bu yana yıl boyunca UTC+3 kullanır ve yaz saati uygulamasına geçmez. Bu yüzden Avrupa ile arasındaki fark yaz ve kış aylarında değişir.',
      },
      {
        q: 'Birden fazla şehri aynı anda görebilir miyim?',
        a: 'Evet. Karşılaştırma listesine birden fazla şehir ekleyerek aynı anın hepsindeki karşılığını yan yana görebilirsiniz.',
      },
    ],
    steps: [
      'Kaynak şehri, tarihi ve saati girin.',
      'Karşılaştırmak istediğiniz şehirleri ekleyin.',
      'Karşılık gelen yerel saatleri görün.',
    ],
  },
  'color-picker': {
    about:
      'Renk Seçici, bir rengi HEX, RGB ve HSL gösterimleri arasında çevirir. Üç gösterim aynı rengi tarif eder ama farklı işler için elverişlidir: HEX kısa olduğu için CSS’te yaygındır, RGB kanal değerlerini doğrudan gösterir, HSL ise ton-doygunluk-parlaklık ayrımı sayesinde bir rengin daha açık veya daha soluk varyantını üretmeyi kolaylaştırır.',
    useCases: [
      'Tasarımdan alınan rengin CSS karşılığını bulmak',
      'Bir ana rengin açık ve koyu varyantlarını HSL üzerinden türetmek',
      'Marka renklerini farklı gösterimlerde belgelemek',
    ],
    faq: [
      {
        q: 'HEX ile RGB arasındaki fark nedir?',
        a: 'Fark yalnızca yazımdadır; ikisi de aynı üç kanalı (kırmızı, yeşil, mavi) tarif eder. HEX bu değerleri on altılık tabanda kısaca yazar.',
      },
      {
        q: 'Saydamlık değerini de alabilir miyim?',
        a: 'Evet. Alfa kanalı ile 8 haneli HEX veya rgba() gösterimi üretebilirsiniz.',
      },
      {
        q: 'HSL neden kullanışlı?',
        a: 'Tonu sabit tutup parlaklığı değiştirerek bir rengin uyumlu varyantlarını üretebilirsiniz; aynı işi RGB kanallarıyla yapmak çok daha zordur.',
      },
    ],
    steps: [
      'Paletten bir renk seçin veya mevcut değeri yapıştırın.',
      'HEX, RGB ve HSL karşılıklarını görün.',
      'İhtiyacınız olan gösterimi kopyalayın.',
    ],
  },
  'gradient-generator': {
    about:
      'Gradyan Oluşturucu, iki veya daha fazla renk arasında geçiş yapan CSS arka planları üretir. Doğrusal (linear) ve dairesel (radial) gradyanlar arasında seçim yapabilir, açıyı ve renk duraklarının konumunu ayarlayabilirsiniz. Araç sonucu anında önizler ve doğrudan yapıştırılabilecek CSS kodunu verir; böylece kodu yazıp sayfayı yenileyerek deneme döngüsüne girmezsiniz.',
    useCases: [
      'Kahraman (hero) bölümleri için arka plan geçişi hazırlamak',
      'Buton ve kart bileşenlerine derinlik katan yumuşak geçişler üretmek',
      'Marka renklerinden tutarlı bir gradyan seti oluşturmak',
    ],
    faq: [
      {
        q: 'İkiden fazla renk kullanabilir miyim?',
        a: 'Evet. İstediğiniz kadar renk durağı ekleyip her birinin yüzde konumunu ayrı ayrı belirleyebilirsiniz.',
      },
      {
        q: 'Üretilen kod tüm tarayıcılarda çalışır mı?',
        a: 'Evet. linear-gradient ve radial-gradient güncel tüm tarayıcılarda ön ek gerektirmeden desteklenir.',
      },
      {
        q: 'Gradyanı görsel olarak indirebilir miyim?',
        a: 'Asıl çıktı CSS kodudur; bu, ölçeklenebilir ve dosya boyutu sıfır olduğu için görsel kullanmaktan daha verimlidir.',
      },
    ],
    steps: [
      'Renkleri ve durak konumlarını belirleyin.',
      'Gradyan türünü ve açıyı ayarlayıp önizlemeyi izleyin.',
      'Üretilen CSS kodunu kopyalayın.',
    ],
  },
  'palette-generator': {
    about:
      'Renk Paleti Oluşturucu, seçtiğiniz bir ana renkten renk çemberi ilişkilerine dayanan uyumlu paletler türetir. Tamamlayıcı, üçlü ve analog gibi şemalar keyfi değildir; renk çemberi üzerindeki açı ilişkilerini kullanır — örneğin tamamlayıcı renkler karşılıklı durur ve bu yüzden birbirini en güçlü şekilde vurgular, analog renkler ise komşu oldukları için sakin ve uyumlu bir izlenim verir.',
    useCases: [
      'Yeni bir marka veya arayüz için renk sistemi kurmak',
      'Mevcut ana renge uygun vurgu rengi belirlemek',
      'Sunum ve grafik çalışmalarında tutarlı renk seti hazırlamak',
    ],
    faq: [
      {
        q: 'Hangi şemayı seçmeliyim?',
        a: 'Güçlü bir vurgu istiyorsanız tamamlayıcı, sakin ve bütünlüklü bir görünüm için analog şemayı seçin. Üçlü şema canlıdır ama dengelemesi daha zordur.',
      },
      {
        q: 'Palet erişilebilirlik için yeterli mi?',
        a: 'Palet uyumu ile okunabilirlik ayrı konulardır. Metin ve arka plan arasındaki kontrast oranını ayrıca kontrol edin; normal metin için en az 4,5:1 önerilir.',
      },
      {
        q: 'Paleti dışa aktarabilir miyim?',
        a: 'Evet. Renklerin HEX değerlerini liste halinde veya CSS değişkenleri olarak kopyalayabilirsiniz.',
      },
    ],
    steps: [
      'Ana rengi seçin.',
      'Uyum şemasını belirleyin (tamamlayıcı, analog, üçlü…).',
      'Üretilen paleti kopyalayın veya dışa aktarın.',
    ],
  },
  'countdown-timer': {
    about:
      'Geri Sayım Sayacı, belirlediğiniz süre veya hedef tarihe kadar kalan zamanı gösterir ve süre dolduğunda uyarı verir. Sayım tarayıcının kendi zaman kaynağıyla yürür; sekmeyi arka plana aldığınızda bile hedef zamana göre hesaplandığı için kayma oluşmaz. Süre dolduğunda sesli ve görsel bildirim alırsınız.',
    useCases: [
      'Sunum ve toplantılarda konuşma süresini takip etmek',
      'Pomodoro tekniğiyle odaklanma ve mola sürelerini ölçmek',
      'Mutfakta pişirme sürelerini takip etmek',
    ],
    faq: [
      {
        q: 'Sekmeyi değiştirirsem sayım durur mu?',
        a: 'Hayır. Kalan süre hedef zamana göre hesaplandığı için sekme arka planda kalsa da doğru sonuç verir.',
      },
      {
        q: 'Sesli uyarı var mı?',
        a: 'Evet. Süre dolduğunda sesli uyarı çalar. Sesin çalabilmesi için tarayıcının sekmeye ses izni vermiş olması gerekir; ilk kullanımda sayfaya bir kez tıklamanız yeterlidir.',
      },
      {
        q: 'Sayfayı yenilersem sayaç sıfırlanır mı?',
        a: 'Evet, sayfa yenilendiğinde sayaç baştan başlar.',
      },
    ],
    steps: [
      'Süreyi girin veya hedef tarih ve saati seçin.',
      'Başlat düğmesine basın.',
      'Süre dolduğunda uyarıyı alın; gerekirse duraklatın veya sıfırlayın.',
    ],
  },
  stopwatch: {
    about:
      'Kronometre, geçen süreyi milisaniye hassasiyetinde ölçer ve ara zaman (tur) kaydı tutmanıza olanak verir. Tur kaydının pratik değeri şudur: sayacı durdurmadan ara zaman alabilirsiniz, böylece hem toplam süre hem de her bir aşamanın süresi ayrı ayrı görünür. Ölçüm tarayıcının yüksek çözünürlüklü zamanlayıcısına dayanır.',
    useCases: [
      'Antrenman ve koşu turlarının süresini ölçmek',
      'İş akışlarında bir adımın ne kadar sürdüğünü kayıt altına almak',
      'Sunum provalarında bölüm sürelerini takip etmek',
    ],
    faq: [
      {
        q: 'Tur kaydı nasıl çalışır?',
        a: 'Tur düğmesine bastığınızda o ana kadar geçen süre listeye eklenir ve sayaç durmadan devam eder. Her tur, bir önceki tura göre farkıyla birlikte gösterilir.',
      },
      {
        q: 'Ölçüm ne kadar hassas?',
        a: 'Milisaniye düzeyinde. Tarayıcı zamanlayıcılarının doğası gereği çok kısa aralıklarda birkaç milisaniyelik sapma olabilir.',
      },
      {
        q: 'Kayıtlar saklanıyor mu?',
        a: 'Hayır. Tur kayıtları yalnızca sayfa açık kaldığı sürece durur; sayfayı kapattığınızda silinir.',
      },
    ],
    steps: [
      'Başlat düğmesine basın.',
      'Ara zaman almak için Tur düğmesini kullanın.',
      'Durdurun ve tur listesini inceleyin.',
    ],
  },
};
