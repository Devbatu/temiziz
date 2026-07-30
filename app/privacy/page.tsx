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
    title: 'Çerezler',
    body: 'Yalnızca tema tercihiniz gibi işlevsel bilgileri tarayıcınızın yerel depolamasında tutarız. Reklam alanları kullanıldığında ilgili reklam ağının kendi çerez politikası geçerli olur.',
  },
  {
    title: 'Üçüncü taraf servisler',
    body: 'DNS Sorgulama gibi bazı araçlar, sorguyu doğrudan tarayıcınızdan üçüncü taraf bir genel servise (örneğin Cloudflare DNS) gönderir. Bu istekler sunucularımızdan geçmez.',
  },
  {
    title: 'Haklarınız',
    body: 'Kimliğinizi belirleyecek veri tutmadığımız için silme talebi genellikle gerekmez. Yine de sorularınız için destek@multitools.app adresinden bize ulaşabilirsiniz.',
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
