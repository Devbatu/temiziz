import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description:
    'MultiTools gizlilik politikası: hangi verileri işliyoruz, dosyalarınıza ne oluyor ve haklarınız neler.',
  alternates: { canonical: '/privacy' },
};

const sections = [
  {
    title: 'Hangi verileri işliyoruz?',
    body: 'Araçları kullanmak için hesap açmanız gerekmez ve sizden kişisel bilgi istemeyiz. Yalnızca anonim kullanım istatistikleri (hangi araç sayfasının görüntülendiği gibi) toplanır.',
  },
  {
    title: 'Yüklediğim dosyalar nereye gidiyor?',
    body: 'Platformdaki araçların büyük bölümü tamamen tarayıcınızda çalışır. PDF birleştirme, görsel sıkıştırma, biçimlendiriciler ve üreticiler dahil olmak üzere bu araçlarda dosyanız cihazınızdan hiç çıkmaz. Sunucu tarafında çalışması gereken araçlarda dosyalar işlem tamamlanır tamamlanmaz silinir ve hiçbir şekilde arşivlenmez.',
  },
  {
    title: 'Çerezler ve yerel depolama',
    body: 'Kendi kullandığımız çerezler işlevseldir: tema tercihiniz gibi ayarları tarayıcınızın yerel depolamasında tutarız. Bu veriler sunucularımıza gönderilmez ve tarayıcı verilerinizi temizlediğinizde silinir. Bunun dışında reklam ağlarının yerleştirdiği çerezler bulunur; bunlar aşağıda ayrıca açıklanmıştır.',
  },
  {
    title: 'Reklamlar ve Google AdSense',
    body: 'Bu sitede Google AdSense üzerinden reklam yayınlanmaktadır. Üçüncü taraf bir satıcı olarak Google, bu sitedeki reklamları yayınlamak için çerez kullanır. Google’ın kullandığı DoubleClick çerezi, kullanıcıların bu siteye ve internetteki diğer sitelere yaptığı ziyaretlere dayanarak reklam sunmasını sağlar. Reklam yayınlayan diğer üçüncü taraf sağlayıcılar ve reklam ağları da bu sitede reklam göstermek için çerez kullanabilir; bu çerezlere erişimimiz veya bunlar üzerinde denetimimiz yoktur.',
  },
  {
    title: 'Kişiselleştirilmiş reklamları devre dışı bırakma',
    body: 'Kişiselleştirilmiş reklamları Google Reklam Ayarları sayfasından (adssettings.google.com) kapatabilirsiniz. Üçüncü taraf sağlayıcıların kişiselleştirilmiş reklam kullanımını ise aboutads.info/choices veya youronlinechoices.eu adreslerinden topluca devre dışı bırakabilirsiniz. Kişiselleştirmeyi kapatmak reklamları kaldırmaz; yalnızca ilgi alanlarınıza göre seçilmelerini engeller.',
  },
  {
    title: 'Ölçümleme',
    body: 'Hangi sayfaların görüntülendiğini anlamak için anonim kullanım istatistikleri toplarız. Bu kayıtlarda adınız, e-postanız veya araçlara girdiğiniz içerik yer almaz; amaç yalnızca hangi araçların geliştirilmeye değer olduğunu görmektir.',
  },
  {
    title: 'Üçüncü taraf servisler',
    body: 'DNS Sorgulama gibi bazı araçlar, sorguyu doğrudan tarayıcınızdan üçüncü taraf bir genel servise (örneğin Cloudflare DNS) gönderir. Bu istekler sunucularımızdan geçmez, ancak ilgili servisin kendi gizlilik politikasına tabidir.',
  },
  {
    title: 'Çocukların gizliliği',
    body: 'Bu site 13 yaşın altındaki çocuklara yönelik değildir ve bu yaş grubundan bilerek kişisel veri toplamayız.',
  },
  {
    title: 'Haklarınız',
    body: 'Kimliğinizi belirleyecek veri tutmadığımız için silme talebi genellikle gerekmez. KVKK ve GDPR kapsamındaki bilgi edinme, düzeltme ve silme haklarınızı kullanmak ya da sorularınızı iletmek için iletişim sayfamızdaki formu kullanabilirsiniz.',
  },
  {
    title: 'Bu politikadaki değişiklikler',
    body: 'Politikayı zaman zaman güncelleyebiliriz. Değişiklikler bu sayfada yayımlandığı anda geçerli olur; sayfanın başındaki güncelleme tarihinden en son ne zaman değiştiğini görebilirsiniz.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Gizlilik Politikası</h1>
      <p className="mt-3 text-sm text-muted">
        Son güncelleme: {new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' })}
      </p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-xl font-bold">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-muted">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
