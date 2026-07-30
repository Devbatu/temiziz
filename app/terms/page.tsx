import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kullanım Şartları',
  description: 'MultiTools platformunu kullanırken geçerli olan koşullar ve sorumluluk sınırları.',
  alternates: { canonical: '/terms' },
};

const sections = [
  {
    title: 'Hizmetin kapsamı',
    body: 'MultiTools, çeşitli dosya ve metin işleme araçlarını ücretsiz olarak sunar. Araçlar “olduğu gibi” sağlanır; kesintisiz veya hatasız çalışacağı taahhüt edilmez.',
  },
  {
    title: 'Kabul edilebilir kullanım',
    body: 'Araçları yasa dışı içerik üretmek, başkalarının haklarını ihlal etmek veya sistemin altyapısına zarar verecek şekilde otomatik toplu istek göndermek için kullanamazsınız.',
  },
  {
    title: 'İçerik sorumluluğu',
    body: 'İşlediğiniz dosya ve metinlerin içeriğinden yalnızca siz sorumlusunuz. Üzerinde işlem yaptığınız içeriğin gerekli haklarına sahip olduğunuzu kabul edersiniz.',
  },
  {
    title: 'Sorumluluk sınırı',
    body: 'Araçların kullanımı sonucunda oluşabilecek veri kaybı veya dolaylı zararlardan sorumlu tutulamayız. Önemli dosyalarınızın yedeğini almanızı öneririz.',
  },
  {
    title: 'Değişiklikler',
    body: 'Bu şartlar zaman zaman güncellenebilir. Güncel sürüm her zaman bu sayfada yayınlanır.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Kullanım Şartları</h1>
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
