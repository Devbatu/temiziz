import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Faq } from '@/components/ui/Faq';
import { toolCount } from '@/lib/tools';

export const metadata: Metadata = {
  title: 'Premium Üyelik',
  description:
    'Reklamsız deneyim, toplu işlem, yüksek dosya limitleri ve API erişimi için MultiTools Premium planları.',
  alternates: { canonical: '/pricing' },
};

const plans = [
  {
    name: 'Ücretsiz',
    price: '₺0',
    period: 'sonsuza kadar',
    description: 'Günlük ihtiyaçlarınız için yeterli.',
    features: [
      `${toolCount}+ aracın tamamına erişim`,
      'Üyelik gerekmez',
      '25 MB’a kadar dosya boyutu',
      'Standart işlem hızı',
      'Reklam destekli',
    ],
    cta: 'Hemen kullan',
    href: '/tools',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '₺99',
    period: '/ ay',
    description: 'Yoğun kullanım ve profesyonel işler için.',
    features: [
      'Ücretsiz plandaki her şey',
      'Reklamsız deneyim',
      '1 GB’a kadar dosya boyutu',
      'Toplu (batch) işlem',
      'Öncelikli işlem kuyruğu',
      'İşlem geçmişi ve bulut kaydı',
      'E-posta desteği',
    ],
    cta: 'Premium’a geç',
    href: '/contact',
    highlight: true,
  },
  {
    name: 'API / İş',
    price: '₺499',
    period: '/ ay',
    description: 'Araçları kendi ürününüze entegre edin.',
    features: [
      'Premium’daki her şey',
      '100.000 API isteği / ay',
      'Kendi alan adınızla beyaz etiket',
      'Webhook ve otomasyon desteği',
      'SLA garantili çalışma süresi',
      'Özel entegrasyon desteği',
    ],
    cta: 'İletişime geç',
    href: '/contact',
    highlight: false,
  },
];

const faq = [
  {
    q: 'Ücretsiz plan gerçekten sınırsız mı?',
    a: 'Evet, araçların tamamını ücretsiz kullanabilirsiniz. Yalnızca dosya boyutu ve toplu işlem gibi ağır kullanım senaryolarında limitler vardır.',
  },
  {
    q: 'İstediğim zaman iptal edebilir miyim?',
    a: 'Evet. Abonelik taahhüt içermez; dilediğiniz an tek tıkla iptal edebilirsiniz. Dönem sonuna kadar erişiminiz devam eder.',
  },
  {
    q: 'Fatura kesiliyor mu?',
    a: 'Evet, tüm ödemeler için e-fatura düzenlenir. Kurumsal fatura bilgilerinizi hesap ayarlarından girebilirsiniz.',
  },
  {
    q: 'API limitini aşarsam ne olur?',
    a: 'İstekleriniz engellenmez; aşan kısım kullandıkça öde modeliyle faturalandırılır ve panelden anlık olarak takip edebilirsiniz.',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Basit ve şeffaf fiyatlandırma
        </span>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
          İhtiyacınıza uygun planı seçin
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Temel araçlar her zaman ücretsiz. Premium yalnızca ağır kullanım ve entegrasyon
          ihtiyaçlarınız için.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-2xl p-7 ${
              plan.highlight
                ? 'bg-gradient-to-br from-brand-600 to-violet-600 text-white shadow-2xl shadow-brand-600/25 lg:-mt-4 lg:mb-[-1rem]'
                : 'surface'
            }`}
          >
            {plan.highlight && (
              <span className="absolute right-6 top-6 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold">
                En popüler
              </span>
            )}
            <h2 className="text-lg font-bold">{plan.name}</h2>
            <p className={`mt-1 text-sm ${plan.highlight ? 'text-white/80' : 'text-muted'}`}>
              {plan.description}
            </p>
            <p className="mt-6 flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold">{plan.price}</span>
              <span className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-muted'}`}>
                {plan.period}
              </span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${
                      plan.highlight ? 'text-white' : 'text-emerald-500'
                    }`}
                  />
                  <span className={plan.highlight ? '' : 'text-muted'}>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-7 inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                plan.highlight
                  ? 'bg-white text-brand-700'
                  : 'bg-gradient-to-r from-brand-600 to-violet-600 text-white'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <section className="mx-auto mt-16 max-w-3xl">
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight">Sık sorulan sorular</h2>
        <Faq items={faq} />
      </section>
    </div>
  );
}
